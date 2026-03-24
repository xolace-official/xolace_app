import Anthropic from "@anthropic-ai/sdk";

// --- Client Singleton ---

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      // Reads ANTHROPIC_API_KEY from process.env automatically
      timeout: 30_000,
      maxRetries: 2,
    });
  }
  return client;
}

// --- Model Constants ---

export const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";
export const CLASSIFIER_VERSION = "classifier-v1-haiku-4.5";

export const ARTICULATOR_MODEL = "claude-sonnet-4-6";
export const ARTICULATOR_VERSION = "articulator-v1-sonnet-4.6";

// --- Types ---

export interface ClassificationResult {
  primaryEmotion: string;
  primaryEmotionConfidence: number;
  granularLabel?: string;
  secondaryEmotion?: string;
  intensity: number;
  specificity: number;
  thematicTags: string[];
  userLanguageTags: string[];
  temporalContext?: "past_focused" | "present_focused" | "future_focused";
}

// --- Helpers ---

/**
 * Extract the text content from an Anthropic message response.
 */
export function extractTextFromResponse(
  message: Anthropic.Message
): string {
  for (const block of message.content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  return "";
}

/**
 * Parse a Haiku classification response into a typed result.
 * Validates required fields and fills safe defaults for missing optionals.
 */
export function parseClassificationResponse(
  raw: string
): ClassificationResult {
  console.log("raw ", raw)
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Validate and coerce required fields
  const result: ClassificationResult = {
    primaryEmotion: typeof parsed.primaryEmotion === "string"
      ? parsed.primaryEmotion.toLowerCase()
      : "unclassified",
    primaryEmotionConfidence: clamp(
      Number(parsed.primaryEmotionConfidence) || 0.3,
      0,
      1
    ),
    intensity: clamp(Math.round(Number(parsed.intensity) || 5), 1, 10),
    specificity: clamp(Math.round(Number(parsed.specificity) || 5), 1, 10),
    thematicTags: Array.isArray(parsed.thematicTags)
      ? parsed.thematicTags.filter((t: unknown) => typeof t === "string").slice(0, 5)
      : [],
    userLanguageTags: Array.isArray(parsed.userLanguageTags)
      ? parsed.userLanguageTags.filter((t: unknown) => typeof t === "string").slice(0, 5)
      : [],
  };

  // Optional fields
  if (typeof parsed.granularLabel === "string" && parsed.granularLabel) {
    result.granularLabel = parsed.granularLabel.toLowerCase();
  }
  if (typeof parsed.secondaryEmotion === "string" && parsed.secondaryEmotion) {
    result.secondaryEmotion = parsed.secondaryEmotion.toLowerCase();
  }
  if (
    parsed.temporalContext === "past_focused" ||
    parsed.temporalContext === "present_focused" ||
    parsed.temporalContext === "future_focused"
  ) {
    result.temporalContext = parsed.temporalContext;
  }

  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
