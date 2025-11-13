/**
 * Environment Type Definition for Frontend
 * This file defines the type structure for all environment configurations
 */

export interface Environment {
  production: boolean;
  env: 'dev' | 'prod' | 'test' | 'local';
  apiUrl: string;
  baseUrl: string;
  
  api: {
    baseUrl: string;
    timeout: number;
    uploadTimeout: number;
  };
  
  app: {
    name: string;
    version: string;
  };
  
  features: {
    enableMockMode: boolean;
    enableFileUpload: boolean;
    enableDocumentManagement: boolean;
  };
  
  logging: {
    level: string;
    enableConsole: boolean;
  };
  
  contact: {
    phone: string;
    email: string;
    teamName: string;
  };
  
  buildDate?: string;
}

