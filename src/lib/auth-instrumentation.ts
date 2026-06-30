/**
 * Wall-clock at JS bundle evaluation — the closest proxy we have to "app start"
 * on a cold boot. Auth instrumentation subtracts this to report how far into the
 * boot each token fetch / auth transition happened, which is what distinguishes a
 * slow-but-healthy cold start from a genuinely broken one.
 *
 * Imported by the instrumented Clerk auth hook and the AuthSyncGuard timeline.
 */
export const APP_START_MS = Date.now();
