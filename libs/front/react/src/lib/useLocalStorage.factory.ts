import { useMemo } from 'react';
import { useLocalStorage, useReadLocalStorage } from 'usehooks-ts';
import { useDeepMemo } from './useDeepMemo.js';
import type { TypeGuard, UseLocalStorageReturn } from './types.js';

export const createUseLocalStorage = <
  LocalStorageKeys extends string,
  LocalStorageValues extends Record<LocalStorageKeys, unknown>
>(config: {
  defaults: LocalStorageValues;
  guards: {
    [K in LocalStorageKeys]: TypeGuard<LocalStorageValues[K]>;
  };
  enableDebugger?: boolean;
}) => {
  const getGuard = <K extends LocalStorageKeys>(key: K) => {
    const guard = config.guards[key];
    if (!guard) {
      console.error(`No type guard found for localStorage key "${key}". Please add it to storage.guards.ts`);
      if (config.enableDebugger) {
        // eslint-disable-next-line no-debugger
        debugger;
      }
    }
    return guard;
  };

  const useAppLocalStorage: <K extends LocalStorageKeys>(
    key: K
  ) => UseLocalStorageReturn<LocalStorageValues[K]> = <K extends LocalStorageKeys>(
    key: K
  ) => {
    const defaultValue = config.defaults[key];
    const [value, setValue] = useLocalStorage<LocalStorageValues[K]>(key, defaultValue);
    const deepMemoValue = useDeepMemo(value);
    const typeGuard = getGuard(key);

    const guardedValue = useMemo(() => {
      if (!typeGuard || typeGuard(deepMemoValue)) {
        return deepMemoValue;
      }
      return defaultValue;
    }, [defaultValue, typeGuard, deepMemoValue]);

    return [guardedValue, setValue];
  };

  const useAppReadLocalStorage: <K extends LocalStorageKeys>(
    key: K
  ) => LocalStorageValues[K] = <K extends LocalStorageKeys>(
    key: K
  ) => {
    const value = useReadLocalStorage<LocalStorageValues[K]>(key);
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
    useAppLocalStorage,
    useAppReadLocalStorage,
  };
};

