import type { Specialty } from "./specialties";

/**
 * The single owner of every "should this session offer a peer listener, and
 * for what" decision. Pure — plain data in, a decision out, no db and no ctx —
 * so a future gate is added in exactly one place. Same posture as
 * `isPoolable`: the safety-critical predicate lives alone and is tested alone.
 *
 * No model call is involved at any point. Both source taxonomies (the
 * classifier's `thematicTags` and `primaryEmotion`) are closed sets, so the
 * whole mapping is static.
 */

/**
 * Arbitrary, and stated as such. The point is that a floor exists in one
 * tunable place — below it a suggestion would stop meaning anything.
 */
export const MIN_SUGGESTION_INTENSITY = 6;

/** One suggestion a week, at most. Derived from stored rows, never a field. */
export const SUGGESTION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Hard suppression. Overrides any other match — routing one of these to a
 * volunteer because the session *also* tagged `family` is the single worst
 * failure this feature can produce, and it is exactly what the non-clinical
 * specialty taxonomy exists to prevent.
 */
const SUPPRESSED_THEMES = new Set(["trauma", "abuse", "neglect"]);

/**
 * Theme wins over emotion: a specialty describes a situation someone has sat
 * with, not a feeling. "Family" tells a xolacer what conversation they are
 * walking into; "Anxiety" tells them almost nothing, because most sessions
 * have anxiety in them.
 *
 * `health`, `finances`, `achievement` and `creativity` are absent on purpose —
 * nothing on the roster listens to those, so they produce no suggestion.
 *
 * `sleep` is intentionally unreachable: nothing in the classifier's taxonomies
 * maps to it. The fix is adding `sleep` to the classifier's thematicTags
 * taxonomy later, not free-text matching that fires on "I'm tired of this."
 */
const THEME_SPECIALTY: Record<string, Specialty> = {
  work: "burnout",
  relationships: "relationships",
  conflict: "relationships",
  family: "family",
  identity: "identity",
  "self-worth": "identity",
  purpose: "identity",
  change: "change",
  loss: "grief",
  isolation: "loneliness",
};

/** Fallback, only consulted when no theme mapped. */
const EMOTION_SPECIALTY: Record<string, Specialty> = {
  anxiety: "anxiety",
  grief: "grief",
  loneliness: "loneliness",
};

export type SuggestionInput = {
  thematicTags: string[];
  primaryEmotion: string;
  granularLabel?: string;
  intensity: number;
  safeguardLevel?: "none" | "gentle" | "elevated" | "crisis";
};

/**
 * The specialty this session should offer a listener for, or null.
 *
 * `elevated` is excluded alongside `crisis` deliberately: it is the level
 * where the system already suspects something is wrong but isn't sure, which
 * is the worst possible moment to hand a person to a volunteer.
 *
 * No specificity gate is needed — the classifier already returns an empty
 * `thematicTags` for texture words and body areas, so those map to nothing.
 */
export function suggestedSpecialty(input: SuggestionInput): Specialty | null {
  const { thematicTags, intensity, safeguardLevel } = input;

  if (thematicTags.some((tag) => SUPPRESSED_THEMES.has(tag.toLowerCase()))) {
    return null;
  }
  if (safeguardLevel === "elevated" || safeguardLevel === "crisis") return null;
  if (intensity < MIN_SUGGESTION_INTENSITY) return null;

  // Empty tags are how the classifier reports a texture word or a body area.
  // Nobody gets routed to a stranger on the strength of one tapped word, and
  // this is the whole reason no specificity gate is needed — so the emotion
  // fallback below is a fallback within a session that did say something,
  // never a way in for a session that said nothing.
  if (thematicTags.length === 0) return null;

  for (const tag of thematicTags) {
    const themeMatch = THEME_SPECIALTY[tag.toLowerCase()];
    if (themeMatch) return themeMatch;
  }

  return (
    EMOTION_SPECIALTY[input.primaryEmotion.toLowerCase()] ??
    EMOTION_SPECIALTY[input.granularLabel?.toLowerCase() ?? ""] ??
    null
  );
}

/**
 * Same number as `MIN_RATINGS_TO_DISPLAY` in xolacerChat, for the same reason —
 * below five samples an average is noise — but a separate constant because the
 * question is different: that one asks "may we show this number", this one asks
 * "may we vouch for this person". They are free to diverge.
 */
export const MIN_RATINGS_TO_JUDGE = 5;

/** Below this, with enough ratings to mean it, the app won't put its name on them. */
export const MIN_AVERAGE_RATING = 3.0;

/**
 * The exclusion that exists here and deliberately not on the roster: in a
 * suggestion *the app is vouching*, so it owes a floor. On the roster the user
 * chose for themselves.
 *
 * Unrated xolacers pass — being new is not a fault, and there is no tenure gate.
 */
export function meetsRatingFloor(xolacer: {
  ratingSum?: number;
  ratingCount?: number;
}): boolean {
  const count = xolacer.ratingCount ?? 0;
  if (count < MIN_RATINGS_TO_JUDGE) return true;
  return (xolacer.ratingSum ?? 0) / count >= MIN_AVERAGE_RATING;
}

/** FNV-1a. Deterministic and cheap; not a security primitive. */
function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Fewest open conversations first. Explicitly *not* by rating: with the display
 * threshold at five most of the roster has no visible rating, so rating rank is
 * ranking by nothing — and it deadlocks. The top-rated xolacer would absorb
 * every suggestion until they hit the cap, and a new xolacer could never
 * accumulate the ratings needed to be ranked at all.
 *
 * Ties are the normal case (at current roster size everyone has zero open
 * conversations), so the tie-break carries the real weight. Sorting by profile
 * id would hand every first suggestion to whoever sorts lowest; hashing against
 * the session id spreads across sessions while staying stable when the same
 * session is re-read, so the suggested name doesn't flicker.
 */
export function rankSuggestionCandidates<
  T extends { xolacerProfileId: string; openCount: number },
>(candidates: T[], sessionId: string): T[] {
  return [...candidates].sort(
    (a, b) =>
      a.openCount - b.openCount ||
      hash32(sessionId + a.xolacerProfileId) -
        hash32(sessionId + b.xolacerProfileId),
  );
}

/**
 * Has this user been offered a listener inside the cooldown window? Takes
 * already-loaded Understanding rows — the field that records *what* was
 * suggested is the same field that records *that* a suggestion happened, so
 * no timestamp is stored anywhere.
 */
export function isInSuggestionCooldown(
  recent: { createdAt: number; suggestedSpecialty?: string }[],
  now: number,
): boolean {
  return recent.some(
    (row) =>
      row.suggestedSpecialty !== undefined &&
      now - row.createdAt < SUGGESTION_COOLDOWN_MS,
  );
}
