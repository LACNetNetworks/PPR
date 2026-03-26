import { PhaseProjectStatus } from './phase-project-status.enum';

export class PhaseProject {
  constructor(
    public readonly id_phase_project: string,
    public id_phase: string,
    public id_project: string,
    public require_evidence: boolean,
    public status: PhaseProjectStatus = PhaseProjectStatus.PENDING,
    public order: number,
    public stage_weight:number,
    public contribution_required: number,
    public contribution_received: number,
  ) {}
}
