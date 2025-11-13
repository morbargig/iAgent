import type { Environment } from './environment.type';

export const requireEnv = (varName: string, context?: string): string => {
  const value = process.env[varName];
  if (!value) {
    const contextMsg = context ? ` in your ${context}` : '';
    throw new Error(`${varName} environment variable is required. Please set it${contextMsg}.`);
  }
  return value;
};

export const getPort = (): number => {
  return parseInt(process.env.PORT || '3030', 10);
};

export const getHost = (): string => {
  return process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');
};

export const baseEnvironment: Omit<Environment, 'production' | 'port' | 'host' | 'apiUrl' | 'frontendUrl'> = {
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
    origins: [
      `http://localhost:${getPort()}`
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },

  swagger: {
    enabled: true,
    title: 'iAgent API',
    description: 'iAgent API documentation',
    version: '1.0.0',
    serverUrl: `http://localhost:${getPort()}`
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

