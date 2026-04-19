export type MatchInput = {
  primaryEmotion: string;
  granularLabel?: string;
  intensity: number;
  userLanguageTags: string[];
  entryType: string;
  confirmationState: "confirmed" | "refined" | "gave_up" | "abandoned";
};

export type ExerciseTitle =
  | "let_it_land"
  | "find_your_edges"
  | "make_room"
  | "speak_to_it"
  | "soften_toward_it"
  | "reset";

const HIGH_ACTIVATION = new Set([
  "anxiety", "panic", "dread", "overwhelm", "terror",
]);
const NUMB = new Set([
  "numbness", "dissociation", "flatness", "anhedonia",
]);
const STUCK = new Set([
  "helplessness", "despair", "hopelessness",
]);
const SHAME = new Set([
  "shame", "guilt", "embarrassment",
]);
const ANGER = new Set([
  "anger", "frustration", "rage", "resentment",
]);

const NUMB_TAGS = new Set([
  "numb", "empty", "foggy", "blank", "hollow", "flat",
  "dissociated", "checked out", "disconnected",
]);
const STUCK_TAGS = new Set([
  "stuck", "trapped", "heavy", "paralyzed", "frozen",
  "can't move", "can't start",
]);
const SHAME_TAGS = new Set([
  "shame", "worthless", "failing", "not enough",
  "broken", "defective",
]);
const ANGER_TAGS = new Set([
  "angry", "furious", "rage", "resentment", "betrayal",
  "violated",
]);

function hasTag(tags: string[], set: Set<string>): boolean {
  return tags.some((t) => set.has(t.toLowerCase()));
}

/** Returns ranked exercises (primary + fallbacks). Never returns an empty list. */
export function matchExercise(input: MatchInput): ExerciseTitle[] {
  const { primaryEmotion, intensity, userLanguageTags, confirmationState } = input;
  const emotion = primaryEmotion.toLowerCase();

  if (confirmationState === "gave_up" || confirmationState === "abandoned") {
    return ["reset", "let_it_land", "find_your_edges", "make_room", "speak_to_it", "soften_toward_it"];
  }

  if (intensity >= 8 || HIGH_ACTIVATION.has(emotion)) {
    return ["reset", "let_it_land", "make_room", "find_your_edges", "speak_to_it", "soften_toward_it"];
  }

  if (NUMB.has(emotion) || hasTag(userLanguageTags, NUMB_TAGS)) {
    return ["find_your_edges", "let_it_land", "reset", "make_room", "speak_to_it", "soften_toward_it"];
  }

  if (STUCK.has(emotion) || hasTag(userLanguageTags, STUCK_TAGS)) {
    return ["make_room", "let_it_land", "reset", "find_your_edges", "speak_to_it", "soften_toward_it"];
  }

  if (SHAME.has(emotion) || hasTag(userLanguageTags, SHAME_TAGS)) {
    return ["soften_toward_it", "let_it_land", "make_room", "reset", "find_your_edges", "speak_to_it"];
  }

  if (ANGER.has(emotion) || hasTag(userLanguageTags, ANGER_TAGS)) {
    return ["speak_to_it", "make_room", "let_it_land", "reset", "find_your_edges", "soften_toward_it"];
  }

  return ["let_it_land", "make_room", "soften_toward_it", "find_your_edges", "reset", "speak_to_it"];
}
