import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';
import { getPort, getHost, getCorsOrigins } from './environment.helper';

const port = getPort();
const host = getHost();

export const environment: Environment = {
  production: true,
  port,
  host,
  apiUrl: process.env.API_URL || 'https://iagent-api.onrender.com/api',

  ...baseEnvironment,

  cors: {
    ...baseEnvironment.cors,
    origins: getCorsOrigins(),
  },

  swagger: {
    ...baseEnvironment.swagger,
    enabled: process.env.ENABLE_SWAGGER !== 'false',
    title: 'iAgent Agent API - Production',
    description: 'Production environment API documentation for streaming and mock generation',
    serverUrl: process.env.RENDER_EXTERNAL_URL || process.env.API_URL || 'https://iagent-api.onrender.com'
  },

  logging: {
    ...baseEnvironment.logging,
    level: process.env.LOG_LEVEL || 'info',
  },

  features: {
    ...baseEnvironment.features,
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  }
};

