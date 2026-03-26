import { Project } from './project.entity';

 export abstract class ProjectRepository {
  abstract save(project: Project): Promise<Project>;
  abstract findById(id: string): Promise<Project | null>;
  abstract findAll(params: { uid?: string; limit?: number; offset?: number }): Promise<Project[]>;
} 