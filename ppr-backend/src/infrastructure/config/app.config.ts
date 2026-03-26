export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX ?? 'ppr',
    env: process.env.NODE_ENV ?? 'development',
  },
  db: {
    uri: process.env.MONGODB_URI ?? '',
    name: process.env.MONGODB_DB ?? '',
  },
  keycloak: {
    authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL ?? '',
    realm: process.env.KEYCLOAK_REALM ?? '',
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
    secret: process.env.KEYCLOAK_SECRET ?? '',
    realmPublicKey: process.env.KEYCLOAK_REALM_PUBLIC_KEY ?? '',
  },
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK ?? 'prividium',
    url: process.env.RPC_URL ?? '',
    privateKey: process.env.PRIVATE_KEY ?? '',
    gasNodeAddress: process.env.GAS_NODE_ADDRESS ?? '',
    gasExpiration: process.env.GAS_EXPIRATION ? Number(process.env.GAS_EXPIRATION): 0,
    address_contract: process.env.ADDRESS_CONTRACT,  
    trusted_forwarder: process.env.TRUSTED_FORWARDER ?? '0xa4B5eE2906090ce2cDbf5dfff944db26f397037D',
    zk_keycloak_token_url: process.env.ZK_KEYCLOAK_TOKEN_URL,
    zk_rpc_node_url: process.env.ZK_RPC_NODE_URL ?? '',
    zk_user_private_key: process.env.ZK_USER_PRIVATE_KEY ?? '',
    zk_user_address: process.env.ZK_USER_ADDRESS ?? '',
    zk_keycloak_client_id: process.env.ZK_KEYCLOAK_CLIENT_ID ?? '',
    zk_keycloak_client_secret: process.env.ZK_KEYCLOAK_CLIENT_SECRET ?? '',
    zk_keycloak_username: process.env.ZK_KEYCLOAK_USERNAME ?? '',
    zk_keycloak_password: process.env.ZK_KEYCLOAK_PASSWORD ?? '',
    address_token:process.env.ADDRESS_TOKEN ?? '',
    gsponsor_seed: process.env.GSPONSOR_SEED ?? 'vapor undo month settle boost youth club empower shove expire green hood',

  },
  storage: {
    apiUrl: process.env.FILE_STORE_API_URL ?? '',
    apiKey: process.env.FILE_STORE_API_KEY ?? '',
  },
  logging: {
    level: process.env.NEST_LOG_LEVEL ?? 'log,error,warn',
  },
  pok: {
    url: process.env.POK_API_URL?? '',
    apikey: process.env.POK_APIKEY?? '',
  },
});