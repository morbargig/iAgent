// Production environment configuration
import type { Environment } from './environment.type';
import { baseEnvironment } from './environment.base';
import { getEnvString, getEnvNumber } from './environment.helper';

const apiBaseUrl = getEnvString('VITE_API_BASE_URL', 'https://iagent-1-jzyj.onrender.com/api');

export const environment: Environment = {
  production: true,
  env: 'prod',
  apiUrl: apiBaseUrl,
  baseUrl: getEnvString('VITE_BASE_URL', '/'),
  
  api: {
    baseUrl: apiBaseUrl,
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
    uploadTimeout: getEnvNumber('VITE_API_UPLOAD_TIMEOUT', 120000),
  },
  
  ...baseEnvironment,
};
