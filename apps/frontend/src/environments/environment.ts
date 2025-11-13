// Default environment configuration
// This file will be replaced by file replacement in project.json
import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';

// Get API URL once
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api';

export const environment: Environment = {
  production: false,
  env: 'local',
  apiUrl: apiBaseUrl,
  baseUrl: import.meta.env.VITE_BASE_URL || '/',
  
  // API Configuration
  api: {
    baseUrl: apiBaseUrl,
    timeout: 30000,
    uploadTimeout: 120000,
  },
  
  // Base configuration with overrides
  ...baseEnvironment,
  
  // Local-specific overrides
  features: {
    ...baseEnvironment.features,
    enableMockMode: false,
    enableFileUpload: false,
  },
  
  logging: {
    ...baseEnvironment.logging,
    level: import.meta.env.VITE_LOG_LEVEL || 'debug',
  },
};
