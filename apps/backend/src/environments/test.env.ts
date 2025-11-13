// Test environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment, requireEnv, getPort, getHost } from './environment.base';

const port = getPort();
const host = getHost();

export const environment: Environment = {
  production: false,
  port,
  host,
  apiUrl: `http://localhost:${port}/api`,
  frontendUrl: 'https://morbargig.github.io/iAgent/',

  // Base configuration with test-specific overrides
  ...baseEnvironment,

  mongodb: {
    ...baseEnvironment.mongodb,
    uri: requireEnv('MONGODB_URI', 'test environment'),
  },

  jwt: {
    secret: 'test-jwt-secret-key',
    expiresIn: '1h'
  },

  cors: {
    ...baseEnvironment.cors,
    origins: ['http://localhost:3000', `http://localhost:${port}`],
  },

  swagger: {
    ...baseEnvironment.swagger,
    title: 'iAgent API - Test',
    description: 'Test environment API documentation',
    serverUrl: `http://localhost:${port}`
  },
};
