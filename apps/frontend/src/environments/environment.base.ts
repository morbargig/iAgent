import type { Environment } from './environment.type';
import { getEnvBoolean, getEnvString } from './environment.helper';

export const baseEnvironment: Omit<Environment, 'env' | 'production' | 'apiUrl' | 'baseUrl' | 'api'> = {
  app: {
    name: 'iAgent',
    version: '1.0.0',
  },
  
  features: {
    enableMockMode: getEnvBoolean('VITE_ENABLE_MOCK_MODE', false),
    enableFileUpload: getEnvBoolean('VITE_ENABLE_FILE_UPLOAD', true),
    enableDocumentManagement: getEnvBoolean('VITE_ENABLE_DOCUMENT_MANAGEMENT', true),
    enableLanguageSwitcher: getEnvBoolean('VITE_ENABLE_LANGUAGE_SWITCHER', true),
    enableDarkMode: getEnvBoolean('VITE_ENABLE_DARK_MODE', true),
    enableAppDetails: getEnvBoolean('VITE_ENABLE_APP_DETAILS', true),
    enableContactUs: getEnvBoolean('VITE_ENABLE_CONTACT_US', true),
  },
  
  logging: {
    level: getEnvString('VITE_LOG_LEVEL', 'debug'),
    enableConsole: getEnvBoolean('VITE_ENABLE_CONSOLE_LOG', true),
  },
  
  contact: {
    phone: '+1-234-567-8900',
    email: 'support@iagent.com',
    teamName: 'iAgent Team',
  },
  
  buildDate: typeof __BUILD_DATE__ !== 'undefined' 
    ? __BUILD_DATE__ 
    : new Date().toISOString(),
};

