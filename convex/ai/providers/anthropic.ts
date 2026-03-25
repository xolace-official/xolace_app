import Anthropic from "@anthropic-ai/sdk";

// --- Client Singleton ---

let client: Anthropic | null = null;

/**
 * Get the module-level singleton Anthropic client, creating and caching it on first call.
 *
 * @returns The shared `Anthropic` client instance
 */
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

export const DISTILLER_MODEL = "claude-haiku-4-5-20251001";
export const DISTILLER_VERSION = "distiller-v1-haiku-4.5";

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
 * Extract the first plain-text block from an Anthropic message's content.
 *
 * @param message - The Anthropic message to scan for a text block
 * @returns The text of the first block whose `type` is `"text"`, or an empty string if no text block is found
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
 * Convert a raw Haiku classifier output string into a validated ClassificationResult.
 *
 * Accepts raw model output (optionally wrapped in Markdown JSON code fences), parses it, and produces a safe, normalized ClassificationResult:
 * - `primaryEmotion` is lowercased or `"unclassified"` when missing/invalid.
 * - `primaryEmotionConfidence` is coerced to a number, defaults to `0.3`, and is clamped to the range `[0, 1]`.
 * - `intensity` and `specificity` are coerced to integers, default to `5`, and are clamped to the range `[1, 10]`.
 * - `thematicTags` and `userLanguageTags` are filtered to string values only and truncated to at most 5 entries.
 * - Optional `granularLabel` and `secondaryEmotion` are included only when non-empty strings (lowercased), and `temporalContext` is included only when it matches `past_focused`, `present_focused`, or `future_focused`.
 *
 * @param raw - The raw classifier output string; may include surrounding Markdown JSON code fences.
 * @returns The normalized and validated ClassificationResult constructed from the parsed input.
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

/**
 * Clamp a number to an inclusive range.
 *
 * @param value - The number to constrain
 * @param min - The inclusive lower bound
 * @param max - The inclusive upper bound
 * @returns The input value restricted to the inclusive range `[min, max]`
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
