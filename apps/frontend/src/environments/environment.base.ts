import type { Environment } from './environment.type';

export const baseEnvironment: Omit<Environment, 'env' | 'production' | 'apiUrl' | 'baseUrl' | 'api'> = {
  app: {
    name: 'iAgent',
    version: '1.0.0',
  },
  
  features: {
    enableMockMode: false,
    enableFileUpload: true,
    enableDocumentManagement: true,
    enableLanguageSwitcher: true,
    enableDarkMode: true,
    enableAppDetails: true,
    enableContactUs: true,
  },
  
  logging: {
    level: 'debug',
    enableConsole: true,
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

