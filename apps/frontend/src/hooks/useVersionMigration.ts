import { useEffect } from 'react';
import { useAppLocalStorage } from './storage/useAppLocalStorage';
import { migrateStorage } from '../utils/versionMigration';
import { environment } from '../environments/environment';

export const useVersionMigration = () => {
  const [storedVersion, setStoredVersion] = useAppLocalStorage('app-version');
  const currentVersion = environment.app.version;

  useEffect(() => {
    if (!storedVersion || storedVersion === '') {
      setStoredVersion(currentVersion);
      return;
    }

    if (storedVersion !== currentVersion) {
      migrateStorage(storedVersion, currentVersion);
      setStoredVersion(currentVersion);
    }
  }, [storedVersion, currentVersion, setStoredVersion]);
};

