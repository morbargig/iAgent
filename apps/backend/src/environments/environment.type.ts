/**
 * Environment Type Definition for Backend
 * This file defines the type structure for all environment configurations
 */

export interface Environment {
  production: boolean;
  apiUrl: string;
  frontendUrl: string;
  demoMode: boolean;
  
  mongodb: {
    uriLocal: string;
    uri: string;
    dbName: string;
    activeUri: string;
  };
  
  fileUpload: {
    maxFileSize: number;
    maxTotalSize: number;
    maxFileCount: number;
    acceptedTypes: string[];
  };
  
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  
  jwt: {
    secret: string;
    expiresIn: string;
  };
  
  cors: {
    origins: string[];
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

