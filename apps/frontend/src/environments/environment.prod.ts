// Production environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';

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
  
  // Base configuration with prod-specific overrides
  ...baseEnvironment,
  
  logging: {
    ...baseEnvironment.logging,
    level: import.meta.env.VITE_LOG_LEVEL || 'error',
    enableConsole: false,
  },
};
