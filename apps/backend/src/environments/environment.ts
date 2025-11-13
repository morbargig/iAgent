// This file will be replaced by file replacement in project.json
// Local environment configuration (default)
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

  // Base configuration with local-specific overrides
  ...baseEnvironment,

  cors: {
    ...baseEnvironment.cors,
    origins: [
      `http://localhost:${port}`,
      `http://localhost:3000`,
      ...getCorsOrigins()],
  },

  swagger: {
    ...baseEnvironment.swagger,
    title: 'iAgent API - Local',
    description: 'Local environment API documentation',
    serverUrl: `http://localhost:${port}`
  },
};
