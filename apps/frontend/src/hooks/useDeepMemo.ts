import { useRef, DependencyList } from "react";
import { isEqual } from "lodash";

/**
 * useDeepMemo Hook
 *
 * A memoization hook that uses deep equality comparison instead of shallow comparison.
 * This is useful when you need to memoize complex objects or arrays that might have
 * the same content but different reference equality.
 *
 * @param factory - A function that returns the value to memoize
 * @param deps - An array of dependencies. The hook will recompute the value if any
 *               dependency changes according to deep equality (using lodash's isEqual)
 * @returns The memoized value
 *
 * @example
 * const complexObject = useDeepMemo(() => {
 *   return {
 *     items: items.map(item => ({ ...item, processed: true })),
 *     metadata: { count: items.length }
 *   };
 * }, [items]);
 *
 * @example
 * const expensiveComputation = useDeepMemo(() => {
 *   return computeExpensiveValue(data, config);
 * }, [data, config]);
 */
function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T } | null>(null);

  if (
    ref.current === null ||
    !isEqual(ref.current.deps, deps)
  ) {
    ref.current = {
      deps: deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

export default useDeepMemo;

