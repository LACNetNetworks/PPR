import { Injectable,BadRequestException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectUserRepository} from '../../../../domain/projects/project-user.repository';
import { ProjectUser as ProjectUserEntity } from '../../../../domain/projects/project-user.entity';
import { ProjectUser as ProjectUserDoc } from '../schemas/project-user.schema';
import { User as UserDoc } from '../schemas/user.schema';
import { Project as ProjectDoc } from '../schemas/project.schema';
import { ProjectUserView as ProjectUserView} from '../../../../application/projects/dto/project-user.view';
import {ProjectUserReadRepository } from '../../../../application/projects/port/project-user-read-repository';

@Injectable()
export class ProjectUserMongooseRepository extends ProjectUserReadRepository {
  constructor(
    @InjectModel(ProjectUserDoc.name) private readonly model: Model<ProjectUserDoc>,
    @InjectModel(ProjectDoc.name) private readonly projectModel: Model<ProjectDoc>,
    @InjectModel(UserDoc.name) private readonly userModel: Model<UserDoc>
  ) { super();}

  async save(entity: ProjectUserEntity): Promise<ProjectUserEntity> {
    const projectDoc = await this.projectModel
      .findOne({ id_project: entity.id_project })
      .select('_id')
      .lean();

    if (!projectDoc) {
      throw new BadRequestException(
        `Project with id "${entity.id_project}" not found`,
      );
    }

    const userDoc = await this.userModel
      .findOne({ id_user: entity.id_user })
      .select('_id')
      .lean();

    if (!userDoc) {
      throw new BadRequestException(
        `User with id "${entity.id_user}" not found`,
      );
    }
    await this.model.updateOne({ id_project_user: entity.id_project_user },
    {
      id_project_user: entity.id_project_user,
      id_project: entity.id_project,
      project: projectDoc._id as Types.ObjectId,
      id_user: entity.id_user,
      user: userDoc._id as Types.ObjectId,
    },  
    { upsert: true });
    return entity;
  }

  async findById(id: string): Promise<ProjectUserEntity | null> {
    const doc = await this.model.findOne({ id_organization_user: id }).lean();
    return doc ? new ProjectUserEntity(
      doc.id_project_user,doc.id_project,doc.id_user 
    ) : null;
  }

  async findAll(params: { limit?: number; offset?: number; projectId?: string; }): Promise<ProjectUserView[]> {

    const q: any = {};
    if (params.projectId) q.id_project = params.projectId;
    const docs = await this.model.find(q)
    .skip(params.offset ?? 0)
    .limit(params.limit ?? 50)
    .populate('user')
    .populate('project')
    .lean();
        
    return docs.map((doc: any) => ({
      id_project_user: doc.id_project_user,
      id_project: doc.id_project,
      id_user: doc.id_user,
      projectName: doc.project?.name_project ?? null,
      userName: doc.user?.name ?? null,
      userSurName: doc.user?.surname ?? null,
      userUserEmail: doc.user?.user_email ?? null,
      userRole: doc.user?.role ?? null,
      userWallet: doc.user?.wallet_address_token ?? null,
    }));
  }
  async delete(id: string) { await this.model.deleteOne({ id_projectUser: id }); }
}