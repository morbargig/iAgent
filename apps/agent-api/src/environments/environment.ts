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

  ...baseEnvironment,

  cors: {
    ...baseEnvironment.cors,
    origins: [
      `http://localhost:${port}`,
      'http://localhost:3030',
      'http://localhost:3000',
      ...getCorsOrigins()],
  },

  swagger: {
    ...baseEnvironment.swagger,
    serverUrl: `http://localhost:${port}`,
  },
};

