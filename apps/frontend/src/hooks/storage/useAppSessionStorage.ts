import { createUseSessionStorage } from '@iagent/front-react';
import type {
  SessionStorageKeys,
  SessionStorageValues,
} from '../../types/storage.types';
import { sessionStorageDefaults } from '../../types/storage.types';
import { sessionStorageGuards } from '../../types/storage.guards';

export const { useAppSessionStorage, useAppReadSessionStorage } = createUseSessionStorage<SessionStorageKeys, SessionStorageValues>({
  defaults: sessionStorageDefaults,
  guards: sessionStorageGuards,
  enableDebugger: !import.meta.env.PROD,
});

