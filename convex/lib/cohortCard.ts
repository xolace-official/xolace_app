import type { Doc } from "../_generated/dataModel";

/**
 * The classifier's fixed primaryEmotion taxonomy (see ai/prompts/classifier.ts).
 * The weekly aggregate is keyed by these and nothing else — a new label here
 * means a cron change, not just a query change (ADR 0004).
 */
export const COHORT_EMOTIONS = [
  "anger",
  "sadness",
  "grief",
  "fear",
  "anxiety",
  "joy",
  "love",
  "surprise",
  "disgust",
  "shame",
  "guilt",
  "confusion",
  "numbness",
] as const;

export type CohortEmotion = (typeof COHORT_EMOTIONS)[number];

export function isCohortEmotion(e: string): e is CohortEmotion {
  return (COHORT_EMOTIONS as readonly string[]).includes(e);
}

/**
 * Below this many other campers, no number is shown. Small enough that the
 * card can appear early in the product's life, large enough that "2 campers"
 * — which reads as nobody — never ships.
 */
export const COHORT_FLOOR = 3;

type CohortMatchInputs = Pick<
  Doc<"emotional_metadata">,
  "safeguardLevel" | "primaryEmotion" | "secondaryEmotion"
>;

/**
 * Does this session count toward a weekly cohort for `targetEmotion`? The
 * single owner of the cohort eligibility rule, the same way `isPoolable` owns
 * peer-pool eligibility — so the crisis boundary can't drift between the
 * aggregation cron and the read-time self-exclusion, which both call this.
 *
 * - safeguardLevel !== "crisis"  — deliberately not `riskFlag`, which is also
 *                                  true for `elevated` and would over-exclude
 * - primary OR secondary matches — the fuller shape of what was carried
 *
 * Deliberately says nothing about the viewer: the per-emotion count is one row
 * shared by everyone carrying that emotion, so "not me" can't be a predicate
 * here. It's a subtraction at read time instead — see cohort.ts.
 */
export function isCohortMatch(
  s: CohortMatchInputs,
  targetEmotion: string,
): boolean {
  if (s.safeguardLevel === "crisis") return false;
  return s.primaryEmotion === targetEmotion || s.secondaryEmotion === targetEmotion;
}

export type CohortCardState =
  | { type: "count"; value: number }
  | { type: "warming" };

/**
 * Floor gate, same shape as `getReflectionRank`'s: withhold the number rather
 * than fabricate or shrink it. Below the floor the card still runs, just
 * without a count.
 */
export function deriveCohortCardState(count: number): CohortCardState {
  return count >= COHORT_FLOOR
    ? { type: "count", value: count }
    : { type: "warming" };
}

const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

/** Start (00:00 UTC) of the Monday-anchored calendar week containing `ts`. */
export function weekStartUtc(ts: number): number {
  const d = new Date(ts);
  const mondayOffset = (d.getUTCDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0
  return (
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
    mondayOffset * DAY_MS
  );
}
