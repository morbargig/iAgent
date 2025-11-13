// Default environment configuration
// This file will be replaced by file replacement in project.json
import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';
import { getEnvString, getEnvNumber } from './environment.helper';

const apiBaseUrl = getEnvString('VITE_API_BASE_URL', 'http://localhost:3030/api');

export const environment: Environment = {
  production: false,
  env: 'local',
  apiUrl: apiBaseUrl,
  baseUrl: getEnvString('VITE_BASE_URL', '/'),
  
  api: {
    baseUrl: apiBaseUrl,
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
    uploadTimeout: getEnvNumber('VITE_API_UPLOAD_TIMEOUT', 120000),
  },
  
  ...baseEnvironment,
};
