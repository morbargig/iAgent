
export const environment = {
  production: false,
  apiUrl: process.env.API_URL || 'https://staging-api.iagent.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://staging.iagent.com',

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
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // Default: 5MB
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE || '52428800'), // Default: 50MB
    maxFileCount: parseInt(process.env.MAX_FILE_COUNT || '8'), // Default: 8 files
    acceptedTypes: process.env.ACCEPTED_FILE_TYPES?.split(',') || [] // Empty = all types
  },
  database: {
    host: process.env.DB_HOST || 'staging-db-host',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'staging_user',
    password: process.env.DB_PASSWORD || 'staging_password',
    database: process.env.DB_NAME || 'iagent_staging'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'staging-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://staging.iagent.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },
  swagger: {
    enabled: process.env.ENABLE_SWAGGER !== 'false',
    title: 'iAgent API - Staging',
    description: 'Staging environment API documentation',
    version: '1.0.0'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'warn',
    enableConsole: true,
    enableFile: true
  },
  features: {
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    enableCors: true,
    enableRateLimit: true,
    enableHelmet: true
  }
};
