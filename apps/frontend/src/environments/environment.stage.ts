// Staging environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';

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
  
  // Base configuration with stage-specific overrides
  ...baseEnvironment,
  
  features: {
    ...baseEnvironment.features,
    enableMockMode: import.meta.env.VITE_ENABLE_MOCK_MODE === 'true',
  },
};
