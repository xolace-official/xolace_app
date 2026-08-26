/**
 * The one place that decides whether a proactive Xolace+ offer fires, for which
 * moment, and with which copy variant.
 *
 * Pure by design — plain data in, decision out, no db/ctx — so the rules that
 * matter (a safeguard flow is never monetized; a "no" is honored) are testable
 * without a renderer and cannot drift between the five call sites that will
 * eventually read this. Cadence numbers come from #220 §3.
 */

/** The five ranked proactive moments (#220 §5). */
export type PlusOfferMoment = 1 | 2 | 3 | 4 | 5;

/** Which pitch the card speaks. `register` is a copy swap, never a trigger. */
export type PlusOfferVariant = "default" | "register";

/** A dismissal buys this surface a week of silence. */
export const PLUS_OFFER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/** Three dismissals stop every proactive surface for a month. */
export const PLUS_OFFER_FULL_STOP_MS = 30 * 24 * 60 * 60 * 1000;
export const PLUS_OFFER_DISMISSAL_LIMIT = 3;

export type PlusOfferDecision =
  | {
      show: false;
      reason:
        | "safeguard"
        | "full_stop"
        | "session_cap"
        | "back_to_back"
        | "cooldown"
        | "no_candidate";
    }
  /** `moment` is null for a user-initiated surface — those have no moment id. */
  | { show: true; moment: PlusOfferMoment | null; variant: PlusOfferVariant };

export type PlusOfferInput = {
  /** Moments eligible this instant, most-preferred first. Empty for reactive surfaces. */
  candidates?: PlusOfferMoment[];
  /** An active safeguard/escalation flow. Hard veto, checked first (#220 rule 4). */
  safeguardActive: boolean;
  /** They tapped the locked thing themselves — never rate-limited (#220 rule 5). */
  userInitiated?: boolean;
  /** Per-moment last-dismissed epoch ms. */
  lastDismissedAt?: Partial<Record<PlusOfferMoment, number>>;
  /** Lifetime proactive dismissals across all surfaces. */
  dismissalCount?: number;
  /** When the 30-day full stop started. */
  fullStopSince?: number | null;
  shownThisSession?: boolean;
  shownLastSession?: boolean;
  /** This user complained about how the mirror speaks. Swaps copy only. */
  registerComplaint?: boolean;
  now: number;
};

export function choosePlusOffer({
  candidates = [],
  safeguardActive,
  userInitiated = false,
  lastDismissedAt = {},
  dismissalCount = 0,
  fullStopSince = null,
  shownThisSession = false,
  shownLastSession = false,
  registerComplaint = false,
  now,
}: PlusOfferInput): PlusOfferDecision {
  // First and unconditional. The moment where escalation is genuinely
  // happening is the one moment the app is forbidden to sell in.
  if (safeguardActive) return { show: false, reason: "safeguard" };

  const variant: PlusOfferVariant = registerComplaint ? "register" : "default";

  // They asked. Cadence, cooldown and the full stop all govern offers the app
  // makes unprompted — none of them apply to a door the user opened.
  if (userInitiated) return { show: true, moment: null, variant };

  const stopped =
    dismissalCount >= PLUS_OFFER_DISMISSAL_LIMIT &&
    fullStopSince !== null &&
    now - fullStopSince < PLUS_OFFER_FULL_STOP_MS;
  if (stopped) return { show: false, reason: "full_stop" };

  if (shownThisSession) return { show: false, reason: "session_cap" };
  if (shownLastSession) return { show: false, reason: "back_to_back" };

  const moment = candidates.find((m) => {
    const at = lastDismissedAt[m];
    return at === undefined || now - at >= PLUS_OFFER_COOLDOWN_MS;
  });
  if (moment === undefined) {
    return { show: false, reason: candidates.length ? "cooldown" : "no_candidate" };
  }

  return { show: true, moment, variant };
}
