export const getPort = (): number => {
  return parseInt(process.env.PORT || '3033', 10);
};

export const getHost = (): string => {
  return process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');
};

export const getCorsOrigins = (): (string | RegExp)[] => {
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  
  if (!corsOriginsEnv) {
    return [
      `http://localhost:${getPort()}`,
      'http://localhost:3030',
      'http://localhost:3000',
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
declare const __BUILD_DATE__: string;

export const getAppVersion = (): string => {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }
  
  if (typeof __APP_VERSION__ !== 'undefined') {
    return __APP_VERSION__;
  }
  
  return '1.0.0';
};

export const getBuildDate = (): string => {
  if (process.env.BUILD_DATE) {
    return process.env.BUILD_DATE;
  }

  if (typeof __BUILD_DATE__ !== 'undefined') {
    return __BUILD_DATE__;
  }

  return new Date().toISOString();
};

export const formatSwaggerBuildDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
};

export const getSwaggerVersionLabel = (deployEnv: string): string =>
  `${deployEnv}-${getAppVersion()} · ${formatSwaggerBuildDate(getBuildDate())}`;


