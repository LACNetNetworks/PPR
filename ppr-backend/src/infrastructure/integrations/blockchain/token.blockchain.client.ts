import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, ContractFactory, ethers } from 'ethers';
import { TokenBlockchainPort } from '../../../application/integrations/ports/token.blockchain.port';
import { BlockchainSignerFactory } from './providers/blockchain-signer.factory';
import { Wallet,formatEther } from 'ethers';

import tokenAbi from './abi/tokenppr.abi.json';
import tokenBytecode from './abi/tokenppr-bytecode.json';

import tokenGasAbi from './abi/tokenppr-gas.abi.json';
import tokenGasBytecode from './abi/tokenppr-gas-bytecode.json';

function ensureBytes32(input: string): string {
  if (input.startsWith('0x') && input.length === 66) return input;
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}

function ensureAddress(addr: string): string {
  try {
    return ethers.getAddress(addr);
  } catch {
    throw new Error(`Invalid address: ${addr}`);
  }
}


@Injectable()
export class TokenBlockchainClient implements TokenBlockchainPort {
  private readonly network: string;
  private readonly trustedForwarder: string;

  constructor(
    private readonly signerFactory: BlockchainSignerFactory,
    private readonly config: ConfigService,
  ) {
     this.network = this.config.get<string>('blockchain.network') ?? 'prividium';
     this.trustedForwarder = this.config.get<string>('blockchain.trusted_forwarder') ?? '0xa4B5eE2906090ce2cDbf5dfff944db26f397037D';

  }

  private getAbi() {
    console.log("network",this.network);
    return this.network === 'lacchain' ? tokenGasAbi : tokenAbi;
  }

  private getBytecode() {
    return this.network === 'lacchain'
      ? tokenGasBytecode.bytecode
      : tokenBytecode.bytecode;
  }

  private getFactory(): ContractFactory {
    const signer = this.signerFactory.getSigner()
    return new ethers.ContractFactory(this.getAbi(), this.getBytecode(), signer);
  }

  private getContract(address: string): Contract {
    const signer = this.signerFactory.getSigner();
    return new ethers.Contract(address,this.getAbi(), signer);
  }


  private getContractWithSigner(address: string, signer: any): Contract {
    return new ethers.Contract(address, this.getAbi(), signer);
  }

  /*async deployToken(input: {name: string; symbol: string, admin: string, minter: string}): Promise<{ address: string,hash:string}> {*/
  async deployToken(input: {name: string; symbol: string}): Promise<{ address: string,hash:string}> {
    let contract;
    const factory = this.getFactory();
    const signer = this.signerFactory.getSigner();
    const adminFromSigner =
    (signer as any).address ?? (await (signer as any).getAddress?.());
    const name = input.name?.trim();
    const symbol = input.symbol?.trim();
    if (!name || !symbol) throw new Error('ERR_DEPLOY_TOKEN: name/symbol requerido');
    const admin = ensureAddress(adminFromSigner);
    const minter = ensureAddress(adminFromSigner);
    if (this.network === 'lacchain') {
      contract = await factory.deploy(name, symbol, admin, minter, this.trustedForwarder);
    } else {
      contract = await factory.deploy(name, symbol, admin, minter);
    }
   
    const receipt = await contract.deploymentTransaction()?.wait();
    if (!receipt?.contractAddress || !receipt?.hash) {
      throw new Error('ERR_DEPLOY_TOKEN: receipt vacío');
    }
    return { address: receipt.contractAddress, hash: receipt.hash };
  }

  async canMint(input: {contractAddress: string, account: string}) {
    const c = this.getContract(ensureAddress(input.contractAddress));
    const minterRole = await c.MINTER_ROLE();
    const res = await c.hasRole(minterRole, ensureAddress(input.account));
    return res;
  } 

  async canTransfer(input:{ contractAddress: string, account: string}) {
    const c = this.getContract(ensureAddress(input.contractAddress));
    const role = await c.TRANSFER_ROLE();
    const hasRole = await c.hasRole(role, ensureAddress(input.account));
    return hasRole;
  }

  async grantMinter(input: { contractAddress: string; account: string }): Promise<{ txHash: string }> {
    const contract = this.getContract(ensureAddress(input.contractAddress));
    const account = ensureAddress(input.account);
    
    return contract.grantMinter(account)
      .then(gmtx => {
        return gmtx.wait()
          .then(receipt => {
            return { txHash: gmtx.hash };
          });
      })
      .catch(err => {
        console.error(" Error en grantMinter:", err);
        throw err;
      });
  }

  async grantTransferer(input: { contractAddress: string; account: string }): Promise<{ txHash: string }> {
    const contract = this.getContract(ensureAddress(input.contractAddress));
    const account = ensureAddress(input.account);
  
    return contract.grantTransferer(account)
      .then(gttx => {
        return gttx.wait()
          .then(receipt => {
            return { txHash: gttx.hash };
          });
      })
      .catch(err => {
        console.error(" Error en grantTransferer:", err);
        throw err;
      });
  }

  async mint(input: {
    contractAddress: string;
    to: string;
    amount: bigint;
    uid: string;
    context: string;
    privateKey: string;
  }): Promise<{ txHash: string; uidHash: string; contextHash: string }> {

    const sleep = (ms: number | 1000) => new Promise((resolve) => setTimeout(resolve, ms));
    const pk = input.privateKey.startsWith('0x') ? input.privateKey : `0x${input.privateKey}`;
    const to = ensureAddress(input.to);
    const amount = input.amount;
    const uidHash = ensureBytes32(input.uid);
    const contextHash = ensureBytes32(input.context);
    const signer = this.signerFactory.getSignerCustomPk(pk);
    const deployedContract = this.getContractWithSigner(input.contractAddress, signer);
    const tx = await deployedContract.mint(to,amount,uidHash,contextHash);
    await sleep(3000);
    const bal = await deployedContract.balanceOf(to);
    console.log(formatEther(bal),`BALANCE UPDATED`);
    return { txHash: tx.hash, uidHash, contextHash };
  }


  async transfer(input: {
    contractAddress: string;
    to: string;
    amount: bigint;
    uid: string;
    context: string;
    privateKey: string;
  }): Promise<{ txHash: string }> {

    
    const pk = input.privateKey.startsWith('0x') ? input.privateKey : `0x${input.privateKey}`;
    const projectSigner = this.signerFactory.getSignerCustomPk(pk);
    const sleep = (ms: number | 1000) => new Promise((resolve) => setTimeout(resolve, ms));
    const contractAddress = ensureAddress(input.contractAddress);
    const contract = this.getContractWithSigner(contractAddress, projectSigner);
    const to = ensureAddress(input.to);
    const amount = input.amount;
    if (amount <= 0n) throw new Error('ERR_TRANSFER: amount debe ser > 0');
    const tx = await contract.transfer(to, amount);
    await sleep(3000);
    const bal = await contract.balanceOf(to);
    console.log(formatEther(bal),`BALANCE`);
    return { txHash: tx.hash};

  }

  async balanceOf(input: { contractAddress: string; account: string }): Promise<bigint> {
    const contract = this.getContract(ensureAddress(input.contractAddress));
    const account = ensureAddress(input.account);
    const bal: bigint = await contract.balanceOf(account);
    return bal;
  }
}