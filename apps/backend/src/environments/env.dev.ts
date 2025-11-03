import type { Environment } from './environment.type';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3030/api',
  frontendUrl: 'https://morbargig.github.io/iAgent/',

  mongodb: {
    // MongoDB connection URI - REQUIRED: Set MONGODB_URI environment variable
    uri: process.env.MONGODB_URI || (() => {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
    })(),
    dbName: process.env.DB_NAME || 'filesdb'
  },

  // File upload limits - Environment configurable with defaults
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // Default: 5MB (5 * 1024 * 1024)
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE || '52428800'), // Default: 50MB (50 * 1024 * 1024)
    maxFileCount: parseInt(process.env.MAX_FILE_COUNT || '8'), // Default: 8 files
    acceptedTypes: process.env.ACCEPTED_FILE_TYPES?.split(',') || [] // Empty = all types
  },

  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3030',
      'https://morbargig.github.io',
      'https://bargigsoftwar.github.io',
      'https://iagent-1-jzyj.onrender.com',
      `http://localhost:${process.env.PORT || 3030}`
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },
  swagger: {
    enabled: true,
    title: 'iAgent API - Development',
    description: 'Development environment API documentation',
    version: '1.0.0',
    serverUrl: `http://localhost:${process.env.PORT || 3030}`
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
