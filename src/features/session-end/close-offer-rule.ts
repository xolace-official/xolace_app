/**
 * Which offer the close phase of session end makes. Exactly one, ever.
 *
 * Pure so the invariant is testable without a renderer: a suggestion and the
 * Bridge card must never be on screen together, and "bridge wins ties" must
 * not creep back in — the Bridge gate passes on nearly every session, so
 * preferring it would mean the suggestion never appears for anyone.
 */
export type CloseOffer = "pending" | "suggestion" | "plus" | "bridge" | "none";

export function chooseCloseOffer({
  hasSession,
  suggestion,
  waitedOut,
  plusOffer = false,
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
  /**
   * A proactive Plus moment (1, 4 or 5) has cleared the policy module for this
   * close. Competes in this slot rather than adding a card — the invariant is
   * one offer, and a sell stacked on top of an offer is two.
   */
  plusOffer?: boolean;
  bridgeEnabled: boolean;
  hasMirrorText: boolean;
}): CloseOffer {
  // Hold the slot empty rather than showing the Bridge card and swapping it
  // for a suggestion mid-fade — that is the same two-humans-in-one-breath
  // problem, only sequenced.
  if (hasSession && suggestion === undefined && !waitedOut) return "pending";
  if (suggestion) return "suggestion";
  // Plus outranks Bridge and loses to a suggestion (#220 §6): a stranger who
  // might help beats a purchase, and a purchase beats a card the user sees at
  // the close of nearly every session anyway.
  if (plusOffer) return "plus";
  if (bridgeEnabled && hasMirrorText) return "bridge";
  return "none";
}
