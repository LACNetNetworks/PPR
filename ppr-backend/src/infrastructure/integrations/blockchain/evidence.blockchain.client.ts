import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, ContractFactory, ethers } from 'ethers';
import { EvidenceBlockchainPort } from '../../../application/integrations/ports/evidence.blockchain.port';
//import { LacchainSignerFactory } from './providers/lacchain.providers';
import { BlockchainSignerFactory } from './providers/blockchain-signer.factory';

import evidenceAbi from './abi/evidence.abi.json';
import evidenceBytecode from './abi/evidence.bytecode.json';

import evidenceGasAbi from './abi/evidence-gas.abi.json';
import evidenceGasBytecode from './abi/evidence-gas-bytecode.json';

function ensureBytes32(input: string): string {
  if (input.startsWith('0x') && input.length === 66) return input;
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}

@Injectable()
export class EvidenceBlockchainClient implements EvidenceBlockchainPort {
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
    return this.network === 'lacchain' ? evidenceGasAbi : evidenceAbi;
  }

  private getBytecode() {
    return this.network === 'lacchain'
      ? evidenceGasBytecode.bytecode
      : evidenceBytecode.bytecode;
  }

  private getFactory(): ContractFactory {
    const signer = this.signerFactory.getSigner();
    return new ethers.ContractFactory(this.getAbi(), this.getBytecode(), signer);
  }

  private getContract(address: string): Contract {
    const signer = this.signerFactory.getSigner();
    return new ethers.Contract(address,this.getAbi(), signer);
  }

  async deployCertification(): Promise<{ address: string; hash: string }> {
    const factory = this.getFactory();
    const contract = await factory.deploy(this.trustedForwarder);
    const receipt = await contract.deploymentTransaction()?.wait();
/*     const receipt = {
      "contractAddress":"aa",
      "hash":"bb",
    }  */
     if (!receipt?.contractAddress || !receipt?.hash) {
      throw new Error('ERR_DEPLOY_CERTIFICATION: receipt vacío');
    } 
    return { address: receipt.contractAddress, hash: receipt.hash };
  }

  async addDoc(contractAddress: string, docHash: string, uidHash: string): Promise<{ res: any; dh: string; uh: string }> {
    const contract = this.getContract(contractAddress);
    const dh = ensureBytes32(docHash);
    const uh = ensureBytes32(uidHash);
    const tx = await contract.addDoc(dh, uh);
    return { res: tx.hash,dh,uh };
  }
}