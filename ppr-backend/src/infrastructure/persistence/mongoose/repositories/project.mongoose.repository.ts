import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project as ProjectDoc } from '../schemas/project.schema';
import { ProjectRepository } from '../../../../domain/projects/project.repository';
import { Project as ProjectEntity } from '../../../../domain/projects/project.entity';
import { OrganizationUser as OrganizationUserDoc } from '../schemas/organization-user.schema';
import { ProjectUser as ProjectUserDoc } from '../schemas/project-user.schema';
import { User as UserDoc } from '../schemas/user.schema';

@Injectable()
export class ProjectMongooseRepository extends ProjectRepository {
  constructor(
    @InjectModel(ProjectDoc.name) private readonly model: Model<ProjectDoc>,
    @InjectModel (OrganizationUserDoc.name) private readonly modelOrgUser: Model<OrganizationUserDoc>,
    @InjectModel(ProjectUserDoc.name) private readonly modelProjUser: Model<ProjectUserDoc>,
    @InjectModel(UserDoc.name) private readonly modelUser: Model<UserDoc>,

  ) { super();}

  async save(entity: ProjectEntity): Promise<ProjectEntity> {
    await this.model.updateOne({ id_project: entity.id_project }, entity, { upsert: true, runValidators: true, setDefaultsOnInsert: true  });
    return entity;
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    const doc = await this.model.findOne({ id_project: id }).lean();
    return doc ? new ProjectEntity(
      doc.id_project, doc.type_project as any, doc.date_start,doc.name_project,doc.id_organization, doc.country_region, 
      doc.status as any,doc.date_end,doc.description, doc.total_contributed_amount,doc.wallet_provider,doc.wallet_token,doc.wallet_index_token
    ) : null;
  }

  async findAll(params: { uid?:any; orgId?: string; limit?: number; offset?: number; }): Promise<ProjectEntity[]> {
    const q: any = {};
    if (params.orgId) {
      q.id_organization = params.orgId;
    } else if (params.uid)  {
      const user = await this.modelUser.findOne({keycloak_sub:params.uid}).lean();
      if (!user) return [];
      /*q.userId = params.uid;
        const orgUserModels = await this.modelOrgUser 
        .find({ id_user: params.uid })
        .select('id_organization') 
        .lean();
        const organizationIds = orgUserModels.map(doc => doc.id_organization);
        if (organizationIds.length === 0) {
          return []; 
        } */
        const projectIds = await this.modelProjUser.distinct('id_project', {
          id_user: user.id_user,
        });
        q.id_project = { $in: projectIds };
    }
    const docs = await this.model.find(q).skip(params.offset ?? 0).limit(params.limit ?? 50).lean();
    return docs.map(doc => new ProjectEntity(
      doc.id_project, doc.type_project as any, doc.date_start,doc.name_project,doc.id_organization, doc.country_region, 
      doc.status as any,doc.date_end,doc.description, doc.total_contributed_amount,doc.wallet_provider,doc.wallet_token,doc.wallet_index_token
    ));
  }
}