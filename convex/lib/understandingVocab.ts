/**
 * The classifier's closed vocabularies — the Understanding's own words.
 * The classifier prompt and response parser interpolate these, and the
 * Library's `emotion` / `lifeArea` facet axes are exactly these lists
 * (ADR 0015), so a read-twig match is a plain join. Grow a list here and every
 * side grows together; removing a value orphans existing facets (ADR 0018).
 */

/** The original broad emotions. They have no parent. */
const ROOT_EMOTIONS = [
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

/**
 * Finer emotions, each under the broad one it belongs to. Consumers that have
 * not been taught a value explicitly treat it as its parent, so a forgotten
 * edit is never a silent miss (ADR 0018).
 */
const CHILD_EMOTION_PARENT = {
  stress: "anxiety",
  overwhelm: "anxiety",
  exhaustion: "numbness",
  demotivation: "numbness",
  "self-doubt": "shame",
  embarrassment: "shame",
  regret: "guilt",
  uncertainty: "confusion",
  loneliness: "sadness",
  homesickness: "sadness",
  "not-belonging": "sadness",
  disappointment: "sadness",
  hopelessness: "sadness",
  frustration: "anger",
  hope: "joy",
  relief: "joy",
  gratitude: "joy",
  calm: "joy",
  pride: "joy",
} as const;

export const PRIMARY_EMOTIONS = [
  ...ROOT_EMOTIONS,
  ...(Object.keys(CHILD_EMOTION_PARENT) as (keyof typeof CHILD_EMOTION_PARENT)[]),
] as const;

export type PrimaryEmotion = (typeof PRIMARY_EMOTIONS)[number];

/**
 * The emotion plus its parent, most specific first. Safety and matching
 * consumers test membership against this, so a child is never invisible.
 * Also used for unknown words (granular labels), which are returned as-is.
 */
export function emotionFamily(emotion: string): string[] {
  const parent = (CHILD_EMOTION_PARENT as Record<string, string>)[emotion];
  return parent ? [emotion, parent] : [emotion];
}

export const THEMATIC_TAGS = [
  "work",
  "relationships",
  "family",
  "identity",
  "health",
  "finances",
  "purpose",
  "self-worth",
  "loss",
  "change",
  "conflict",
  "isolation",
  "achievement",
  "creativity",
  "trauma",
  "abuse",
  "neglect",
  "studies",
  "friendships",
  "romance",
  "belonging",
  "settling-in",
  "future",
  "burnout",
  "sleep",
  "parenting",
  "caregiving",
  "addiction",
  "body-image",
  "social-media",
  "housing",
] as const;

/**
 * Words authors use in the Library sheet that resolve to a canonical value.
 * Used at ingest only — never shown to the classifier. `low` is deliberately
 * absent: it is the Daily Mood scale, not an emotion (ADR 0002).
 */
const ALIASES: Record<"emotion" | "lifeArea", Record<string, string>> = {
  emotion: {
    anxious: "anxiety",
    grieving: "grief",
    lonely: "loneliness",
    stressed: "stress",
    overwhelmed: "overwhelm",
    "self-doubting": "self-doubt",
    unmotivated: "demotivation",
    uncertain: "uncertainty",
    hopeful: "hope",
    homesick: "homesickness",
    "out-of-place": "not-belonging",
  },
  lifeArea: {
    money: "finances",
    wellbeing: "health",
    "grief-and-loss": "loss",
    "life-after-uni": "future",
  },
};

/** The canonical slug for an author's word on an axis; unknown words pass through. */
export function canonicalFacet(axis: string, slug: string): string {
  return (ALIASES as Record<string, Record<string, string>>)[axis]?.[slug] ?? slug;
}
