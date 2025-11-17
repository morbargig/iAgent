export interface Environment {
  production: boolean;
  port: number;
  host: string;
  apiUrl: string;
  
  app: {
    name: string;
    version: string;
  };
  
  cors: {
    origins: (string | RegExp)[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  
  logging: {
    level: string;
    enableConsole: boolean;
  };
  
  features: {
    enableCors: boolean;
    enableSwagger: boolean;
  };

  swagger: {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    serverUrl?: string;
    contact?: {
      name: string;
      url?: string;
      email?: string;
    };
  };
}

