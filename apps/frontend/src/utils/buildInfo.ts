import type { Environment } from '../environments/environment.type.js';

export type BuildInfo = {
  version: string;
  buildDateIso: string;
  displayVersion: string;
};

export const getBuildInfo = (
  environment: Environment,
  envSuffix = environment.env,
): BuildInfo => {
  const version =
    typeof __APP_VERSION__ !== 'undefined'
      ? __APP_VERSION__
      : environment.app.version;

  const buildDateIso =
    environment.buildDate ??
    (typeof __BUILD_DATE__ !== 'undefined'
      ? __BUILD_DATE__
      : new Date().toISOString());

  return {
    version,
    buildDateIso,
    displayVersion: `v.${version}-${envSuffix}`,
  };
};

export const formatBuildDate = (
  dateString: string,
  locale: string,
): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return date.toLocaleString(locale, options);
};

export const getLocaleCode = (currentLang: string): string => {
  switch (currentLang) {
    case 'he':
      return 'he-IL';
    case 'ar':
      return 'ar-SA';
    default:
      return 'en-US';
  }
};
