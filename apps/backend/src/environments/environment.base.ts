import type { Environment } from './environment.type';
import { requireEnv, getPort, getCorsOrigins, getAppVersion } from './environment.helper';

export const baseEnvironment: Omit<Environment, 'production' | 'port' | 'host' | 'apiUrl' | 'frontendUrl'> = {
  app: {
    name: 'iAgent BFF',
    version: getAppVersion(),
  },
  
  mongodb: {
    uri: requireEnv('MONGODB_URI', '.env file'),
    dbName: requireEnv('DB_NAME', '.env file'),
  },

  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // Default: 5MB (5 * 1024 * 1024)
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE || '52428800'), // Default: 50MB (50 * 1024 * 1024)
    maxFileCount: parseInt(process.env.MAX_FILE_COUNT || '8'), // Default: 8 files
    acceptedTypes: process.env.ACCEPTED_FILE_TYPES?.split(',') || [] // Empty = all types
  },
  
  jwt: {
    secret: requireEnv('JWT_SECRET', '.env file'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  cors: {
    origins: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },

  swagger: {
    enabled: true,
    title: 'iAgent API',
    description: 'iAgent API documentation',
    version: getAppVersion(),
    serverUrl: `http://localhost:${getPort()}`,
    contact: {
      name: process.env.SWAGGER_CONTACT_NAME || 'iAgent',
      url: process.env.SWAGGER_CONTACT_URL || 'https://morbargig.github.io/iAgent/',
      email: process.env.SWAGGER_CONTACT_EMAIL || 'morbargig@gmail.com'
    }
  },

  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false
  },

  features: {
    enableSwagger: true,
    enableCors: true,
    enableRateLimit: false,
    enableHelmet: false
  }
};

