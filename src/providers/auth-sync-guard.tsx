import { useAuth } from "@clerk/expo";
import { useConvexAuth } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";

/**
 * How long to tolerate a Clerk⇄Convex auth desync before recovering. Convex
 * normally validates a token within a second or two of Clerk reporting a
 * session, so anything past this window is a genuine failure, not settling.
 */
const DESYNC_GRACE_MS = 4000;

/**
 * Recovers from a Clerk⇄Convex authentication desync.
 *
 * Symptom: Clerk reports an active session (`isSignedIn === true`) but Convex
 * never validates a token (`isAuthenticated` stays false). The route guard in
 * `_layout.tsx` keys off Convex's `isAuthenticated`, so the user is dropped on
 * the login screen — yet they cannot re-authenticate because Clerk refuses a
 * second sign-in with "You're already signed in".
 *
 * When that state persists past {@link DESYNC_GRACE_MS}, we:
 *   1. Probe `getToken({ template: "convex" })` to capture the *real* reason
 *      the mint is failing (null token vs thrown error) into PostHog.
 *   2. Sign the dead session out, clearing the cached token so the user can
 *      cleanly re-authenticate instead of being trapped.
 *
 * Renders nothing — mount it once inside the Clerk + Convex provider tree.
 */
export function AuthSyncGuard() {
  const { isSignedIn, getToken, signOut, sessionId } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const posthog = usePostHog();

  // Hold the Clerk callbacks in refs so the recovery timer is driven only by
  // the (stable) auth-state booleans, not by callback identity churn that
  // would otherwise reset the grace window on every render.
  const getTokenRef = useRef(getToken);
  const signOutRef = useRef(signOut);
  useEffect(() => {
    getTokenRef.current = getToken;
    signOutRef.current = signOut;
  }, [getToken, signOut]);

  // Latch so we attempt recovery at most once per desync episode.
  const recoveredRef = useRef(false);

  useEffect(() => {
    // Healthy, signed out, or still settling — nothing to recover; reset latch.
    if (isLoading || !isSignedIn || isAuthenticated) {
      recoveredRef.current = false;
      return;
    }
    if (recoveredRef.current) return;

    const timer = setTimeout(() => {
      recoveredRef.current = true;

      getTokenRef
        .current({ template: "convex" })
        .then((token) => {
          posthog.capture("auth_desync_recovery", {
            had_session: !!sessionId,
            convex_token_minted: !!token,
          });
        })
        .catch((error: unknown) => {
          const msg =
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : String(error);
          posthog.capture("$exception", {
            $exception_list: [{ type: "AuthDesyncTokenError", value: msg }],
          });
        })
        .finally(() => {
          // Clear the dead session + cached token so re-auth can succeed.
          signOutRef.current().catch(() => {});
        });
    }, DESYNC_GRACE_MS);

    return () => clearTimeout(timer);
  }, [isLoading, isSignedIn, isAuthenticated, sessionId, posthog]);

  return null;
}
