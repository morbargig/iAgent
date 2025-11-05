import { useRef, useMemo } from "react";
import { isEqual } from "lodash";

export const useDeepMemo = <T>(value: T): T => {
  const ref = useRef<T>(value);

  return useMemo(() => {
    const prevValue = ref.current;
    if (isEqual(prevValue, value)) {
      return prevValue;
    }
    ref.current = value;
    return value;
  }, [value]);
};

