// This file will be replaced by file replacement in project.json
// Default to development environment
import type { Environment } from './environment.type';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3030/api',
  frontendUrl: 'http://localhost:3000',

  // Demo mode support - uses local MongoDB when true
  demoMode: process.env.DEMO_MODE === 'true',

  mongodb: {
    // Local MongoDB (docker) URI
    uriLocal: process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017',
    // Remote MongoDB URI
    uri: process.env.MONGODB_URI || 'mongodb+srv://appuser:VruPdc3d4pKYEUwO@cluster0.giuoosh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    dbName: process.env.DB_NAME || 'filesdb',
    // Computed URI based on demo mode
    get activeUri(): string {
      return environment.demoMode ? this.uriLocal : this.uri;
    }
  },

  // File upload limits - Environment configurable with defaults
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // Default: 5MB (5 * 1024 * 1024)
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE || '52428800'), // Default: 50MB (50 * 1024 * 1024)
    maxFileCount: parseInt(process.env.MAX_FILE_COUNT || '8'), // Default: 8 files
    acceptedTypes: process.env.ACCEPTED_FILE_TYPES?.split(',') || [] // Empty = all types
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'default_user',
    password: process.env.DB_PASSWORD || 'default_password',
    database: process.env.DB_NAME || 'iagent_default'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  swagger: {
    enabled: true,
    title: 'iAgent API - Default',
    description: 'Default environment API documentation',
    version: '1.0.0'
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
  },
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3030',
      'https://morbargig.github.io',
      'https://bargigsoftwar.github.io',
      'https://iagent-1-jzyj.onrender.com',
      `http://localhost:${process.env.PORT || 3030}`
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  }
};
