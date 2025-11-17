import type { Environment } from './environment.type';
import { getPort, getCorsOrigins, getAppVersion } from './environment.helper';

export const baseEnvironment: Omit<Environment, 'production' | 'port' | 'host' | 'apiUrl'> = {
  app: {
    name: 'iAgent Agent API',
    version: getAppVersion(),
  },
  
  cors: {
    origins: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    credentials: true
  },

  logging: {
    level: 'debug',
    enableConsole: true
  },

  swagger: {
    enabled: true,
    title: 'iAgent Agent API',
    description: 'iAgent Agent API documentation for streaming and mock generation',
    version: getAppVersion(),
    serverUrl: `http://localhost:${getPort()}`,
    contact: {
      name: process.env.SWAGGER_CONTACT_NAME || 'iAgent',
      url: process.env.SWAGGER_CONTACT_URL || 'https://morbargig.github.io/iAgent/',
      email: process.env.SWAGGER_CONTACT_EMAIL || 'morbargig@gmail.com'
    }
  },

  features: {
    enableCors: true,
    enableSwagger: true
  }
};

