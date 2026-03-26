import { Injectable,BadRequestException} from '@nestjs/common';
import { PhaseProjectRepository } from '../../../domain/phases/phase-project.repository';
import { PhaseProject } from '../../../domain/phases/phase-project.entity';
import { CreatePhaseProjectInput } from '../../../application/phases/use-cases/types'
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { PhaseRepository } from '../../../domain/phases/phase.repository';

@Injectable()
export class CreatePhaseProjectUseCase {
  constructor(
    private readonly repo: PhaseProjectRepository,
    private readonly seq: SequenceService,
    private readonly prjRepo: ProjectRepository,
    private readonly phaseRepo: PhaseRepository,
  ) {}

 async execute(projectId: string, input: CreatePhaseProjectInput): Promise<PhaseProject> {
    const prj = await this.prjRepo.findById(projectId);
    if (!prj) {
      throw new BadRequestException(`Project with id: "${projectId}" not found`);
    }

    const phase = await this.phaseRepo.findById(input.id_phase);
    if (!phase) {
      throw new BadRequestException(`Phase with id: "${input.id_phase}" not found`);
    }

    
    const listphase = await this.repo.findAll({prjId:projectId});
    if(listphase.length > 0) {
      const phase = listphase.find(u => u.id_phase === input.id_phase);
      if ( phase ){
        throw new BadRequestException(`This phase is already part of the project`);
      }

      let totalWeight = listphase.reduce((accumulator, stage) => {
        return accumulator + stage.stage_weight;
      }, 0);
      totalWeight = totalWeight + input.stage_weight;
      if (totalWeight > 100) {
        throw new BadRequestException(`The total project weight cannot exceed 100%. Please adjust the stage_weight.`);
      }
    }


    const nextNumber = await this.seq.next('Phases');
    const id_phase_project = `pp_${String(nextNumber).padStart(3, '0')}`;

    const phaseproject = new PhaseProject(
      id_phase_project,
      input.id_phase,
      projectId,
      input.require_evidence,
      input.status,
      input.order,
      input.stage_weight,
      input.contribution_required,
      input.contribution_received,
    );
    return this.repo.save(phaseproject);
  }
}
