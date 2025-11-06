import type { TypeGuard, UseLocalStorageReturn } from './types.js';
export declare const createUseLocalStorage: <LocalStorageKeys extends string, LocalStorageValues extends Record<LocalStorageKeys, unknown>>(config: {
    defaults: LocalStorageValues;
    guards: { [K in LocalStorageKeys]: TypeGuard<LocalStorageValues[K]>; };
    enableDebugger?: boolean;
}) => {
    useAppLocalStorage: <K extends LocalStorageKeys>(key: K) => UseLocalStorageReturn<LocalStorageValues[K]>;
    useAppReadLocalStorage: <K extends LocalStorageKeys>(key: K) => LocalStorageValues[K];
};
//# sourceMappingURL=useLocalStorage.factory.d.ts.map