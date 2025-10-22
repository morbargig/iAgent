export const environment = {
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
    host: 'localhost',
    port: 5432,
    username: 'test_user',
    password: 'test_password',
    database: 'iagent_test'
  },
  jwt: {
    secret: 'test-jwt-secret-key',
    expiresIn: '1h'
  },
  cors: {
    origins: ['http://localhost:3000', 'http://localhost:3030'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true
  },
  swagger: {
    enabled: true,
    title: 'iAgent API - Test',
    description: 'Test environment API documentation',
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
  }
};
