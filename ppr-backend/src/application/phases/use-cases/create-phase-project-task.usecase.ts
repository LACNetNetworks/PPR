import { Injectable,BadRequestException } from '@nestjs/common';
import { PhaseProjectTaskRepository } from '../../../domain/phases/phase-project-task.repository';
import { PhaseProjectTask } from '../../../domain/phases/phase-project-task.entity';
import { CreatePhaseProjectTaskInput } from '../../../application/phases/use-cases/types'
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { PhaseProjectTaskStatus } from '../../../domain/phases/phase-project-task-status.enum';
import { PhaseProjectRepository } from '../../../domain/phases/phase-project.repository';
import { TaskRepository } from '../../../domain/tasks/task.repository';
import { PhaseRepository } from '../../../domain/phases/phase.repository';
import { ProjectRepository } from '../../../domain/projects/project.repository';

@Injectable()
export class CreatePhaseProjectTaskUseCase {
  constructor(
    private readonly repo: PhaseProjectTaskRepository,
    private readonly seq: SequenceService,
    private readonly repoPhaseProject: PhaseProjectRepository,
    private readonly repoTask: TaskRepository,
    private readonly repoPhase: PhaseRepository,
     private readonly repoProject: ProjectRepository,

  ) {}

 async execute(projectId:string,phaseProjectId:string,input: CreatePhaseProjectTaskInput): Promise<PhaseProjectTask> {

    const project = await this.repoProject.findById(projectId);
    if (!project) {
      throw new BadRequestException(`Project with id: "${projectId}" not found`);
    }
    const phaseProject= await this.repoPhaseProject.findByPhase({phaseId:phaseProjectId,projectId:project.id_project});
    
    if (!phaseProject) {
      throw new BadRequestException(`Phase Project with id: "${phaseProjectId}" not found`);
    }

    const task = await this.repoTask.findById(input.id_task);
    
    if (!task) {
      throw new BadRequestException(`Task with id: "${input.id_task}" not found`);
    }

    const phaseProjectTask = await this.repo.findByPhaseProjectTask(phaseProjectId,input.id_task);
  
    if (phaseProjectTask) {
      throw new BadRequestException(`Task with Id ${input.id_task} exist in phase of project`);
    }

    const nextNumber = await this.seq.next('phase_project_task');
    const id_phase_project_task = `ppt_${String(nextNumber).padStart(3, '0')}`;
    const phase_project_task = new PhaseProjectTask(
      id_phase_project_task,
      phaseProjectId,
      input.id_task,
      input.status_task,
    );
    return this.repo.save(phase_project_task);
  }
}
