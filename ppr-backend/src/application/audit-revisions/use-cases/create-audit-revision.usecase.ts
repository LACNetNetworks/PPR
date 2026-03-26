import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditRevisionRepository } from '../../../domain/audit-revisions/audit-revision.repository';
import { AuditRevision } from '../../../domain/audit-revisions/audit-revision.entity';
import { CreateAuditRevisionInput } from './types'
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { UserRepository } from '../../../domain/users/user.repository';
import { PhaseProjectRepository } from '../../../domain/phases/phase-project.repository';

@Injectable()
export class CreateAuditRevisionUseCase {
  constructor(
    private readonly repo: AuditRevisionRepository,
    private readonly seq: SequenceService,
    private readonly repoProject: ProjectRepository,
    private readonly repoUser: UserRepository,
    private readonly repoPhaseProject: PhaseProjectRepository,  
  ) {}

  async execute(input: CreateAuditRevisionInput): Promise<AuditRevision> {

    const nextNumber = await this.seq.next('AuditRevisions');
    const id_audit_revision = `aud_${String(nextNumber).padStart(3, '0')}`;
    
    const project = await this.repoProject.findById(input.id_project);
    
    if (!project) {
      throw new NotFoundException(`Project with id: "${input.id_project}" not found`);
    }
   
  
    const user = await this.repoUser.findById(input.id_user);
    if (!user) {
      throw new NotFoundException(`User with id: "${input.id_user}" not found`);
    }
  
   
    const phaseProject = await this.repoPhaseProject.findById(input.id_phase_project);
    if (!phaseProject) {
      throw new NotFoundException(`Phase Project with id: "${input.id_phase_project}" not found`);
    }


    const p = new AuditRevision(
      id_audit_revision,
      input.objetive,
      input.id_user,
      input.id_project,
      input.observation,
      new Date(input.date_revision),
      input.id_phase_project,
      input.status,
    );
    return this.repo.save(p);
  }
}