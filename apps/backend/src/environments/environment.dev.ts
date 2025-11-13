// Development environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';
import { getPort, getHost, getCorsOrigins } from './environment.helper';

const port = getPort();
const host = getHost();

export const environment: Environment = {
  production: false,
  port,
  host,
  apiUrl: `http://localhost:${port}/api`,
  frontendUrl: 'https://morbargig.github.io/iAgent/',

  // Base configuration with dev-specific overrides
  ...baseEnvironment,

  cors: {
    ...baseEnvironment.cors,
    origins: getCorsOrigins(),
  },

  swagger: {
    ...baseEnvironment.swagger,
    title: 'iAgent API - Development',
    description: 'Development environment API documentation',
    serverUrl: `http://localhost:${port}`
  },
};

