import { PhaseProject } from './phase-project.entity';
import { PhaseProjectDto } from '../../application/phases/dto/phase-project-read.dto';

 
 export abstract class PhaseProjectRepository {
  abstract save(PhaseProject: PhaseProject): Promise<PhaseProject>;
  abstract findById(id: string): Promise<PhaseProject | null>;
  abstract findAll(params: { limit?: number; offset?: number ,prjId?: string}): Promise<PhaseProject[]>;
  abstract findByPhase(params: { phaseId: string; projectId: string}): Promise<PhaseProject | null>;

  //abstract findByPhaseTask(idPhase:string, idTask:string): Promise<PhaseProject | null>;
} 