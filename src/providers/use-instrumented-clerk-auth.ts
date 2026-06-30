import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useRef } from "react";
import * as Sentry from "@sentry/react-native";
import { APP_START_MS } from "@/src/lib/auth-instrumentation";

type ClerkGetToken = ReturnType<typeof useAuth>["getToken"];

/**
 * How long to keep retrying a token fetch while Clerk still claims a session,
 * and how long to wait between attempts. On a prod cold start Clerk reports
 * `isSignedIn: true` up to a few seconds before its client (`/v1/client`) has
 * finished loading, during which `getToken` throws "You are signed out" / returns
 * null. Observed recovery was well under 4s; 6s of retries is a safe ceiling that
 * still bails quickly for a user who is genuinely signed out.
 */
const RETRY_WINDOW_MS = 6000;
const RETRY_DELAY_MS = 300;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Drop-in replacement for Clerk's `useAuth`, passed to `ConvexProviderWithClerk`
 * so we (1) instrument the exact token fetches Convex makes and (2) make them
 * resilient to the cold-start race that was logging users out in production.
 *
 * THE BUG (confirmed from Sentry + convex/react-clerk source):
 *   On cold start Clerk reports `isLoaded:true, isSignedIn:true` before its client
 *   has rehydrated, so Convex's `setConfig` cached fetch returns null, it falls to
 *   `refetchToken({forceRefreshToken:true})`, and that `getToken({skipCache:true})`
 *   throws "You are signed out". Convex's auth manager gives up after that single
 *   failed fetch (`setAndReportAuthFailed`) and does NOT retry on its own — the
 *   route guard then drops the (still-signed-in) user to the auth screen.
 *
 * THE FIX:
 *   Retry `getToken` here while Clerk still claims a session, until a token is
 *   mintable or {@link RETRY_WINDOW_MS} elapses. Convex's initial fetch then
 *   resolves to a real token and it never reports unauthenticated. While we retry,
 *   Convex's auth state stays `null` (loading) so the app shows the loader instead
 *   of flashing the auth screen.
 *
 * `getToken` MUST keep a stable identity: `ConvexProviderWithClerk` keys its
 * `fetchAccessToken` callback (and the effect that calls `setAuth`) on it, so a new
 * identity each render would churn re-auth. We hold the live Clerk callbacks in
 * refs and expose one `useCallback([])`-stable wrapper — the documented React
 * Compiler exception (identity-sensitive callback in an effect dep chain).
 */
export function useInstrumentedClerkAuth() {
  const auth = useAuth();
  const getTokenRef = useRef(auth.getToken);
  const isSignedInRef = useRef(auth.isSignedIn);
  useEffect(() => {
    getTokenRef.current = auth.getToken;
    isSignedInRef.current = auth.isSignedIn;
  }, [auth.getToken, auth.isSignedIn]);

  const instrumentedGetToken = useCallback<ClerkGetToken>(async (options) => {
    const start = Date.now();
    const meta = {
      template: options?.template ?? null,
      skipCache: options?.skipCache ?? false,
      since_app_start_ms: start - APP_START_MS,
    };

    let attempt = 0;
    let lastError: unknown = null;
    // Retry only while Clerk still claims a session — a failure then is the boot
    // race, not a real sign-out. The first iteration always runs.
    while (true) {
      attempt++;
      try {
        const token = await getTokenRef.current(options);
        if (token) {
          Sentry.addBreadcrumb({
            category: "convex.getToken",
            level: "info",
            message:
              attempt > 1 ? "convex getToken recovered" : "convex getToken",
            data: { ...meta, hit: true, attempt, ms: Date.now() - start },
          });
          // A token that only arrived after retrying is direct proof the
          // cold-start race fired and the resilient fetch absorbed it.
          if (attempt > 1) {
            Sentry.captureMessage(
              `Convex getToken recovered after ${attempt} attempts (${Date.now() - start}ms, skipCache:${meta.skipCache})`,
              "info",
            );
          }
          return token;
        }
        lastError = null;
      } catch (error) {
        lastError = error;
      }

      // Stop if Clerk no longer claims a session (genuine sign-out) or we've
      // spent the whole retry window.
      if (isSignedInRef.current !== true) break;
      if (Date.now() - start + RETRY_DELAY_MS >= RETRY_WINDOW_MS) break;
      await sleep(RETRY_DELAY_MS);
    }

    // Exhausted: either Clerk reports signed-out, or the token never minted in
    // the window (a genuine failure, not the transient boot race).
    const errMsg =
      lastError instanceof Error
        ? `${lastError.name}: ${lastError.message}`
        : lastError != null
          ? String(lastError)
          : "null-token";
    Sentry.addBreadcrumb({
      category: "convex.getToken",
      level: "error",
      message: "convex getToken FAILED",
      data: {
        ...meta,
        attempts: attempt,
        ms: Date.now() - start,
        still_signed_in: isSignedInRef.current === true,
        error: errMsg,
      },
    });
    Sentry.captureMessage(
      `Convex getToken FAILED after ${attempt} attempts in ${Date.now() - start}ms (skipCache:${meta.skipCache} still_signed_in:${isSignedInRef.current === true} err:${errMsg})`,
      "error",
    );
    // Match Clerk's native contract: null means unauthenticated. Convex's
    // fetchAccessToken nullifies a throw anyway, so returning null is equivalent
    // and avoids an unhandled rejection.
    return null;
  }, []);

  return { ...auth, getToken: instrumentedGetToken };
}
