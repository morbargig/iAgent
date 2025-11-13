// This file will be replaced by file replacement in project.json
// Local environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment, getPort, getHost } from './environment.base';

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

  swagger: {
    ...baseEnvironment.swagger,
    title: 'iAgent API - Local',
    description: 'Local environment API documentation',
    serverUrl: `http://localhost:${port}`
  },
};
