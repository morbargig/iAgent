export const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  return value !== undefined ? value === 'true' : defaultValue;
};

export const getEnvString = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key];
  return value !== undefined ? value : defaultValue;
};

export const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  return value !== undefined ? Number(value) : defaultValue;
};

