// Staging environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment, getPort, getHost } from './environment.base';

const port = getPort();
const host = getHost();

export const environment: Environment = {
  production: false,
  port,
  host,
  apiUrl: process.env.API_URL || 'https://iagent-stage.onrender.com/api',
  frontendUrl: 'https://morbargig.github.io/iAgent/',

  // Base configuration with stage-specific overrides
  ...baseEnvironment,

  jwt: {
    ...baseEnvironment.jwt,
    expiresIn: process.env.JWT_EXPIRES_IN || '12h'
  },

  cors: {
    ...baseEnvironment.cors,
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
      'https://morbargig.github.io',
      'https://bargigsoftwar.github.io',
      'https://iagent-stage.onrender.com',
      'http://localhost:3000',
      `http://localhost:${port}`
    ],
  },

  swagger: {
    ...baseEnvironment.swagger,
    enabled: process.env.ENABLE_SWAGGER !== 'false',
    title: 'iAgent API - Staging',
    description: 'Staging environment API documentation',
    serverUrl: process.env.API_URL || 'https://iagent-stage.onrender.com'
  },

  logging: {
    ...baseEnvironment.logging,
    level: process.env.LOG_LEVEL || 'info',
    enableFile: true
  },

  features: {
    ...baseEnvironment.features,
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    enableRateLimit: true,
    enableHelmet: true
  }
};

