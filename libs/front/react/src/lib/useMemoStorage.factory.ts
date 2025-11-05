import { useMemo } from 'react';
import { useDeepMemo } from './useDeepMemo.js';

export const createUseMemoStorage = () => {
  const useMemoStorage = <T>(
    computeFn: () => T,
    deps: unknown[]
  ): T => {
    const memoizedDeps = useDeepMemo(deps);
    
    return useMemo(() => computeFn(), [memoizedDeps, computeFn]);
  };

  return {
    useMemoStorage,
  };
};

