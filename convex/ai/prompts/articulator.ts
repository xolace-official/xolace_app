/**
 * Build the system + user prompt for Sonnet mirror articulation.
 */

import type { ClassificationResult } from "../providers/anthropic";

interface ArticulatorInput {
  rawInput: string;
  classification: ClassificationResult;
  patternSummary: string;
  safeguardLevel: "none" | "gentle" | "elevated" | "crisis";
  mirrorTone: string;
  isFirstSession: boolean;
  recentMirrors: string[];
  entryType?: string;
  inputDuration?: number;
  freezeOccurred?: boolean;
  // Refinement context (for clarification turns)
  existingMirror?: string;
  userFeedback?: string;
  additionalInput?: string;
}

/**
 * Builds the system and user prompt texts for the "Sonnet" emotional mirror articulator.
 *
 * @param input - Structured input that configures prompt generation, including:
 *   - `rawInput`: the user's original text to be set as the `user` prompt.
 *   - `classification`: detected emotion metadata (primaryEmotion, primaryEmotionConfidence, secondaryEmotion, granularLabel, intensity, specificity, thematicTags, temporalContext) used in the system context.
 *   - `patternSummary`: a summary of observed conversational or emotional patterns to include in system context.
 *   - `safeguardLevel`: one of `none | gentle | elevated | crisis` controlling additional safety guidance.
 *   - `mirrorTone`: tone selection for the mirror (e.g., `poetic | gentle | direct | adaptive`).
 *   - `isFirstSession`: when true, adds a brief warm-but-not-patronizing note.
 *   - `recentMirrors`: array of recent mirror texts to list (used to avoid reusing metaphors/phrasing).
 *   - `inputDuration` (optional): writing duration in ms used to generate behavioral notes.
 *   - `freezeOccurred` (optional): whether a significant pause/hesitation was detected.
 *   - `existingMirror`, `userFeedback`, `additionalInput` (optional): used to build refinement context when revising a previous mirror.
 * @returns An object with `system` — the composed system prompt (rules, tone, classification and pattern context, safeguard and behavioral notes, and optional refinement/recent-mirror sections) — and `user` — the original `rawInput`.
 */
export function buildArticulatorPrompt(
  input: ArticulatorInput
): { system: string; user: string } {
  const {
    rawInput,
    classification,
    patternSummary,
    safeguardLevel,
    mirrorTone,
    isFirstSession,
    recentMirrors,
    entryType,
    inputDuration,
    freezeOccurred,
    existingMirror,
    userFeedback,
    additionalInput,
  } = input;

  const toneInstructions = getToneInstructions(mirrorTone);
  const safeguardInstructions = getSafeguardInstructions(safeguardLevel);
  const behaviorNotes = getBehaviorNotes(inputDuration, freezeOccurred);
  const entryTypeInstructions = getEntryTypeInstructions(entryType);

  const system = `You are an emotional mirror inside Xolace(if any one ask who you are, say "I am Xolace, your emotional mirror"). You reflect back what someone is feeling with more precision than they could find themselves. You are not a therapist, coach, or chatbot.

## Core Rules
- 1-4 sentences ONLY. Most mirrors should be 1-3. Short is not shallow.
- Weave the user's own emotionally charged words into your mirror, then add a dimension they didn't have words for. Their words anchor recognition; your expansion creates the "yes, exactly" moment.
- Use second person ("you") naturally.
- Respond with ONLY the mirror text. No labels, no JSON, no preamble.

## Never Do
- Never say "I understand", "I hear you", "I can see that", or "It sounds like"
- Never offer advice, reassurance, or next steps ("It'll get better", "Try to...")
- Never minimize ("At least...") or compare ("Many people feel this way")
- Never use clinical language or diagnose
- Never ask more than one question (questions should be rare)
- Never use emoji or dashes/&mdash; (—)

## Tone
${toneInstructions}

## Intensity × Specificity
${getIntensitySpecificityGuidance(classification.intensity, classification.specificity)}
${entryTypeInstructions}
## Classification Context
Primary: ${classification.primaryEmotion} (${classification.primaryEmotionConfidence.toFixed(2)})${classification.granularLabel ? ` → ${classification.granularLabel}` : ""}${classification.secondaryEmotion ? `\nUnderneath: ${classification.secondaryEmotion}` : ""}
Intensity: ${classification.intensity}/10 | Specificity: ${classification.specificity}/10
${classification.thematicTags.length > 0 ? `Themes: ${classification.thematicTags.join(", ")}` : ""}${classification.temporalContext ? `\nTemporal: ${classification.temporalContext}` : ""}
User's words: ${classification.userLanguageTags.length > 0 ? classification.userLanguageTags.join(", ") : "none extracted"}
${safeguardInstructions}${behaviorNotes}${isFirstSession ? "\nFirst session. Be slightly warmer — they don't know what to expect. The mirror should feel like a surprise." : ""}

## Pattern Context (use for subtle continuity — never reference past sessions explicitly)
${patternSummary}
${recentMirrors.length > 0 ? `\n## Recent Mirrors (avoid same metaphors, sentence structures, opening words, and imagery family)\n${recentMirrors.map((m, i) => `${i + 1}. "${m}"`).join("\n")}` : ""}${existingMirror ? buildRefinementContext(existingMirror, userFeedback, additionalInput) : ""}`;

  const user = rawInput;

  return { system, user };
}

/**
 * Provide tone-specific guidance text for composing a mirror response.
 *
 * @param tone - One of: `"poetic"` (metaphor-rich, evocative), `"gentle"` (warm, simple), `"direct"` (clear, minimal), or `"adaptive"` (match the user's register). Unknown values use the `"adaptive"` behavior.
 * @returns The guidance string describing the desired register and an example phrasing for the specified tone.
 */
function getToneInstructions(tone: string): string {
  switch (tone) {
    case "poetic":
      return "Use evocative, metaphor-rich language. Let the words breathe. Example register: \"Something in you is holding an ocean.\"";
    case "gentle":
      return "Use warm, simple language. Be soft without being vague. Example register: \"That sounds really heavy right now.\"";
    case "direct":
      return "Use clear, minimal language. No metaphors. Say it plainly. Example register: \"You're angry, and it's about feeling unseen.\"";
    case "adaptive":
    default:
      return "Read the register of the user's input and match it. If they write plainly, mirror plainly. If they write with imagery, mirror with imagery. Meet them where they are.";
  }
}

/**
 * Produces an optional safety guidance block tailored to the specified safeguard level.
 */
function getSafeguardInstructions(level: string): string {
  switch (level) {
    case "gentle":
      return "\n\n## Safety Note\nMirror with extra warmth. Be grounding without escalating intensity.";
    case "elevated":
      return "\n\n## Safety Note\nSignificant distress detected. Mirror with care — be warm and steady. Do not intensify or dramatize. The system will show support resources separately.";
    case "crisis":
      return "\n\n## Safety Note — Crisis\nCrisis signals detected. Mirror their pain with deep care, but be grounding, not evocative. Do not reflect hopelessness back without anchoring. Keep to 1-2 sentences. The system will show crisis resources after your mirror.";
    default:
      return "";
  }
}

/**
 * Returns guidance for how intensity and specificity should shape the mirror's character.
 */
function getIntensitySpecificityGuidance(intensity: number, specificity: number): string {
  const highIntensity = intensity >= 7;
  const highSpecificity = specificity >= 6;

  if (highIntensity && highSpecificity) {
    return "High intensity, high specificity — meet them at full depth. Be direct and precise. No hedging.";
  } else if (highIntensity && !highSpecificity) {
    return "High intensity, low specificity — a big feeling without clear shape. Ground it. Give the vague enormity a form.";
  } else if (!highIntensity && highSpecificity) {
    return "Low intensity, high specificity — observational and reflective. Match their measured tone.";
  }
  return "Low intensity, low specificity — light and curious. Something is there but hasn't announced itself yet.";
}

/**
 * Returns entry-type-specific mirroring guidance.
 */
function getEntryTypeInstructions(entryType?: string): string {
  switch (entryType) {
    case "word_cloud":
      return "## Entry Type: Texture Words\nThe user tapped 2-3 emotional texture words. These ARE their language — build the mirror around them. Make the combination feel like a complete emotional picture. Do not add emotions not implied by the words.\n\n";
    case "body_scan":
      return "## Entry Type: Body Areas\nThe user tapped body locations where they feel emotion. Translate somatic to emotional: chest = grief/anxiety/tightness, stomach = dread/guilt, head = overwhelm/rumination, throat = suppression/things unsaid, hands = helplessness/restlessness.\n\n";
    case "voice":
      return "## Entry Type: Voice\nTranscribed speech — may contain filler words and repetition. Focus on the emotional content, not the polish.\n\n";
    default:
      return "";
  }
}

/**
 * Constructs an optional "Behavioral Signals" section when writing-speed or pause indicators are present.
 *
 * @param inputDuration - Total time in milliseconds the user took to compose the input; used to detect unusually fast or slow writing.
 * @param freezeOccurred - Whether a significant pause or hesitation occurred before or during writing.
 * @returns A formatted "Behavioral Signals" markdown string with one or more observational notes when signals are detected, or an empty string when none are present.
 */
function getBehaviorNotes(
  inputDuration?: number,
  freezeOccurred?: boolean
): string {
  const notes: string[] = [];

  if (inputDuration !== undefined) {
    if (inputDuration < 10_000) {
      notes.push(
        "The user wrote very quickly (possible emotional flooding — the words came fast)."
      );
    } else if (inputDuration > 120_000) {
      notes.push(
        "The user took a long time to write (possible difficulty articulating — be gentle with precision)."
      );
    }
  }

  if (freezeOccurred) {
    notes.push(
      "The user paused significantly before writing (hesitation or difficulty starting — honor that effort)."
    );
  }

  return notes.length > 0
    ? `\n\n## Behavioral Signals\n${notes.join("\n")}`
    : "";
}

/**
 * Builds a refinement context block for a previous mirror to guide adjustments.
 *
 * When `userFeedback` is "not_quite", instructs the model to try a different angle/metaphor/emotional read.
 * When `userFeedback` is "say_more", instructs the model to incorporate additional context.
 * If `additionalInput` is provided, it is appended as quoted extra user input.
 *
 * @param existingMirror - The previous mirror text to include in the refinement section
 * @param userFeedback - Optional feedback flag affecting refinement instructions; supported values: `"not_quite"` or `"say_more"`
 * @param additionalInput - Optional additional user-provided text to append to the refinement context
 * @returns A formatted refinement context string containing the previous mirror and any refinement instructions or additional input
 */
function buildRefinementContext(
  existingMirror: string,
  userFeedback?: string,
  additionalInput?: string
): string {
  let context = `\n\n## Refinement\nYour previous mirror was: "${existingMirror}"`;

  if (userFeedback === "not_quite") {
    context += `\nThe user said "Not quite" — your mirror didn't land. Try a different angle, different metaphor, different emotional read.`;
  } else if (userFeedback === "say_more") {
    context += `\nThe user wanted to say more — they had additional context to share. Incorporate it.`;
  }

  if (additionalInput) {
    context += `\nAdditional input from the user: "${additionalInput}"`;
  }

  return context;
}
