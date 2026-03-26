import { ProjectPaises } from '../../../domain/projects/project-paises.enum';
import { ProjectStatus } from '../../../domain/projects/project-status.enum';
import { ProjectTypes } from '../../../domain/projects/project-types.enum';
import { Project } from '../../../domain/projects/project.entity';

export interface CreateProjectInput {
  type_project:ProjectTypes;
  date_start: string; 
  name_project: string;  
  id_organization: string;
  country_region:ProjectPaises;   
  status:ProjectStatus;
  date_end: string;  
  description?: string;
  total_contributed_amount?: number;
   wallet_provider?:string;
  wallet_token?:string;
  wallet_index_token?:string;
  uid?:string;
}
 
export interface UpdateProjectInput {
  type_project:ProjectTypes;
  date_start: string; 
  name_project: string;  
  id_organization: string;        
  country_region:ProjectPaises;   
  status:ProjectStatus;
  date_end: string; 
  description?: string;
  total_contributed_amount?: number; 
  wallet_provider?:string;
  wallet_token?:string;
  wallet_index_token?:string;
 
}

export interface CreateProjectUserInput {
  id_user: string;         
}

export interface ProjectOutput {
  project: Project;
  token_balance: string;
}