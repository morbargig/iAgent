import type { TypeGuard, UseStorageReturn } from './types.js';
export declare const createUseSessionStorage: <SessionStorageKeys extends string, SessionStorageValues extends Record<SessionStorageKeys, unknown>>(config: {
    defaults: SessionStorageValues;
    guards: { [K in SessionStorageKeys]: TypeGuard<SessionStorageValues[K]>; };
    enableDebugger?: boolean;
}) => {
    useAppSessionStorage: <K extends SessionStorageKeys>(key: K) => UseStorageReturn<SessionStorageValues[K]>;
    useAppReadSessionStorage: <K extends SessionStorageKeys>(key: K) => SessionStorageValues[K] | null;
};
//# sourceMappingURL=useSessionStorage.factory.d.ts.map