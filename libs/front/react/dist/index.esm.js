import { useRef, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useReadLocalStorage, useLocalStorage, useSessionStorage } from 'usehooks-ts';

const useDeepMemo = value => {
  const ref = useRef(value);
  return useMemo(() => {
    const prevValue = ref.current;
    if (isEqual(prevValue, value)) {
      return prevValue;
    }
    ref.current = value;
    return value;
  }, [value]);
};

const createUseLocalStorage = config => {
  const getGuard = key => {
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
  const useAppLocalStorage = key => {
    const defaultValue = config.defaults[key];
    const [value, setValue] = useLocalStorage(key, defaultValue);
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
  const useAppReadLocalStorage = key => {
    const value = useReadLocalStorage(key);
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
    useAppReadLocalStorage
  };
};

const createUseSessionStorage = config => {
  const getGuard = key => {
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
  const useAppSessionStorage = key => {
    const defaultValue = config.defaults[key];
    const [value, setValue, removeValue] = useSessionStorage(key, defaultValue);
    const typeGuard = getGuard(key);
    if (typeGuard && !typeGuard(value)) {
      setValue(defaultValue);
    }
    return [value, setValue, removeValue];
  };
  const useAppReadSessionStorage = key => {
    const [value] = useSessionStorage(key, null);
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
    useAppReadSessionStorage
  };
};

const createUseMemoStorage = () => {
  const useMemoStorage = (computeFn, deps) => {
    const memoizedDeps = useDeepMemo(deps);
    return useMemo(() => computeFn(), [memoizedDeps, computeFn]);
  };
  return {
    useMemoStorage
  };
};

export { createUseLocalStorage, createUseMemoStorage, createUseSessionStorage, useDeepMemo };
