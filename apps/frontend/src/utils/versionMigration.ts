import type { LocalStorageKeys } from '../types/storage.types';

export interface VersionParts {
  major: number;
  minor: number;
  patch: number;
}

export const parseVersion = (version: string): VersionParts | null => {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return null;
  }
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
};

export const compareVersions = (
  storedVersion: string,
  currentVersion: string
): 'major' | 'minor' | 'patch' | 'same' | null => {
  const stored = parseVersion(storedVersion);
  const current = parseVersion(currentVersion);

  if (!stored || !current) {
    return null;
  }

  if (stored.major !== current.major) {
    return 'major';
  }
  if (stored.minor !== current.minor) {
    return 'minor';
  }
  if (stored.patch !== current.patch) {
    return 'patch';
  }

  return 'same';
};

export const getKeysToRemoveOnMinorChange = (): LocalStorageKeys[] => {
  return [
    'chatbot-conversations',
    'chatbot-current-conversation-id',
    'enabled-tools',
    'tool-configurations',
    'date-range-settings',
  ];
};

export const getAllLocalStorageKeys = (): LocalStorageKeys[] => {
  return [
    'app-version',
    'chatbot-sidebar-open',
    'chatbot-theme-mode',
    'chatbot-conversations',
    'chatbot-current-conversation-id',
    'sidebar-width',
    'report-panel-width',
    'enabled-tools',
    'tool-configurations',
    'selected-countries',
    'available-countries',
    'date-range-settings',
    'user-preferences',
    'app-settings',
    'header-buttons-order',
    'feature-flags',
  ];
};

export const migrateStorage = (
  storedVersion: string,
  currentVersion: string
): void => {
  const changeType = compareVersions(storedVersion, currentVersion);

  if (!changeType || changeType === 'same' || changeType === 'patch') {
    return;
  }

  if (changeType === 'major') {
    const allKeys = getAllLocalStorageKeys();
    allKeys.forEach((key) => {
      if (key !== 'app-version') {
        localStorage.removeItem(key);
      }
    });
    console.log(`🔄 Major version change detected (${storedVersion} → ${currentVersion}). Cleared all localStorage keys.`);
  } else if (changeType === 'minor') {
    const keysToRemove = getKeysToRemoveOnMinorChange();
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log(`🔄 Minor version change detected (${storedVersion} → ${currentVersion}). Removed keys: ${keysToRemove.join(', ')}`);
  }
};

