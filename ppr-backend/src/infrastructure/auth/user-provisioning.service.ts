import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/users/user.repository';
import { randomUUID } from 'crypto';
import { SequenceService } from '../../infrastructure/persistence/mongoose/services/sequence.service';
import { OrganizationUser } from '../../domain/organizations/organization-user.entity';
import { OrganizationUserRepository } from '../../domain/organizations/organization-user.repository';
import { ProjectUserRepository } from '../../domain/projects/project-user.repository';
import { UserRole } from '../../domain/users/user-role.enum';



 function mapStringToUserRole(roleString?: string): UserRole {
  const validRoles = Object.values(UserRole); 
  if (roleString && validRoles.includes(roleString as UserRole)) {
    return roleString as UserRole;
  }
  return UserRole.USER; 
} 

@Injectable()
export class UserProvisioningService {
  constructor(private readonly users: UserRepository,
              private readonly seq: SequenceService,
              private readonly orgUsers: OrganizationUserRepository,
  ) {}

  async ensureUserFromKeycloakPayload(payload: any) {

    const keycloakSub = payload.sub;
    const email = payload.email;
    const name = payload.given_name || payload.name || '';
    const surname = payload.family_name || '';
    const role =  payload.resource_access[payload.azp].roles[0];
    const existing = await this.users.findByKeycloakSub?.(keycloakSub);
    if (existing) return existing;

 
/*  const nextNumber = await this.seq.next('users');
    const id_user = `usr_${String(nextNumber).padStart(3, '0')}`;

    const DEFAULT_ORG_ID = 'org_001';
    const newUser = await this.users.save({
      id_user,
      id_organization: DEFAULT_ORG_ID, 
      name,
      surname,
      user_email: email,
      active: true,
      keycloak_sub: keycloakSub,
    } as any);
    
    const nextUserOrg = await this.seq.next('organizationuser');
    const id_organization_user = `ou_${String(nextUserOrg).padStart(3, '0')}`;

    const orgUserEntity = new OrganizationUser(
      id_organization_user,
      DEFAULT_ORG_ID, 
      id_user,
      finalrole,
    );
    await this.orgUsers.save(orgUserEntity);
    return newUser; */
  }
}