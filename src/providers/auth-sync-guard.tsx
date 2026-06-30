import { useAuth } from "@clerk/expo";
import { useConvexAuth } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react-native";
import { onlinePolyfillStatus } from "@/src/lib/clerk-online-polyfill";
import { APP_START_MS } from "@/src/lib/auth-instrumentation";

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
 * When that state persists past {@link DESYNC_GRACE_MS}, we probe BOTH the cached
 * and forced-refresh (`skipCache: true`) token paths and capture the split:
 *   - If EITHER path can mint a Convex token the session is valid, so we KEEP it
 *     and let Convex's own refetch re-authenticate (signing out here was the prod
 *     bug — it dropped logged-in users to the auth screen).
 *   - Only when NEITHER path can mint do we sign out, so the user can cleanly
 *     re-authenticate instead of being trapped on "you're already signed in".
 *
 * Separately, it records an auth timeline (Clerk-signed-in → Convex-authenticated
 * latency) on every boot so we have a baseline for healthy cold starts and proof
 * that a kept session actually recovered. The exact token fetches Convex itself
 * makes are instrumented in {@link useInstrumentedClerkAuth}.
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

  // Timeline anchors: when Clerk first reported a signed-in session this boot,
  // and the previous Convex auth state (for rising-edge latency reporting).
  const clerkSignedInAtRef = useRef<number | null>(null);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    // Reset the boot anchor on sign-out so the next session measures fresh.
    if (!isSignedIn) clerkSignedInAtRef.current = null;
    // Stamp the moment Clerk first reports signed-in this boot.
    if (isSignedIn && clerkSignedInAtRef.current === null) {
      clerkSignedInAtRef.current = Date.now();
    }

    // Rising edge of Convex auth (false → true): report how long it took. This
    // is the BASELINE — on a healthy prod cold start it tells us whether normal
    // auth latency already exceeds DESYNC_GRACE_MS (i.e. the grace is too tight),
    // and on a desync boot `recovered_after_desync: true` confirms a kept session
    // actually healed (and after how long).
    if (isAuthenticated && !wasAuthenticatedRef.current) {
      const signedInAt = clerkSignedInAtRef.current;
      Sentry.addBreadcrumb({
        category: "auth.timeline",
        level: "info",
        message: "convex authenticated",
        data: {
          clerk_to_convex_ms: signedInAt ? Date.now() - signedInAt : null,
          since_app_start_ms: Date.now() - APP_START_MS,
          recovered_after_desync: recoveredRef.current,
        },
      });
    }
    wasAuthenticatedRef.current = isAuthenticated;

    // Healthy, signed out, or still settling — nothing to recover; reset latch.
    if (isLoading || !isSignedIn || isAuthenticated) {
      recoveredRef.current = false;
      return;
    }
    if (recoveredRef.current) return;

    // Clerk says signed-in but Convex never validated — we are now inside the
    // grace window that precedes a forced sign-out (the prod "logged out on
    // refresh" symptom). Leave a trail before the timer fires.
    Sentry.addBreadcrumb({
      category: "auth.desync",
      level: "warning",
      message: "Clerk signed-in but Convex unauthenticated — grace started",
      data: { had_session: !!sessionId, grace_ms: DESYNC_GRACE_MS },
    });

    const timer = setTimeout(() => {
      recoveredRef.current = true;

      // Probe BOTH token paths so the split is visible in one event:
      //  - cached  (`getToken`)            — the easy path; usually works.
      //  - refresh (`skipCache: true`)     — the path ConvexProviderWithClerk
      //    actually uses, and the one Clerk's offline gate throws on.
      // A cached-hit / refresh-miss result is the smoking gun that the
      // `navigator.onLine` polyfill failed and cold-start auth dies on refresh.
      const probe = getTokenRef.current;
      Promise.allSettled([
        probe({ template: "convex" }),
        probe({ template: "convex", skipCache: true }),
      ])
        .then(([cached, refresh]) => {
          const cachedToken = cached.status === "fulfilled" ? cached.value : null;
          const refreshToken =
            refresh.status === "fulfilled" ? refresh.value : null;
          const refreshError =
            refresh.status === "rejected"
              ? refresh.reason instanceof Error
                ? `${refresh.reason.name}: ${refresh.reason.message}`
                : String(refresh.reason)
              : null;
          const navigatorOnline =
            typeof navigator !== "undefined"
              ? String(navigator.onLine)
              : "no-navigator";

          const diag = {
            had_session: !!sessionId,
            cached_minted: !!cachedToken,
            refresh_minted: !!refreshToken,
            refresh_error: refreshError,
            navigator_online: navigatorOnline,
            online_polyfill: onlinePolyfillStatus,
          };
          posthog.capture("auth_desync_recovery", diag);
          Sentry.addBreadcrumb({
            category: "auth.desync",
            level: "warning",
            message: "desync recovery probe",
            data: diag,
          });

          // The session is valid if EITHER path can mint a Convex token. Keep it
          // and let Convex's own token refetch re-authenticate — do NOT sign out
          // a logged-in user (the prod bug). Leave the latch set so we don't
          // re-probe in a loop; the effect resets it once Convex authenticates.
          if (cachedToken || refreshToken) {
            Sentry.captureMessage(
              `Auth desync — token mintable (cached:${!!cachedToken} refresh:${!!refreshToken}); session kept`,
              "warning",
            );
            return;
          }

          // Neither path could mint — the session really is unusable. Sign out
          // so the user can cleanly re-authenticate instead of being trapped on
          // "you're already signed in".
          Sentry.captureMessage(
            `Auth desync — token unmintable (refresh_error:${refreshError ?? "null"}); signing out`,
            "error",
          );
          if (refreshError) {
            Sentry.captureException(
              new Error(`refresh getToken failed: ${refreshError}`),
              { tags: { area: "auth.desync", op: "getToken:refresh" } },
            );
          }
          signOutRef.current().catch(() => {});
        })
        .catch((error: unknown) => {
          // allSettled shouldn't reject, but never leave a desync unrecovered.
          const msg =
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : String(error);
          Sentry.captureException(
            error instanceof Error ? error : new Error(msg),
            { tags: { area: "auth.desync", op: "probe" } },
          );
          signOutRef.current().catch(() => {});
        });
    }, DESYNC_GRACE_MS);

    return () => clearTimeout(timer);
  }, [isLoading, isSignedIn, isAuthenticated, sessionId, posthog]);

  return null;
}
