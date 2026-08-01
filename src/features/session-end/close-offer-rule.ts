/**
 * Which offer the close phase of session end makes. Exactly one, ever.
 *
 * Pure so the invariant is testable without a renderer: a suggestion and the
 * Bridge card must never be on screen together, and "bridge wins ties" must
 * not creep back in — the Bridge gate passes on nearly every session, so
 * preferring it would mean the suggestion never appears for anyone.
 */
export type CloseOffer = "pending" | "suggestion" | "bridge" | "none";

export function chooseCloseOffer({
  hasSession,
  suggestion,
  waitedOut,
  bridgeEnabled,
  hasMirrorText,
}: {
  hasSession: boolean;
  /** `undefined` while the query is in flight, `null` when there is none. */
  suggestion: object | null | undefined;
  /**
   * The slot has been held as long as it is worth holding. Bounds the wait so
   * a query that never resolves — offline, or auth not yet hydrated — falls
   * back to the Bridge card instead of showing nothing at all.
   */
  waitedOut?: boolean;
  bridgeEnabled: boolean;
  hasMirrorText: boolean;
}): CloseOffer {
  // Hold the slot empty rather than showing the Bridge card and swapping it
  // for a suggestion mid-fade — that is the same two-humans-in-one-breath
  // problem, only sequenced.
  if (hasSession && suggestion === undefined && !waitedOut) return "pending";
  if (suggestion) return "suggestion";
  if (bridgeEnabled && hasMirrorText) return "bridge";
  return "none";
}
