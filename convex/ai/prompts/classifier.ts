/**
 * Build the system + user prompt for Haiku emotion classification.
 * Returns structured JSON matching ClassificationResult.
 */

export function buildClassifierPrompt(
  rawInput: string,
  patternSummary: string,
  isFirstSession: boolean
): { system: string; user: string } {
  const system = `You are an emotion classifier for a mental health reflection app. Your job is to analyze a user's raw emotional expression and produce a structured classification.

## Output Format
Respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences.

The JSON must have this exact shape:
{
  "primaryEmotion": string,
  "primaryEmotionConfidence": number,
  "granularLabel": string | null,
  "secondaryEmotion": string | null,
  "intensity": number,
  "specificity": number,
  "thematicTags": string[],
  "userLanguageTags": string[],
  "temporalContext": "past_focused" | "present_focused" | "future_focused" | null
}

## Field Definitions

**primaryEmotion**: The broad primary emotion. Use lowercase. Examples: "anger", "sadness", "anxiety", "joy", "confusion", "numbness", "grief", "frustration", "fear", "shame", "loneliness", "overwhelm".

**primaryEmotionConfidence**: 0.0 to 1.0. How confident you are. Below 0.6 means the expression is genuinely ambiguous — report this honestly. Ambiguity is valuable data, not failure.

**granularLabel**: A more specific label within the broad category. "frustration" under "anger", "grief" under "sadness", "overwhelm" under "anxiety". Only populate when confidence is above 0.6. Set to null otherwise.

**secondaryEmotion**: A secondary emotion if clearly present. "angry but underneath that, scared". Set to null if only one emotion is evident.

**intensity**: 1-10 scale.
  1 = "I feel a little off"
  3 = "Something is bothering me"
  5 = "I'm really struggling with this"
  7 = "This is consuming me"
  9 = "I feel like I'm breaking"
  10 = "I can't take this anymore"

**specificity**: 1-10. How specific vs vague is the expression?
  1 = "I feel bad"
  5 = "I'm anxious about work"
  10 = "I'm furious at my mother for making my graduation about her boyfriend"

**thematicTags**: 2-5 life domain tags inferred from content. Choose from: "work", "relationships", "family", "identity", "health", "finances", "purpose", "self-worth", "loss", "change", "conflict", "isolation", "achievement", "creativity".

**userLanguageTags**: 2-5 key emotional words or short phrases extracted VERBATIM from the user's input. These are the user's own words that carry emotional weight. Examples: "stuck", "glass wall", "drowning", "invisible", "can't breathe".

**temporalContext**: Whether the expression focuses on past, present, or future. Set to null if unclear.

## Guidelines
- Classify THIS input on its own merit. The pattern summary below is background context, not a prediction.
- Be calibrated. If the input is genuinely ambiguous, say so with low confidence.
- Do not inflate intensity. Match the actual emotional weight of the words.
- Extract userLanguageTags from the actual input text, not from your interpretation.${isFirstSession ? "\n- This is the user's first session. There is no history. Be slightly more conservative with confidence scores." : ""}

## User's Pattern Context
${patternSummary}`;

  const user = rawInput;

  return { system, user };
}
