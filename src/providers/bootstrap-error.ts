/** Codes requireAuth throws while the Convex user row and Clerk disagree. */
const TRANSIENT_CODES = ["user_not_found", "account_inactive"];

/**
 * True when the error is requireAuth rejecting because the Convex user row is
 * missing or not active — a state that resolves on its own once `getOrCreate`
 * lands or the session is torn down. Prefers the typed ConvexError code; falls
 * back to message matching for a backend deployed before the codes existed.
 *
 * Deliberately excludes `not_authenticated`: that is a broken session, not a
 * settling row, and retrying it would hide the failure behind a loader.
 *
 * See src/providers/account-bootstrap-boundary.tsx for how it is used.
 */
export function isBootstrapError(error: unknown): boolean {
  const code = (error as { data?: { code?: string } } | null)?.data?.code;
  if (code && TRANSIENT_CODES.includes(code)) return true;
  // DEPRECATED(remove-after: backend always sends the requireAuth codes):
  // message-substring fallback for the pre-ConvexError server throws.
  return (
    error instanceof Error &&
    (error.message.includes("User not found. Call getOrCreate first.") ||
      error.message.includes("Account is not active"))
  );
}
