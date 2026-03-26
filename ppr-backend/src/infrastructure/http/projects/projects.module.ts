import { Module } from '@nestjs/common';
import { ProjectsController } from '../controllers/projects.controller';
import { CreateProjectUseCase } from '../../../application/projects/use-cases/create-project.usecase';
import { UpdateProjectUseCase } from '../../../application/projects/use-cases/update-project.usecase';
import { MongoosePersistenceModule } from '../../persistence/mongoose/mongoose.module';
import { ProjectMongooseRepository } from '../../persistence/mongoose/repositories/project.mongoose.repository';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { OrganizationRepository } from '../../../domain/organizations/organization.repository';
import { OrganizationMongooseRepository } from '../../persistence/mongoose/repositories/organization.mongoose.repository';
import { CreatePhaseProjectUseCase } from '../../../application/phases/use-cases/create-phase-project.usecase';
import { UpdatePhaseProjectUseCase } from '../../../application/phases/use-cases/update-phase-project.usecase';
import { PhaseProjectMongooseRepository } from '../../persistence/mongoose/repositories/phase-project.mongoose.repository';
import { PhaseProjectRepository } from  '../../../domain/phases/phase-project.repository';
import { CreatePhaseProjectTaskUseCase } from '../../../application/phases/use-cases/create-phase-project-task.usecase';
import { UpdatePhaseProjectTaskUseCase } from '../../../application/phases/use-cases/update-phase-project-task.usecase';
import { GetPhaseProjectTasksUseCase } from '../../../application/phases/use-cases/get-phase-project-tasks.usecase';
import { PhaseProjectTaskRepository } from '../../../domain/phases/phase-project-task.repository';
import { PhaseProjectTaskMongooseRepository} from '../../persistence/mongoose/repositories/phase-project-task.mongoose.repository';
import { PhaseRepository } from '../../../domain/phases/phase.repository';
import { PhaseMongooseRepository } from 'src/infrastructure/persistence/mongoose/repositories/phase.mongoose.repository';
import { TaskRepository } from '../../../domain/tasks/task.repository';
import { TaskMongooseRepository } from '../../../infrastructure/persistence/mongoose/repositories/task.mongoose.repository';
import { ProjectUserRepository } from '../../../domain/projects/project-user.repository';
import { ProjectUserMongooseRepository } from '../../../infrastructure/persistence/mongoose/repositories/project-user.mongoose.repository';
import { CreateProjectUserUseCase } from '../../../application/projects/use-cases/create-project-user.usecase';
import { ContributionRepository } from '../../../domain/contributions/contribution.repository';
import { ContributionMongooseRepository } from '../../persistence/mongoose/repositories/contribution.mongoose.repository';
import { BlockchainIntegrationModule } from '../../integrations/blockchain/blockchain.module';
import { TokenBlockchainClient } from '../../integrations/blockchain/token.blockchain.client';
import { TokenBlockchainPort } from '../../../application/integrations/ports/token.blockchain.port';
import { GetProjectUseCase } from '../../../application/projects/use-cases/get-project.usecase';
import { AuthModule } from '../../../infrastructure/auth/auth.module';
import { PokModule } from '../../../infrastructure/integrations/pok/pok.module';


@Module({
  imports: [MongoosePersistenceModule,BlockchainIntegrationModule,AuthModule,PokModule], 
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    UpdateProjectUseCase,
    CreatePhaseProjectUseCase,
    CreatePhaseProjectTaskUseCase,
    UpdatePhaseProjectTaskUseCase,
    GetPhaseProjectTasksUseCase,
    CreateProjectUserUseCase,
    UpdatePhaseProjectUseCase,
    GetProjectUseCase,
    { provide: ProjectRepository, useExisting: ProjectMongooseRepository },
    { provide: OrganizationRepository, useExisting: OrganizationMongooseRepository },
    { provide: PhaseProjectRepository, useExisting: PhaseProjectMongooseRepository},
    { provide: PhaseProjectTaskRepository, useExisting: PhaseProjectTaskMongooseRepository},
    { provide: PhaseRepository, useExisting: PhaseMongooseRepository },
    { provide: TaskRepository, useExisting: TaskMongooseRepository },
    { provide: ProjectUserRepository, useExisting: ProjectUserMongooseRepository },
    { provide: ContributionRepository, useExisting: ContributionMongooseRepository },
  ],
  exports: [CreateProjectUserUseCase],
})
export class ProjectsModule {}
