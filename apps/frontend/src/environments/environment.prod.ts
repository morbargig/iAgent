// Production environment configuration
import type { Environment } from './environment.type';

// Get API URL once
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://iagent-1-jzyj.onrender.com/api';

export const environment: Environment = {
  production: true,
  env: 'prod',
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
  },
  
  // Feature Flags
  features: {
    enableMockMode: false,
    enableFileUpload: true,
    enableDocumentManagement: true,
  },
  
  // Logging Configuration
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || 'error',
    enableConsole: false,
  },
  
  // Contact Information
  contact: {
    phone: '+1-234-567-8900',
    email: 'support@iagent.com',
    teamName: 'iAgent Team',
  },
  
  // Build Information
  buildDate: typeof __BUILD_DATE__ !== 'undefined' 
    ? __BUILD_DATE__ 
    : new Date().toISOString(),
};
