// src/infrastructure/integrations/blockchain/ethers-auth.interceptor.ts
import { FetchRequest } from 'ethers';
import { KeycloakAuthTokenService } from './auth/keycloak-auth-token.service';

export function configureEthersAuthInterceptor(
  tokenService: KeycloakAuthTokenService,
) {
  const originalSend = FetchRequest.prototype.send;

  
  if ((FetchRequest.prototype as any)._pprAuthPatched) {
    return;
  }

  (FetchRequest.prototype as any)._pprAuthPatched = true;

  FetchRequest.prototype.send = async function (...args: any[]) {
    //try {
      const accessToken = await tokenService.getToken();
      this.setHeader('Authorization', `Bearer ${accessToken}`);
      // console.log("\n📋 Request Headers:");
      // console.log("URL:", this.url);
      // console.log("Method:", this.method || "POST");
      // console.log("Headers:", this.headers);
    //} catch (error: any) {
    //  console.error('Error setting Authorization header in FetchRequest:', error?.message ?? error);
    //}

    return originalSend.apply(this, args);
  };
}
