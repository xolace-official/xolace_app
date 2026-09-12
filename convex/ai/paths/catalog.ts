import type { SupportNeed } from "../providers/anthropic";

/**
 * Kindling action catalog (docs/paths-v1.md §3.1, #331). Action TYPES in
 * code, not a table. The generation model sees `modelDescription` and picks
 * a key; the binder (§2.3, #332) turns a key into concrete content.
 *
 * Audio and music are FAMILIES: one entry per topic, never per track. The
 * `topic` on each entry matches `audio_tracks.topic` — it is the join key the
 * binder uses. "The Spectrum" episodes ride the `audio_topic_*` entries and
 * compete with standalones on tags — `tier` is editorial, never a binding
 * gate; only Track 2 gets its own cross-topic key, `episode_reframe`.
 */
export interface CatalogEntry {
  actionType: string;
  emotions: string[]; // binder tag axis
  themes: string[]; // binder tag axis
  supportNeedFit: Exclude<SupportNeed, "none">[];
  premium: boolean; // always true in v1
  humanContact: boolean; // true only for xolacer
  alwaysAvailable: boolean; // breathing = true; content-bound = false
  modelDescription: string; // what the generation model sees
}

const BOTH: Exclude<SupportNeed, "none">[] = ["light", "active"];

function audioTopic(
  topic: string,
  emotions: string[],
  themes: string[],
  modelDescription: string,
): CatalogEntry {
  return {
    actionType: `audio_topic_${topic}`,
    emotions,
    themes,
    supportNeedFit: BOTH,
    premium: true,
    humanContact: false,
    alwaysAvailable: false,
    modelDescription,
  };
}

function musicTopic(
  topic: string,
  emotions: string[],
  themes: string[],
  modelDescription: string,
): CatalogEntry {
  return {
    actionType: `music_topic_${topic}`,
    emotions,
    themes,
    supportNeedFit: BOTH,
    premium: true,
    humanContact: false,
    alwaysAvailable: false,
    modelDescription,
  };
}

export const CATALOG: readonly CatalogEntry[] = [
  {
    actionType: "breathing",
    emotions: [],
    themes: [],
    supportNeedFit: BOTH,
    premium: true,
    humanContact: false,
    alwaysAvailable: true,
    modelDescription:
      "A short guided slow-breathing exercise, about a minute, done right where they are. Fits when the body is wound up or the mind is racing.",
  },
  {
    actionType: "xolacer",
    emotions: [],
    themes: [],
    supportNeedFit: BOTH,
    premium: true,
    humanContact: true,
    alwaysAvailable: false,
    modelDescription:
      "A quiet conversation with a peer listener — another person who has sat with something similar. The only action involving a real human. Fits when they seem to want company, not tools.",
  },
  {
    actionType: "episode_reframe",
    emotions: ["shame", "guilt", "sadness", "numbness"],
    themes: ["self-criticism", "toxic-positivity", "should-be-over-this"],
    supportNeedFit: BOTH,
    premium: true,
    humanContact: false,
    alwaysAvailable: false,
    modelDescription:
      'A short spoken episode from the series "Reality, Not False Hope" — plain talk that pushes back on toxic positivity and self-invalidation. Fits when they are telling themselves they should be over it, that others have it worse, or that their feeling is wrong to have.',
  },
  audioTopic(
    "anxiety",
    ["anxiety", "fear"],
    ["racing-thoughts", "uncertainty", "worry"],
    "Spoken support audio on worry, dread and racing thoughts — a calm voice keeping them company through it.",
  ),
  audioTopic(
    "grief",
    ["grief", "sadness"],
    ["loss", "death", "missing-someone"],
    "Spoken support audio on loss and missing someone — sitting with grief rather than fixing it.",
  ),
  audioTopic(
    "sadness",
    ["sadness"],
    ["low-mood", "heaviness", "disappointment"],
    "Spoken support audio on low, heavy days — company for sadness that has no single cause.",
  ),
  audioTopic(
    "anger",
    ["anger", "disgust"],
    ["conflict", "injustice", "resentment"],
    "Spoken support audio on anger and resentment — room to feel it without acting on it.",
  ),
  audioTopic(
    "shame",
    ["shame", "guilt"],
    ["self-criticism", "regret", "not-enough"],
    "Spoken support audio on shame, guilt and the harsh inner voice.",
  ),
  audioTopic(
    "numbness",
    ["numbness", "confusion"],
    ["disconnection", "emptiness", "going-through-motions"],
    "Spoken support audio on feeling flat, empty or disconnected from yourself.",
  ),
  audioTopic(
    "loneliness",
    ["sadness", "love"],
    ["loneliness", "isolation", "relationships"],
    "Spoken support audio on loneliness and feeling unseen, even around people.",
  ),
  audioTopic(
    "overwhelm",
    ["anxiety", "sadness", "confusion"],
    ["overwhelm", "burnout", "too-much", "work"],
    "Spoken support audio on being stretched thin — too much on, no room to breathe.",
  ),
  // Music topics mirror the curated Pixabay shelves exactly (20 topics).
  musicTopic("anxiety_relief", ["anxiety", "fear"], ["racing-thoughts", "worry"],
    "Instrumental music chosen to settle worry and a racing mind."),
  musicTopic("stress_relief", ["anxiety", "anger"], ["overwhelm", "pressure", "work"],
    "Instrumental music for pressure and being stretched thin."),
  musicTopic("sadness", ["sadness", "grief"], ["low-mood", "heaviness"],
    "Instrumental music that keeps company with a low, heavy mood rather than lifting it."),
  musicTopic("loneliness", ["sadness", "love"], ["loneliness", "isolation"],
    "Instrumental music for feeling alone or unseen."),
  musicTopic("overthinking", ["anxiety", "confusion"], ["racing-thoughts", "rumination"],
    "Instrumental music to sit inside when the mind will not stop looping."),
  musicTopic("calm_peace", ["anxiety", "anger", "fear"], ["tension", "restlessness"],
    "Slow, steady instrumental music — nothing to do but sit inside it for a few minutes."),
  musicTopic("meditation", ["anxiety", "confusion"], ["stillness", "restlessness"],
    "Sparse instrumental music made for sitting still with eyes closed."),
  musicTopic("mindfulness", ["confusion", "numbness"], ["disconnection", "presence"],
    "Quiet instrumental music for noticing what is here right now."),
  musicTopic("deep_relaxation", ["anxiety", "sadness"], ["tension", "exhaustion"],
    "Long, soft instrumental music for letting the body unclench."),
  musicTopic("sleep_rest", ["sadness", "anxiety", "numbness"], ["exhaustion", "sleep"],
    "Very soft instrumental music for when they are worn out and need to stop."),
  musicTopic("healing_recovery", ["grief", "sadness", "shame"], ["loss", "recovery", "after-something-hard"],
    "Gentle instrumental music for the slow part after something hard."),
  musicTopic("self_love", ["shame", "guilt"], ["self-criticism", "not-enough"],
    "Warm instrumental music for when the inner voice has been harsh."),
  musicTopic("happiness_joy", ["joy", "love"], ["gratitude", "lightness"],
    "Bright instrumental music for a moment that deserves to be enjoyed, not analysed."),
  musicTopic("motivation", ["numbness", "sadness"], ["stuck", "avoidance", "low-energy"],
    "Instrumental music with forward motion for feeling stuck or flat."),
  musicTopic("hope_positivity", ["sadness", "fear"], ["uncertainty", "future"],
    "Open, lifting instrumental music for when the future feels closed."),
  musicTopic("emotional_release", ["anger", "grief", "sadness"], ["tension", "letting-go", "held-in"],
    "Instrumental music with weight and movement — for feelings that need somewhere to go."),
  musicTopic("focus_concentration", ["anxiety", "confusion"], ["work", "distraction", "overwhelm"],
    "Steady instrumental music for getting back to one thing at a time."),
  musicTopic("nature_mindfulness", ["anxiety", "numbness"], ["disconnection", "restlessness"],
    "Nature-led instrumental soundscapes for stepping out of the noise."),
  musicTopic("breathing_meditation", ["anxiety", "fear"], ["racing-thoughts", "tension"],
    "Slow instrumental music paced for breathing along with it."),
  musicTopic("confidence_empowerment", ["shame", "fear"], ["self-doubt", "not-enough"],
    "Grounded, rising instrumental music for when self-doubt is loud."),
];

export const CATALOG_BY_KEY: ReadonlyMap<string, CatalogEntry> = new Map(
  CATALOG.map((entry) => [entry.actionType, entry]),
);
