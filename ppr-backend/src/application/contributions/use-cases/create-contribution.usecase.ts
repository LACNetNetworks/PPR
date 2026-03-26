import { Injectable,BadRequestException } from '@nestjs/common';
import { ContributionRepository } from '../../../domain/contributions/contribution.repository';
import { Contribution } from '../../../domain/contributions/contribution.entity';
import { CreateContributionInput } from '../../../application/contributions/use-cases/types'
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { PhaseProjectRepository } from '../../../domain/phases/phase-project.repository';
import { UserRepository } from 'src/domain/users/user.repository';
import { UserRole } from 'src/domain/users/user-role.enum';
import { parseUnits,Wallet,HDNodeWallet } from 'ethers';
import { TokenBlockchainPort } from '../../integrations/ports/token.blockchain.port';
import { ConfigService } from '@nestjs/config';
import { ProjectUserRepository } from '../../../domain/projects/project-user.repository';

@Injectable()
export class CreateContributionUseCase {
  constructor(
    private readonly repo: ContributionRepository,
    private readonly seq: SequenceService,
    private readonly repoProject: ProjectRepository,
    private readonly repoPhaseProject: PhaseProjectRepository,
    private readonly userRepo: UserRepository,
    private readonly chain: TokenBlockchainPort,
    private readonly cfg: ConfigService,
    private readonly repoProjectUser: ProjectUserRepository,
  ) {}

  async execute(input: CreateContributionInput): Promise<Contribution> {

  const project = await this.repoProject.findById(input.id_project);
  if (!project) {
    throw new BadRequestException(`Project with id: "${input.id_project}" not found`);
  }

  const phaseProject = await this.repoPhaseProject.findById(input.id_phase_project);
  if (!phaseProject) {
    throw new BadRequestException(`Phase Project with id: "${input.id_phase_project}" not found`);
  }

  if (!input.uid) {
    throw new BadRequestException(`The uid of User is empty`);
  }

  const user = await this.userRepo.findByKeycloakSub(input.uid);

  if (!user) throw new BadRequestException('User not found');

  if (user.role !== UserRole.SPONSOR) {
  throw new BadRequestException('Only SPONSOR can create projects');
  }

/*   if (!user.address_seed_token) {
  throw new BadRequestException("The user doesn't have a Security Phrase.");
  } */

  if (!input.deposit_amount || input.deposit_amount === 0) {
  throw new BadRequestException("The value of amount is invalid.");
  }

  const seedSponsor = this.cfg.get<string>('blockchain.gsponsor_seed')!; 
  const projectWallet = HDNodeWallet.fromPhrase(seedSponsor, undefined, `m/44'/60'/0'/0/${project.wallet_index_token}`);
 
  //const projectWallet = HDNodeWallet.fromPhrase(user.address_seed_token, undefined, `m/44'/60'/0'/0/${project.wallet_index_token}`);
  const contractAddress = this.cfg.get<string>('blockchain.address_token')!; 

  //  contractAddress: string; to: string; amount: bigint;uid: string; context: string;privateKey: string;
  const usersProject = await this.repoProjectUser.findAll({projectId:project.id_project});
  if (usersProject.length === 0) {
    throw new BadRequestException("The project doesn't have members.");
  }

  const provider = usersProject.find(user => user.userRole === 'provider');

  if (!provider) {
  throw new BadRequestException("The project doesn't have a member with a  provider rol");
  }

  if (!project.wallet_provider) {
  throw new BadRequestException("The project doesn't have registerd a wallet");
  }

  const nextNumber = await this.seq.next('contributions');
  const id_contribution = `con_${String(nextNumber).padStart(3, '0')}`;
  
  const can = await this.chain.canTransfer({contractAddress,account:projectWallet.address});


  if(!can) {
    await this.chain.grantTransferer({
        contractAddress,
        account: projectWallet.address,
      });
  }
 
  const decimals = 18;
  

  await this.chain.transfer({
    contractAddress,
    to: project.wallet_provider,
    amount: parseUnits(String(input.deposit_amount), decimals),
    uid: `transfer:${input.id_project}:${provider.id_user}:${project.id_project}`,
    context: 'Project_to_provider',
    privateKey: projectWallet.privateKey,
  });


  const payment = new Contribution(
    id_contribution,
    input.id_project,
    input.id_user,
    input.deposit_amount,
    input.id_phase_project,
    new Date(input.date_contribution),
  );
  
  phaseProject.contribution_received = phaseProject.contribution_received + input.deposit_amount;
  const updatePhaseProject = await this.repoPhaseProject.save(phaseProject);

  return this.repo.save(payment);

  }
}