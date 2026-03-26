import { Module,BadRequestException } from '@nestjs/common';
import { KeycloakConnectModule, ResourceGuard, RoleGuard,AuthGuard,TokenValidation  } from 'nest-keycloak-connect';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakSyncGuard } from './keycloak-sync.guard';
import { UserProvisioningService } from './user-provisioning.service';
import { MongoosePersistenceModule } from '../persistence/mongoose/mongoose.module';

@Module({
  imports: [
    ConfigModule,
    MongoosePersistenceModule,
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const authServerUrl=config.get<string>('keycloak.authServerUrl');
        const realm=config.get<string>('keycloak.realm');
        const clientId=config.get<string>('keycloak.clientId');
        const secret=config.get<string>('keycloak.secret') || '';
        const publkey= config.get<string>('keycloak.realmPublicKey') ||'';
        if (!authServerUrl || !realm || !clientId) {
            throw new BadRequestException(
              `Missing Keycloak config: KEYCLOAK_AUTH_SERVER_URL or KEYCLOAK_REALM or KEYCLOAK_CLIENT_ID or KEYCLOAK_SECRET`,
            );
        }
/*         return { sin publickey de keycloak
          authServerUrl: authServerUrl ?? '',
          realm: realm ?? '',
          clientId: clientId ?? '',
          secret: secret ?? '',
          bearerOnly: true,
          
        }; */
        return {
          authServerUrl: authServerUrl ?? '',
          realm: realm ?? '',
          clientId: clientId ?? '',
          secret: secret ?? '',
          bearerOnly: true,
          tokenValidation: TokenValidation.OFFLINE,
          realmPublicKey: publkey,
          useNestLogger: true,
          logLevels: ['warn','debug'], 
        };

      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    KeycloakSyncGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ResourceGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    UserProvisioningService,  
    { provide: APP_GUARD, useClass: KeycloakSyncGuard },
  ],
  exports: [
    KeycloakConnectModule,
    KeycloakSyncGuard, 
  ],
})
export class AuthModule {}