// Staging environment configuration

export const environment = {
  production: false,
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'https://iagent-1-jzyj.onrender.com/api',
  baseUrl: import.meta.env.VITE_BASE_URL || '/',
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://iagent-1-jzyj.onrender.com/api',
    timeout: 30000,
    uploadTimeout: 120000,
  },
  
  // Application Configuration
  app: {
    name: 'iAgent',
    version: '1.0.0',
    demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  },
  
  // Feature Flags
  features: {
    enableMockMode: false,
    enableFileUpload: true,
    enableDocumentManagement: true,
  },
  
  // Logging Configuration
  logging: {
    level: 'info',
    enableConsole: true,
  }
};
