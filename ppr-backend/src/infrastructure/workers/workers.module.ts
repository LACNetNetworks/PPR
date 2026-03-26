import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongoosePersistenceModule } from '../persistence/mongoose/mongoose.module';
import { HttpAxiosModule } from '../integrations/http-axios.module';

import { QueueRunner } from './queue.runner';
import { PokTitlesSyncProcessor } from './processors/pok-titles-sync.processor';
import { QueueProcessorsRegistry } from './processors/queue-processor.registry';

import { QueueRepositoryPort } from '../../application/queue/port/queue.repository.port';
import { SyncQueueMongooseRepository } from '../persistence/mongoose/repositories/sync-queue.mongoose.repository';


import { EnsurePokUserUseCase } from '../../application/users/use-cases/ensure-user.usecase';
import { CreateUserUseCase } from '../../application/users/use-cases/create-user.usecase';
import { CreateEvidenceUseCase } from '../../application/evidences/use-cases/create-evidence.usecase';
import { PokModule } from '../integrations/pok/pok.module';
import { EvidencesModule } from '../http/evidences/evidences.module';
import { ProjectsModule } from '../http/projects/projects.module';

import { ProjectUserMongooseRepository } from '../persistence/mongoose/repositories/project-user.mongoose.repository';
import { ProjectUserRepository } from '../../domain/projects/project-user.repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongoosePersistenceModule,
    HttpAxiosModule,
    PokModule,
    EvidencesModule,
    ProjectsModule,
  ],
  providers: [
    QueueRunner,
    QueueProcessorsRegistry,
    PokTitlesSyncProcessor,
    EnsurePokUserUseCase,
    CreateUserUseCase,
    { provide: QueueRepositoryPort, useExisting: SyncQueueMongooseRepository },
    { provide: ProjectUserRepository, useExisting: ProjectUserMongooseRepository },
  ],
})
export class WorkersModule {}
