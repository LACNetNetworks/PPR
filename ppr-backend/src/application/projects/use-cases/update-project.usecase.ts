
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../../domain/projects/project.repository';
import { Project } from '../../../domain/projects/project.entity';
import { ProjectStatus } from '../../../domain/projects/project-status.enum';
import { UpdateProjectInput } from '../../../application/projects/use-cases/types'

@Injectable()
export class UpdateProjectUseCase {
  constructor(private readonly repo: ProjectRepository) {}

async execute(id: string, input: UpdateProjectInput): Promise<Project> {
  const exists = await this.repo.findById(id);

  const nextStatus: ProjectStatus | undefined =
      input.status
        ? String(input.status).toLowerCase() as ProjectStatus
        : exists?.status;


  const next = new Project(
    id,
    input.type_project,
    new Date(input.date_start),
    input.name_project,
    input.id_organization,
    input.country_region,
    nextStatus,
    input.date_end ? new Date(input.date_end) : undefined,
    input.description,
    input.total_contributed_amount,
    input.wallet_provider,
    input.wallet_token,
    input.wallet_index_token
  
  );
  return this.repo.save(next);
  }
}

    