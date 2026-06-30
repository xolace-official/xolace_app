import * as Sentry from "@sentry/react-native";
import { tokenCache as clerkTokenCache } from "@clerk/expo/token-cache";

type TokenCache = NonNullable<typeof clerkTokenCache>;

/**
 * Diagnostic wrapper around Clerk's secure-store token cache.
 *
 * The prod-only symptom we are hunting: a signed-in user is dropped to the auth
 * screen on cold start / refresh (works in dev + preview). The first suspect is
 * the token cache — if the session JWT is not read back out of secure storage on
 * a cold start, Clerk boots signed-out and the route guard sends the user to
 * `(auth)`.
 *
 * This wrapper leaves Clerk's behaviour untouched and only emits Sentry
 * breadcrumbs (plus a one-off message on the smoking-gun case: a read that
 * returns nothing). Breadcrumbs ride along on every later event/error, so when
 * the desync is reported we can see the exact cache read/write sequence that led
 * to it. `category: "clerk.tokenCache"` makes them filterable in Sentry.
 *
 * `clerkTokenCache` is `undefined` on web — fall through to it untouched there.
 */
function breadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "clerk.tokenCache",
    level: "info",
    message,
    data,
  });
}

function wrap(cache: TokenCache): TokenCache {
  return {
      async getToken(key: string): Promise<string | null> {
        try {
          const token = await cache.getToken(key);
          breadcrumb("getToken", {
            key,
            hit: !!token,
            length: token?.length ?? 0,
          });
          // A cold start that reads back nothing for the session JWT is the
          // exact failure mode behind the prod logout — surface it loudly.
          if (!token) {
            Sentry.captureMessage(
              `Clerk tokenCache MISS for "${key}"`,
              "warning",
            );
          }
          return token ?? null;
        } catch (error) {
          breadcrumb("getToken THREW", { key, error: stringifyError(error) });
          Sentry.captureException(error, {
            tags: { area: "clerk.tokenCache", op: "getToken" },
          });
          throw error;
        }
      },

      async saveToken(key: string, token: string): Promise<void> {
        try {
          await cache.saveToken(key, token);
          breadcrumb("saveToken", { key, length: token?.length ?? 0 });
        } catch (error) {
          breadcrumb("saveToken THREW", { key, error: stringifyError(error) });
          Sentry.captureException(error, {
            tags: { area: "clerk.tokenCache", op: "saveToken" },
          });
          throw error;
        }
      },

      ...(cache.clearToken
        ? {
            async clearToken(key: string): Promise<void> {
              breadcrumb("clearToken", { key });
              await cache.clearToken!(key);
            },
          }
        : {}),
    };
}

export const instrumentedTokenCache = clerkTokenCache
  ? wrap(clerkTokenCache)
  : clerkTokenCache;

function stringifyError(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}
