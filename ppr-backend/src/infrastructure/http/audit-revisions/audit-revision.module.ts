import { Module } from '@nestjs/common';
import { AuditRevisionsController } from '../controllers/audit-revision.controller';
import { CreateAuditRevisionUseCase } from '../../../application/audit-revisions/use-cases/create-audit-revision.usecase';
import { MongoosePersistenceModule } from '../../persistence/mongoose/mongoose.module';
import { AuditRevisionMongooseRepository } from '../../persistence/mongoose/repositories/audit-revision.mongoose.repository';
import { AuditRevisionRepository } from '../../../domain/audit-revisions/audit-revision.repository';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { ProjectMongooseRepository } from '../../persistence/mongoose/repositories/project.mongoose.repository';
import { PhaseProjectRepository } from '../../../domain/phases/phase-project.repository';
import { PhaseProjectMongooseRepository } from '../../persistence/mongoose/repositories/phase-project.mongoose.repository';

@Module({
  imports: [MongoosePersistenceModule], 
  controllers: [AuditRevisionsController],
  providers: [{ provide: ProjectRepository, useExisting: ProjectMongooseRepository },
    CreateAuditRevisionUseCase,
    { provide: PhaseProjectRepository, useExisting: PhaseProjectMongooseRepository },
    { provide: ProjectRepository, useExisting: ProjectMongooseRepository },
    { provide: AuditRevisionRepository, useExisting: AuditRevisionMongooseRepository },
  ],
})
export class AuditRevisionsModule {}