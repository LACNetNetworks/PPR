import { Injectable, NotFoundException,BadRequestException } from '@nestjs/common';
import { PhaseProjectRepository } from '../../../domain/phases/phase-project.repository';
import { PhaseRepository } from '../../../domain/phases/phase.repository';
import { UpdatePhaseProjectInput } from '../../../application/phases/use-cases/types';
import { PhaseProject } from '../../../domain/phases/phase-project.entity';
import { ProjectRepository } from '../../../domain/projects/project.repository';

@Injectable()
export class UpdatePhaseProjectUseCase {
  constructor(
        private readonly repo: PhaseProjectRepository,
        private readonly prjRepo: ProjectRepository,
        private readonly phaseRepo: PhaseRepository,
  ) {}

async execute(projectId: string, phaseId:string, input: UpdatePhaseProjectInput): Promise<PhaseProject> {
    
    
    const phase = await this.phaseRepo.findById(phaseId);
    if (!phase) {
      throw new BadRequestException(`Phase with id: "${phaseId}" not found`);
    }

    const project = await this.prjRepo.findById(projectId);
    if (!project) {
      throw new BadRequestException(`Project with id: "${projectId}" not found`);
    }


  /*  const phaseProject = allPhaseProject.find(phase => phase.id_phase === phaseId);

    if(!phaseProject) {
     throw new BadRequestException(`The Phase Id: "${phaseId}" not included in the project`);
    }
 */
    
    const listPhaseProject = await this.repo.findAll({prjId:project.id_project});
    let phaseProject;
    if(listPhaseProject.length > 0) {
      phaseProject = listPhaseProject.find(u => u.id_phase === phaseId);
      if ( !phaseProject ){
        throw new BadRequestException(`This phase is new in the project`);
      }

      let totalWeight = listPhaseProject.reduce((accumulator, stage) => {
        return accumulator + stage.stage_weight;
      }, 0);
      totalWeight = totalWeight + input.stage_weight;
      if (totalWeight > 100) {
        throw new BadRequestException(`The total project weight cannot exceed 100%. Please adjust the stage_weight.`);
      }
    }

    const phaseproject = new PhaseProject(
      phaseProject.id_phase_project,
      phaseId,
      project.id_project,
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