// src/infrastructure/integrations/auth/keycloak-auth-token.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KeycloakAuthTokenService {
  private token: string | null = null;
  private tokenExpiresAt: number | null = null; //milisecond

  constructor(private readonly config: ConfigService) {}

  private get tokenUrl(): string {
    // podrías parametrizar el host/realm por env
    return this.config.get<string>('keycloak.tokenUrl')
      ?? 'https://keycloak-ppr.l-net.io/realms/ppr-realm/protocol/openid-connect/token';
  }

  async getToken(): Promise<string> {
    const now = Date.now();

    if (this.token && this.tokenExpiresAt && now < this.tokenExpiresAt - 30_000) {
      // token aún válido, devolvémoslo
      return this.token;
    }

    const clientId = this.config.getOrThrow<string>('ZK_KEYCLOAK_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('ZK_KEYCLOAK_CLIENT_SECRET');
    const username = this.config.getOrThrow<string>('ZK_KEYCLOAK_USERNAME');
    const password = this.config.getOrThrow<string>('ZK_KEYCLOAK_PASSWORD');

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      scope: 'openid email profile',
    });

    const response = await axios.post(
      this.tokenUrl,
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ppr-backend-blockchain-client',
        },
      },
    );

    const { id_token, expires_in } = response.data;

    this.token = id_token;
    this.tokenExpiresAt = now + (expires_in ?? 300) * 1000;

    return id_token;
  }
}
