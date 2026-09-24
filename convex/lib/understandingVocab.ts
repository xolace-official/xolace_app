/**
 * The classifier's closed vocabularies — the Understanding's own words.
 * The classifier prompt interpolates these, and the Library's `emotion` /
 * `lifeArea` facet axes are exactly these lists (ADR 0015), so a read-twig
 * match is a plain join. Grow a list here and both sides grow together;
 * removing a value orphans existing facets.
 */
export const PRIMARY_EMOTIONS = [
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
] as const;
