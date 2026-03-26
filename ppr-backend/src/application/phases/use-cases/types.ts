import { ProjectTypes } from '../../../domain/projects/project-types.enum';
import { PhaseProjectStatus } from '../../../domain/phases/phase-project-status.enum';
import { PhaseProjectTaskStatus } from '../../../domain/phases/phase-project-task-status.enum'; 

export interface CreatePhaseInput {
  name_phase: string;
  brief_description: string;          
}

export interface CreatePhaseProjectInput {
  id_phase: string;
  require_evidence: boolean;
  status:PhaseProjectStatus;
  order:number;
  stage_weight:number;
  contribution_required:number;
  contribution_received:number;        
}

export interface UpdatePhaseProjectInput {
  id_phase: string;
  require_evidence: boolean;
  status:PhaseProjectStatus;
  order:number;
  stage_weight:number;
  contribution_required:number;
  contribution_received:number; 
}

export interface CreatePhaseProjectTaskInput {
  id_task: string;
  status_task:PhaseProjectTaskStatus;     
}

export interface UpdatePhaseProjectTaskInput {
  id_task: string;
  status_task:PhaseProjectTaskStatus;     
}
