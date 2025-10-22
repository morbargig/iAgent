export const environment = {
  production: true,
  apiUrl: process.env.API_URL || 'https://api.iagent.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://iagent.com',

  // Demo mode support - uses local MongoDB when true (typically false in production)
  demoMode: process.env.DEMO_MODE === 'true',

  mongodb: {
    // Local MongoDB (docker) URI - not typically used in production
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
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'prod_user',
    password: process.env.DB_PASSWORD || 'prod_password',
    database: process.env.DB_NAME || 'iagent_prod'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'prod-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://iagent.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },
  swagger: {
    enabled: process.env.ENABLE_SWAGGER !== 'false', // Default to true unless explicitly disabled
    title: 'iAgent API - Production',
    description: 'Production environment API documentation',
    version: '1.0.0'
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
