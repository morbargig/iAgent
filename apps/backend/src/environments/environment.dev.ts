// Development environment configuration
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

  // Base configuration with dev-specific overrides
  ...baseEnvironment,

  cors: {
    ...baseEnvironment.cors,
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      `http://localhost:${port}`,
      'https://morbargig.github.io',
      'https://bargigsoftwar.github.io',
      'https://iagent-1-jzyj.onrender.com',
    ],
  },

  swagger: {
    ...baseEnvironment.swagger,
    title: 'iAgent API - Development',
    description: 'Development environment API documentation',
    serverUrl: `http://localhost:${port}`
  },
};
