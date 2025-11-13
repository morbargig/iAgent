export type TypeGuard<T> = (value: unknown) => value is T;

export type UseStorageReturn<T> = [
  T,
  (value: T | ((prev: T) => T)) => void,
  () => void
];

export type UseLocalStorageReturn<T> = [
  T,
  (value: T | ((prev: T) => T)) => void,
  () => void
];

export interface StorageConfig<
  LocalStorageKeys extends string,
  LocalStorageValues extends Record<LocalStorageKeys, unknown>,
  SessionStorageKeys extends string,
  SessionStorageValues extends Record<SessionStorageKeys, unknown>
> {
  localStorage: {
    keys: LocalStorageKeys;
    values: LocalStorageValues;
    defaults: LocalStorageValues;
    guards: {
      [K in LocalStorageKeys]: TypeGuard<LocalStorageValues[K]>;
    };
  };
  sessionStorage: {
    keys: SessionStorageKeys;
    values: SessionStorageValues;
    defaults: SessionStorageValues;
    guards: {
      [K in SessionStorageKeys]: TypeGuard<SessionStorageValues[K]>;
    };
  };
}

