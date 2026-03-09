import { useCallback, useRef, useState } from 'react';

/**
 * Debounces a value — returns the latest value only after `delay` ms of inactivity.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousValue = useRef(value);

  if (previousValue.current !== value) {
    previousValue.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
  }

  return debouncedValue;
}
