import { Injectable ,BadRequestException} from '@nestjs/common';
import { ProjectUserRepository } from '../../../domain/projects/project-user.repository';
import { ProjectUser } from '../../../domain/projects/project-user.entity';
import { CreateProjectUserInput } from '../../../application/projects/use-cases/types'
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { UserRepository } from '../../../domain/users/user.repository';
import { ProjectRepository } from '../../../domain/projects/project.repository';


@Injectable()
export class CreateProjectUserUseCase {
  constructor(
    private readonly prjRepo: ProjectRepository,
    private readonly usrRepo: UserRepository,
    private readonly repo: ProjectUserRepository,
    private readonly seq: SequenceService,
  ) {}

  async executeMany(id_project: string,inputs: CreateProjectUserInput[]): Promise<ProjectUser[]> {
    
    const prj = await this.prjRepo.findById(id_project);
    if (!prj) {
      throw new BadRequestException(`Project wiht id: "${id_project}" not found`);
    }
    const result: ProjectUser[] = [];
    for (const input of inputs) {
 
      const usr = await this.usrRepo.findById(input.id_user);
      if (!usr) {
        throw new BadRequestException(`User wiht id: "${input.id_user}" not found`);
      }
      const nextNumber = await this.seq.next('projects_user');
      const id_project_user = `pu_${String(nextNumber).padStart(3, '0')}`;

      const p = new ProjectUser(
        id_project_user,
        id_project,
        input.id_user,
      );

      const saved = await this.repo.save(p);
      result.push(saved);
    }
    return result;
  }
}