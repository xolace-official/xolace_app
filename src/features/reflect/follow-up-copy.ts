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

type Chip = { key: FollowUpResponse; label: string };

// The full response vocabulary. `vent` is the doorway back into processing —
// it resolves the card and opens a fresh reflect session.
const CHIPS: Record<FollowUpResponse, Chip> = {
  lighter: { key: "lighter", label: "Feeling lighter" },
  still_here: { key: "still_here", label: "Still sitting with it" },
  heavier: { key: "heavier", label: "Got heavier" },
  processed: { key: "processed", label: "I worked through it" },
  vent: { key: "vent", label: "Let it out" },
};

/**
 * Tier-aware chip set.
 * - Acute (crisis, ~45 min after): presence-first. Foreground `still_here` /
 *   `lighter`, OMIT `processed` (reads glib so soon after a crisis), keep
 *   `vent`. Resources link is rendered separately.
 * - Elevated / Standard: the full set.
 */
export function chipsForTier(tier: FollowUpTier): Chip[] {
  if (tier === "acute") {
    return [CHIPS.still_here, CHIPS.lighter, CHIPS.vent];
  }
  return [
    CHIPS.lighter,
    CHIPS.still_here,
    CHIPS.heavier,
    CHIPS.processed,
    CHIPS.vent,
  ];
}

/** One-line acknowledgment shown after a chip tap, before the sheet closes. */
export const FOLLOW_UP_ACK = "Thanks for checking back in.";

/** Quiet link back to crisis resources (acute / escalation-derived cards). */
export const FOLLOW_UP_RESOURCES_LABEL = "Resources are still here";

/** Accessibility label for Flux on the check-in sheet. */
export const FOLLOW_UP_MASCOT_LABEL =
  "Flux, the Xolace companion, checking back in with you";
