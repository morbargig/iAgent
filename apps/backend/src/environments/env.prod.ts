import type { Environment } from './environment.type';

export const environment: Environment = {
  production: true,
  apiUrl: process.env.API_URL || 'https://iagent-1-jzyj.onrender.com/api',
  frontendUrl: 'https://morbargig.github.io/iAgent/',

  mongodb: {
    // MongoDB connection URI - REQUIRED: Set MONGODB_URI environment variable
    uri: process.env.MONGODB_URI || (() => {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your environment variables.');
    })(),
    dbName: process.env.DB_NAME || 'filesdb'
  },

  // File upload limits - Environment configurable with defaults
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // Default: 5MB
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE || '52428800'), // Default: 50MB
    maxFileCount: parseInt(process.env.MAX_FILE_COUNT || '8'), // Default: 8 files
    acceptedTypes: process.env.ACCEPTED_FILE_TYPES?.split(',') || [] // Empty = all types
  },
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET environment variable is required. Please set it in your environment variables.');
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
      'https://morbargig.github.io',
      "https://bargigsoftwar.github.io",
      'https://iagent-1-jzyj.onrender.com',
      'http://localhost:3000',
      'http://localhost:3030',
      `http://localhost:${process.env.PORT || 3030}`
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },
  swagger: {
    enabled: process.env.ENABLE_SWAGGER !== 'false', // Default to true unless explicitly disabled
    title: 'iAgent API - Production',
    description: 'Production environment API documentation',
    version: '1.0.0',
    serverUrl: process.env.RENDER_EXTERNAL_URL || process.env.API_URL || 'https://iagent-1-jzyj.onrender.com'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: true
  },
  features: {
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false', // Default to true unless explicitly disabled
    enableCors: true,
    enableRateLimit: true,
    enableHelmet: true
  }
};
