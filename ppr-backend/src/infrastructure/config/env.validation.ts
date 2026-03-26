import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string().required(),
  PORT: Joi.number().default(3000),
  GLOBAL_PREFIX: Joi.string().default('ppr'),

  MONGODB_URI: Joi.string().uri().required(),
  MONGODB_DB: Joi.string().required(),

  KEYCLOAK_AUTH_SERVER_URL: Joi.string().uri().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_SECRET: Joi.string().required(),

  ZK_KEYCLOAK_TOKEN_URL: Joi.string().uri().required(),
  ZK_RPC_NODE_URL: Joi.string().uri().required(),
  ZK_USER_PRIVATE_KEY: Joi.string().required(),
  ZK_USER_ADDRESS: Joi.string().required(),
  ZK_KEYCLOAK_CLIENT_ID: Joi.string().required(),
  ZK_KEYCLOAK_CLIENT_SECRET: Joi.string().required(),
  ZK_KEYCLOAK_USERNAME: Joi.string().required(),
  ZK_KEYCLOAK_PASSWORD: Joi.string().required(),
  TRUSTED_FORWARDER: Joi.string().required(),

  RPC_URL: Joi.string().uri().required(),
  PRIVATE_KEY: Joi.string().required(),
  GAS_NODE_ADDRESS: Joi.string().allow('').optional(),
  GAS_EXPIRATION: Joi.number().integer().optional(),

  FILE_STORE_API_URL:Joi.string().uri().required(),
  FILE_STORE_API_KEY: Joi.string().min(1).required(),

  NEST_LOG_LEVEL: Joi.string()
    .pattern(/^(log|error|warn|debug|verbose)(,(log|error|warn|debug|verbose))*$/)
    .default('log,error,warn'),
   
  POK_API_URL:  Joi.string().uri().required(),
  POK_APIKEY:  Joi.string().required(),
  ADDRESS_CONTRACT: Joi.string().required(),
  GSPONSOR_SEED: Joi.string().required(),

  METRICS_TOKEN: Joi.string().min(16).required(),
});
