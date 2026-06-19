/**
 * Minimal leading-edge debounce — replaces the sample's `lodash.debounce`
 * dependency. Fires immediately, then ignores further calls for `waitMs`.
 */
export function leadingDebounce(fn: () => void, waitMs: number) {
  let last = 0;
  return () => {
    const now = Date.now();
    if (now - last >= waitMs) {
      last = now;
      fn();
    }
  };
}
