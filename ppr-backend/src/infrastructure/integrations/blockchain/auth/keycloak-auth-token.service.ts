// src/infrastructure/integrations/auth/keycloak-auth-token.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KeycloakAuthTokenService {
  private token: string | null = null;
  private tokenExpiresAt: number | null = null; // timestamp en ms

  constructor(private readonly config: ConfigService) {}

  private get keycloakUrl(): string {

    return (
      this.config.get<string>('KEYCLOACK_URL') ||
      this.config.get<string>('keycloak.tokenUrl') ||
      'https://keycloak-ppr.l-net.io/realms/ppr-realm/protocol/openid-connect/token'
    );
  }

  private get prividiumUrl(): string {
    return this.config.getOrThrow<string>('ZK_PERMISSION_SERVICE_URL');
  }

  async getToken(): Promise<string> {
    const now = Date.now();

    // si ya tengo token de Prividium y no venció → lo reutilizo
    if (this.token && this.tokenExpiresAt && now < this.tokenExpiresAt - 30_000) {
      return this.token;
    }

    // 💡 Usamos los mismos nombres que tu script “nuevo”
    const clientId = this.config.getOrThrow<string>('ZK_KEYCLOAK_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('ZK_KEYCLOAK_CLIENT_SECRET');
    const username = this.config.getOrThrow<string>('ZK_KEYCLOAK_USERNAME');
    const password = this.config.getOrThrow<string>('ZK_KEYCLOAK_PASSWORD');

    // 1) Auth contra Keycloak → id_token
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      scope: 'openid email profile',
    });

    const resKeycloak = await axios.post(
      this.keycloakUrl,
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ppr-backend-blockchain-client',
        },
      },
    );

    const { id_token, expires_in } = resKeycloak.data;
    if (!id_token) {
      throw new Error('Keycloak no devolvió id_token');
    }

  
    const r2 = await axios.post(
      this.prividiumUrl,
      { jwt: id_token },
      { headers: { 'content-type': 'application/json' } },
    );

    const privToken: string = r2.data.token;
    if (!privToken) {
      throw new Error('Prividium no devolvió token');
    }

    // Cache del token de Prividium (no tenemos expires_in de Prividium,
    // así que usamos el de Keycloak como referencia o 5 min por default)
    const ttl = (expires_in ?? 300) * 1000;
    this.token = privToken;
    this.tokenExpiresAt = now + ttl;

    return privToken;
  }
}
