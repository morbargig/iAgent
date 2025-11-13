/**
 * Environment Type Definition for Backend
 * This file defines the type structure for all environment configurations
 */

export interface Environment {
  production: boolean;
  port: number;
  host: string;
  apiUrl: string;
  frontendUrl: string;
  
  mongodb: {
    uri: string;
    dbName: string;
  };
  
  fileUpload: {
    maxFileSize: number;
    maxTotalSize: number;
    maxFileCount: number;
    acceptedTypes: string[];
  };
  
  jwt: {
    secret: string;
    expiresIn: string;
  };
  
  cors: {
    origins: (string | RegExp)[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  
  swagger: {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    serverUrl?: string;
  };
  
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
  };
  
  features: {
    enableSwagger: boolean;
    enableCors: boolean;
    enableRateLimit: boolean;
    enableHelmet: boolean;
  };
}

