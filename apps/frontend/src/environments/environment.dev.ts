// Development environment configuration
import type { Environment } from './environment.type';

// Get API URL once
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api';

export const environment: Environment = {
  production: false,
  env: 'dev',
  apiUrl: apiBaseUrl,
  baseUrl: import.meta.env.VITE_BASE_URL || '/',
  
  // API Configuration
  api: {
    baseUrl: apiBaseUrl,
    timeout: 30000,
    uploadTimeout: 120000,
  },
  
  // Application Configuration
  app: {
    name: 'iAgent',
    version: '1.0.0',
    demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  },
  
  // Feature Flags
  features: {
    enableMockMode: import.meta.env.VITE_ENABLE_MOCK_MODE === 'true',
    enableFileUpload: true,
    enableDocumentManagement: true,
  },
  
  // Logging Configuration
  logging: {
    level: 'debug',
    enableConsole: true,
  }
};
