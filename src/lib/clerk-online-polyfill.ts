/**
 * Force `navigator.onLine` to report online in React Native.
 *
 * Clerk's bundled JS gates JWT minting behind `isNavigatorOnline()`:
 *
 *   if (typeof navigator.onLine !== "boolean") return true; // undefined ⇒ online
 *   return !!navigator.onLine;                              // boolean false ⇒ OFFLINE
 *
 * In the production/Hermes runtime `navigator.onLine` can be defined as the
 * boolean `false` (not `undefined`), so Clerk concludes the device is offline
 * and `getToken({ template: "convex" })` throws `clerk_offline` on the *refresh*
 * path. The cached-token path skips this check, so the first token after a cold
 * start works and only the forced refresh fails — surfacing as a Clerk⇄Convex
 * auth desync that drops the user to the login screen.
 *
 * A previous guard only patched the `=== undefined` case, which misses the
 * boolean-`false` runtime. Override unconditionally so the check always passes.
 * React Native has no real online/offline signal here — Clerk added this purely
 * for web — so reporting "online" is always correct for this app.
 *
 * Imported for its side effect; must run before `@clerk/expo` is first used.
 */
/**
 * Outcome of the patch attempt, read back in instrumentation so we can prove —
 * from a prod device — whether the override actually took effect in the Hermes
 * release runtime. A value like `before=false after=false` means the patch
 * silently failed (non-configurable property) and Clerk's refresh path still
 * sees the device as offline — the exact cold-start desync we are hunting.
 */
export let onlinePolyfillStatus = "not-run";

try {
  const before =
    typeof navigator !== "undefined" ? String(navigator.onLine) : "no-navigator";
  if (typeof navigator !== "undefined" && navigator.onLine !== true) {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  }
  const after =
    typeof navigator !== "undefined" ? String(navigator.onLine) : "no-navigator";
  onlinePolyfillStatus = `before=${before} after=${after}`;
} catch (error) {
  // `navigator.onLine` is non-configurable in this runtime — nothing to do.
  onlinePolyfillStatus = `threw:${
    error instanceof Error ? error.message : String(error)
  }`;
}
