/**
 * Copy + response sets for the follow-up check-in sheet.
 *
 * The check-in surfaces a day or so after a session that left something
 * unresolved. The card's sentence (`cardText`) is written server-side per
 * session; this file owns the static chrome: the response chips, the
 * tier-aware chip selection, and the resolution acknowledgment.
 *
 * Mirrors the shape of return-welcome-copy.ts (sibling sheet).
 */

export type FollowUpResponse =
  | "lighter"
  | "still_here"
  | "heavier"
  | "processed"
  | "vent";

export type FollowUpTier = "acute" | "elevated" | "standard";

type StatusResponse = Exclude<FollowUpResponse, "vent">;
type Chip = { key: StatusResponse; label: string };

// How-is-it-sitting-now self-report. These are a single group answering one
// question — they are NOT the same kind of action as `vent`, which leaves the
// sheet for the voice-vent screen and is rendered as a separate doorway below.
const CHIPS: Record<StatusResponse, Chip> = {
  lighter: { key: "lighter", label: "Feeling lighter" },
  still_here: { key: "still_here", label: "Still sitting with it" },
  heavier: { key: "heavier", label: "Got heavier" },
  processed: { key: "processed", label: "I worked through it" },
};

/**
 * Tier-aware status-chip set (the "how's it sitting now?" answers only — the
 * `vent` doorway is rendered separately, see VENT_*).
 * - Acute (crisis, ~45 min after): presence-first. `still_here` / `lighter`
 *   only; OMIT `processed` (reads glib so soon after a crisis). Resources link
 *   is rendered separately too.
 * - Elevated / Standard: the full self-report set.
 */
export function chipsForTier(tier: FollowUpTier): Chip[] {
  if (tier === "acute") {
    return [CHIPS.still_here, CHIPS.lighter];
  }
  return [CHIPS.lighter, CHIPS.still_here, CHIPS.heavier, CHIPS.processed];
}

/** The vent doorway — a separate kind of action from the status chips. */
export const VENT_LABEL = "Let it out";
export const VENT_SUBLABEL = "Say it out loud - nothing is kept";
export const VENT_A11Y_LABEL = "Let it out - open voice vent, your voice is never stored";

/** One-line acknowledgment shown after a chip tap, before the sheet closes. */
export const FOLLOW_UP_ACK = "Thanks for checking back in.";

/** Quiet link back to crisis resources (acute / escalation-derived cards). */
export const FOLLOW_UP_RESOURCES_LABEL = "Resources are still here";

/** Accessibility label for Flux on the check-in sheet. */
export const FOLLOW_UP_MASCOT_LABEL =
  "Flux, the Xolace companion, checking back in with you";
