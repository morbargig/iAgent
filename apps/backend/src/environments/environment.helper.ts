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

export const getFrontendUrl = (): string => {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

const toOrigin = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
};

const parseCorsOriginEntry = (entry: string): string | RegExp => {
  const trimmed = entry.trim();
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    const pattern = trimmed.slice(1, -1);
    try {
      return new RegExp(pattern);
    } catch {
      console.warn(`Invalid regex pattern in CORS_ORIGINS: ${pattern}. Using as string.`);
      return trimmed;
    }
  }
  return toOrigin(trimmed) ?? trimmed;
};

const getLocalDevCorsOrigins = (): string[] => {
  const port = getPort();
  return [
    `http://localhost:${port}`,
    'http://localhost:3000',
    'http://localhost:4200',
    'http://localhost:4300',
  ];
};

const collectOriginEntriesFromEnv = (): string[] => {
  const entries: string[] = [];

  if (process.env.CORS_ORIGINS?.trim()) {
    entries.push(...process.env.CORS_ORIGINS.split(','));
  }

  for (const envVar of ['FRONTEND_URL', 'API_URL', 'RENDER_EXTERNAL_URL'] as const) {
    const value = process.env[envVar]?.trim();
    if (value) {
      entries.push(value);
    }
  }

  return entries;
};

export const getCorsOrigins = (): (string | RegExp)[] => {
  const entries = collectOriginEntriesFromEnv();

  if (entries.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        'CORS_ORIGINS (and FRONTEND_URL/API_URL) are not set. Configure CORS_ORIGINS in your environment.',
      );
      return [];
    }
    return getLocalDevCorsOrigins();
  }

  const origins = new Set<string | RegExp>();
  for (const entry of entries) {
    origins.add(parseCorsOriginEntry(entry));
  }

  if (process.env.NODE_ENV !== 'production') {
    for (const origin of getLocalDevCorsOrigins()) {
      origins.add(origin);
    }
  }

  return [...origins];
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
