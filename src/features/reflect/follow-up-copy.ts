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

import { isStreakMilestone, streakMilestoneCopy } from "@/convex/streaks/milestones";
import { getStreakCopy } from "@/src/features/reflect/streak-copy";

export type FollowUpResponse =
  | "lighter"
  | "still_here"
  | "heavier"
  | "processed"
  | "vent";

export type FollowUpTier = "acute" | "elevated" | "standard";

export type StatusResponse = Exclude<FollowUpResponse, "vent">;
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

/** "Lighter" next step (#449): the reflective prompt and its chrome. */
export const LIGHTER_PROMPT = "Good to hear. What helped?";
export const LIGHTER_PLACEHOLDER = "A walk, a person, a song… or nothing you can name";
export const LIGHTER_SHARE_LABEL = "Share anonymously with others who feel this";
export const LIGHTER_DONE = "Done";
export const LIGHTER_SKIP = "Skip for now";
export const LIGHTER_INPUT_A11Y = "What helped? Optional";

/**
 * The streak nod on a lighter/processed answer — existing streak copy only
 * (push milestone lines first, then the calendar's per-day lines).
 */
export function streakNod(streak: number): string | null {
  if (streak <= 0) return null;
  if (isStreakMilestone(streak)) return streakMilestoneCopy(streak);
  return getStreakCopy(streak) ?? `${streak} days of coming back. It counts.`;
}

/**
 * The headline over each answer's next step. `lighter` is tailored (#449);
 * the rest keep the generic acknowledgment until #450–#452 replace them.
 */
export const STEP_HEADLINE: Record<StatusResponse, string> = {
  lighter: LIGHTER_PROMPT,
  still_here: FOLLOW_UP_ACK,
  heavier: FOLLOW_UP_ACK,
  processed: FOLLOW_UP_ACK,
};

/** Quiet link back to crisis resources (acute / escalation-derived cards). */
export const FOLLOW_UP_RESOURCES_LABEL = "Resources are still here";

/** Accessibility label for Flux on the check-in sheet. */
export const FOLLOW_UP_MASCOT_LABEL =
  "Flux, the Xolace companion, checking back in with you";
