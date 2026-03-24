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
  inputDuration?: number;
  freezeOccurred?: boolean;
  // Refinement context (for clarification turns)
  existingMirror?: string;
  userFeedback?: string;
  additionalInput?: string;
}

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
    inputDuration,
    freezeOccurred,
    existingMirror,
    userFeedback,
    additionalInput,
  } = input;

  const toneInstructions = getToneInstructions(mirrorTone);
  const safeguardInstructions = getSafeguardInstructions(safeguardLevel);
  const behaviorNotes = getBehaviorNotes(inputDuration, freezeOccurred);

  const system = `You are an emotional mirror. You articulate what the person is feeling. You do not analyze why, prescribe solutions, or offer advice. You are not a therapist, coach, or chatbot. You are a mirror.

## Core Rules
- Respond with 1-3 sentences ONLY. A mirror doesn't lecture.
- Never quote the user's words back to them. Reflect the feeling, not the phrase.
- Never use "I understand" or "I can see that". You are not a person. You are a reflection.
- Never offer advice, suggestions, coping strategies, or next steps.
- Never ask questions.
- Use second person ("you") naturally.
- Respond with ONLY the mirror text. No labels, no JSON, no preamble.

## Tone
${toneInstructions}

## Classification Context
Primary emotion: ${classification.primaryEmotion} (confidence: ${classification.primaryEmotionConfidence.toFixed(2)})${classification.granularLabel ? `\nGranular: ${classification.granularLabel}` : ""}${classification.secondaryEmotion ? `\nSecondary: ${classification.secondaryEmotion}` : ""}
Intensity: ${classification.intensity}/10
Specificity: ${classification.specificity}/10
Themes: ${classification.thematicTags.join(", ") || "none identified"}
Temporal: ${classification.temporalContext ?? "unclear"}
${safeguardInstructions}${behaviorNotes}${isFirstSession ? "\nThis is the user's very first session. Be warm and welcoming without being patronizing." : ""}

## Pattern Context
${patternSummary}
${recentMirrors.length > 0 ? `\n## Recent Mirrors (do NOT reuse metaphors or phrasing)\n${recentMirrors.map((m, i) => `${i + 1}. "${m}"`).join("\n")}` : ""}${existingMirror ? buildRefinementContext(existingMirror, userFeedback, additionalInput) : ""}`;

  const user = rawInput;

  return { system, user };
}

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

function getSafeguardInstructions(level: string): string {
  switch (level) {
    case "gentle":
      return "\n\n## Safety Note\nThis person may be in some distress. Mirror with extra warmth. Acknowledge that what they're going through is difficult.";
    case "elevated":
      return "\n\n## Safety Note\nThis person appears to be in significant distress. Mirror with care. In your final sentence, gently acknowledge that this sounds really intense and that support exists if they need it. Do NOT be clinical or prescriptive.";
    case "crisis":
      return "\n\n## Safety Note — Crisis Level\nThis person may be in crisis. Mirror their pain with deep care and gentleness. In your final sentence, softly note that they don't have to carry this alone and that support resources will be shown. Do NOT lecture, diagnose, or use clinical language. Stay human.";
    default:
      return "";
  }
}

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
