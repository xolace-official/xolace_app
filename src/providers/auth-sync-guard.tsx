import { useAuth } from "@clerk/expo";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react-native";

/**
 * How long to tolerate a Clerk⇄Convex auth desync before recovering. Convex
 * normally validates a token within a second or two of Clerk reporting a session,
 * so anything past this window is a genuine failure, not settling.
 */
const DESYNC_GRACE_MS = 4000;

/**
 * Safety net for a Clerk⇄Convex auth desync.
 *
 * The cold-start desync that dropped users to auth is fixed upstream in
 * {@link useResilientClerkAuth} (it retries getToken so Convex's init fetch
 * succeeds). This guard only matters for the rare case that still gets through:
 * Clerk reports a session (`isSignedIn`) but Convex never validates a token past
 * {@link DESYNC_GRACE_MS}. We then check whether a token is actually mintable:
 *   - mintable → keep the session and let Convex re-authenticate (signing out a
 *     valid session was the original prod bug).
 *   - not mintable → sign out so the user can cleanly re-authenticate instead of
 *     being trapped on "you're already signed in".
 *
 * Renders nothing — mount once inside the Clerk + Convex provider tree.
 */
export function AuthSyncGuard() {
  const { isSignedIn, getToken, signOut } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Hold the Clerk callbacks in refs so the recovery timer is driven only by the
  // (stable) auth-state booleans, not callback identity churn that would reset
  // the grace window every render.
  const getTokenRef = useRef(getToken);
  const signOutRef = useRef(signOut);
  useEffect(() => {
    getTokenRef.current = getToken;
    signOutRef.current = signOut;
  }, [getToken, signOut]);

  // Attempt recovery at most once per desync episode.
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
      Promise.resolve(getTokenRef.current())
        .then((token) => {
          // A mintable token means the session is valid — keep it and let Convex
          // re-authenticate. Only sign out when nothing can mint.
          if (token) return;
          Sentry.captureMessage(
            "Auth desync — token unmintable past grace; signing out",
            "error",
          );
          signOutRef.current().catch(() => {});
        })
        .catch(() => {
          Sentry.captureMessage(
            "Auth desync — getToken threw past grace; signing out",
            "error",
          );
          signOutRef.current().catch(() => {});
        });
    }, DESYNC_GRACE_MS);

    return () => clearTimeout(timer);
  }, [isLoading, isSignedIn, isAuthenticated]);

  return null;
}
