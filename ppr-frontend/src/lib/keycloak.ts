import Keycloak from 'keycloak-js'

function getEnv(key: string, fallback: string): string {
  if (typeof window !== 'undefined' && window.__ENV?.[key]) {
    return window.__ENV[key]
  }
  return fallback
}

export const keycloakConfig = {
  get url() {
    return getEnv('KEYCLOAK_URL', '') //https://keycloak-ppr.l-net.io/
  },
  get realm() {
    return getEnv('KEYCLOAK_REALM', '') //ppr-realm
  },
  get clientId() {
    return getEnv('KEYCLOAK_CLIENT_ID', '') //ppr-api-client
  },
}
export function createKeycloakClient() {
  return new Keycloak({
    url: keycloakConfig.url,
    realm: keycloakConfig.realm,
    clientId: keycloakConfig.clientId,
  })
}

export const keycloakInitOptions = {
  onLoad: 'check-sso' as const,
  checkLoginIframe: false,
  pkceMethod: 'S256' as const,
}

