import { useMemo } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { useDeepMemo } from './useDeepMemo.js';
import type { TypeGuard, UseStorageReturn } from './types.js';

export const createUseSessionStorage = <
  SessionStorageKeys extends string,
  SessionStorageValues extends Record<SessionStorageKeys, unknown>
>(config: {
  defaults: SessionStorageValues;
  guards: {
    [K in SessionStorageKeys]: TypeGuard<SessionStorageValues[K]>;
  };
  enableDebugger?: boolean;
}) => {
  const getGuard = <K extends SessionStorageKeys>(key: K) => {
    const guard = config.guards[key];
    if (!guard) {
      console.error(`No type guard found for sessionStorage key "${key}". Please add it to storage.guards.ts`);
      if (config.enableDebugger) {
        // eslint-disable-next-line no-debugger
        debugger;
      }
    }
    return guard;
  };

  const useAppSessionStorage: <K extends SessionStorageKeys>(
    key: K
  ) => UseStorageReturn<SessionStorageValues[K]> = <K extends SessionStorageKeys>(
    key: K
  ) => {
    const defaultValue = config.defaults[key];
    const [value, setValue, removeValue] = useSessionStorage<SessionStorageValues[K]>(
      key,
      defaultValue
    );
    const typeGuard = getGuard(key);

    if (typeGuard && !typeGuard(value)) {
      setValue(defaultValue);
    }

    return [value, setValue, removeValue];
  };

  const useAppReadSessionStorage: <K extends SessionStorageKeys>(
    key: K
  ) => SessionStorageValues[K] | null = <K extends SessionStorageKeys>(
    key: K
  ) => {
    const [value] = useSessionStorage<SessionStorageValues[K] | null>(key, null);
    const deepMemoValue = useDeepMemo(value);
    const typeGuard = getGuard(key);

    const guardedValue = useMemo(() => {
      if (!typeGuard || value === null || !typeGuard(deepMemoValue)) {
        return null;
      }

      return deepMemoValue;
    }, [typeGuard, value, deepMemoValue]);

    return guardedValue;
  };

  return {
    useAppSessionStorage,
    useAppReadSessionStorage,
  };
};

