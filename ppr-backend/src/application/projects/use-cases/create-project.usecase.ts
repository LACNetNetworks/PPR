import { Injectable ,BadRequestException,HttpException} from '@nestjs/common';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { Project } from '../../../domain/projects/project.entity';
import { CreateProjectInput,ProjectOutput } from '../../../application/projects/use-cases/types'
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { OrganizationRepository } from '../../../domain/organizations/organization.repository';
import { ConfigService } from '@nestjs/config';
import { TokenBlockchainPort } from '../../integrations/ports/token.blockchain.port';
import { parseUnits,Wallet,HDNodeWallet,formatEther} from 'ethers';
import { UserRepository } from '../../../domain/users/user.repository';
import { UserRole } from '../../../domain/users/user-role.enum';
import { DomainError } from '../../../domain/shared/domain-error';
import { ProjectUserRepository } from '../../../domain/projects/project-user.repository';
import { ProjectUser } from '../../../domain/projects/project-user.entity';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly repo: ProjectRepository,
    private readonly seq: SequenceService,
    private readonly cfg: ConfigService,
    private readonly chain: TokenBlockchainPort,
    private readonly userRepo: UserRepository,
    private readonly userProRepo: ProjectUserRepository,
  ) {}

  async execute(input: CreateProjectInput): Promise<ProjectOutput> {

    try {
    const org = await this.orgRepo.findById(input.id_organization);
    if (!org) {
      throw new BadRequestException(`Organization wiht id: "${input.id_organization}" not found`);
    }

  
    if (!input.uid) {
      throw new BadRequestException(`The uid of User is empty`);
    }

    if (!input.total_contributed_amount || input.total_contributed_amount === 0) {
      throw new BadRequestException(`The value of total_contributed_amount is invalid or empty`);
    }

    const user = await this.userRepo.findByKeycloakSub(input.uid);
  
    if (!user) throw new BadRequestException('User not found');

    if (user.role !== UserRole.SPONSOR) {
    throw new BadRequestException('Only SPONSOR can create projects');
    }

    if ( !input.total_contributed_amount || input.total_contributed_amount <= 0n) {
      throw new BadRequestException('The value of Total contributed is invalid or empty');
    }
  
    const seedUser = this.cfg.get<string>('blockchain.gsponsor_seed')!; 

    /* let seedUser = user.address_seed_token;
    if (!seedUser) {
      seedUser = Wallet.createRandom().mnemonic!.phrase;
      user.address_seed_token = seedUser;
    }*/


    const walletUser = HDNodeWallet.fromPhrase(seedUser, undefined, "m/44'/60'/0'/0/0");

    if (!user.wallet_address_token) {
      user.wallet_address_token = walletUser.address;
      await this.userRepo.save(user);          
      //await this.chain.grantMinter({ contractAddress, account: walletUser.address });
    } 

    const contractAddress = this.cfg.get<string>('blockchain.address_token')!; 
    const can = await this.chain.canMint({contractAddress,account:walletUser.address});
    
    if (!can) {
      const resgranmint = await this.chain.grantMinter({ contractAddress, account: walletUser.address });
    }

    const nextNumber = await this.seq.next('projects');
    const id_project = `prj_${String(nextNumber).padStart(3, '0')}`;
    const walletProject = HDNodeWallet.fromPhrase(
      seedUser,
      undefined,
      `m/44'/60'/0'/0/${nextNumber}`,
    );

    const p = new Project(
      id_project,
      input.type_project,
      new Date(input.date_start),
      input.name_project,
      input.id_organization,
      input.country_region,
      input.status,
      input.date_end ? new Date(input.date_end) : undefined,
      input.description,
      input.total_contributed_amount,
      input.wallet_provider,
      walletProject.address,
      String(nextNumber),
     
    );
    const to = walletProject.address;
    const context = "Mint_initial";
    const uid= id_project;
    const decimals = 18;
    const amount = parseUnits(String(input.total_contributed_amount), decimals);
    const privateKey = walletUser.privateKey;
    const resmint = await this.chain.mint({contractAddress,to,amount,uid,context,privateKey});
    const saved = await this.repo.save(p);
    const balProject = await this.chain.balanceOf({contractAddress,account:to});

    //add sponsor user to project
    const nextProyectUser = await this.seq.next('projects_user');
    const id_project_user = `pu_${String(nextProyectUser).padStart(3, '0')}`;
    const proyUser = new ProjectUser(
            id_project_user,
            saved.id_project,
            user.id_user,
          );
    
    const saveProyUser = await this.userProRepo.save(proyUser);
    
    return { project: saved,
             token_balance: formatEther(balProject) 
           };
  } catch(e) {
    if (e instanceof DomainError) {
          const statusMap: Record<string, number> = {
            BAD_REQUEST: 400,
            NOT_FOUND: 404,
            CONFLICT: 409,
            FORBIDDEN: 403,
            UNAUTHORIZED: 401,
            DOMAIN_ERROR: 500,
          };

          throw new HttpException(
            {
              message: e.message,
              code: e.code,
              details: e.details,
            },
            statusMap[e.code] ?? 500,
          );
        }
        throw e; 
      }
    }         
  }
