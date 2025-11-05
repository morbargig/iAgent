import { createUseLocalStorage } from '@iagent/front-react';
import type {
  LocalStorageKeys,
  LocalStorageValues,
} from '../../types/storage.types';
import { localStorageDefaults } from '../../types/storage.types';
import { localStorageGuards } from '../../types/storage.guards';

export const { useAppLocalStorage, useAppReadLocalStorage } = createUseLocalStorage<LocalStorageKeys, LocalStorageValues>({
  defaults: localStorageDefaults,
  guards: localStorageGuards,
  enableDebugger: !import.meta.env.PROD,
});