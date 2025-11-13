export const requireEnv = (varName: string, context?: string): string => {
  const value = process.env[varName];
  if (!value) {
    const contextMsg = context ? ` in your ${context}` : '';
    throw new Error(`${varName} environment variable is required. Please set it${contextMsg}.`);
  }
  return value;
};

export const getPort = (): number => {
  return parseInt(process.env.PORT || '3030', 10);
};

export const getHost = (): string => {
  return process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');
};

export const getCorsOrigins = (): (string | RegExp)[] => {
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  
  if (!corsOriginsEnv) {
    return [
      `http://localhost:${getPort()}`,
    ];
  }

  return corsOriginsEnv.split(',').map((origin) => {
    const trimmed = origin.trim();
    
    if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
      const pattern = trimmed.slice(1, -1);
      try {
        return new RegExp(pattern);
      } catch {
        console.warn(`Invalid regex pattern in CORS_ORIGINS: ${pattern}. Using as string.`);
        return trimmed;
      }
    }
    
    return trimmed;
  });
};

declare const __APP_VERSION__: string;

export const getAppVersion = (): string => {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }
  
  if (typeof __APP_VERSION__ !== 'undefined') {
    return __APP_VERSION__;
  }
  
  return '1.0.0';
};

