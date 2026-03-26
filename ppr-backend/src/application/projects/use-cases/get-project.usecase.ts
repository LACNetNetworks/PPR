import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../../domain/projects/project.repository';
//import { ContributionRepository } from '../../../domain/contributions/contribution.repository';
//import { ProjectDetailsOutput } from './get-project-by-id.output';
import { ProjectOutput } from '../../../application/projects/use-cases/types'
import { TokenBlockchainPort } from '../../integrations/ports/token.blockchain.port';
import { formatEther} from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GetProjectUseCase {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly chain: TokenBlockchainPort,
    private readonly cfg: ConfigService,
  ) {}

  async execute(id: string): Promise<ProjectOutput> {
    let balProject,balFormated;
    const project = await this.projectRepo.findById(id);
    if (!project) throw new NotFoundException(`Project with id '${id}' not found`);
    const contractAddress = this.cfg.get<string>('blockchain.address_token')!; 
    if (project.wallet_token) {
      balProject = await this.chain.balanceOf({contractAddress,account:project.wallet_token});
      balFormated = formatEther(balProject) 
    }
    return { project, token_balance: balFormated}; 
  }
}
