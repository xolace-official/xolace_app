import {
  QUIET_RETURN_PROMPTS,
  type QuietReturnTier,
} from "@/src/features/reflect/quiet-return-copy";
import { NIGHT_HEADLINE } from "@/src/features/reflect/night-copy";

/**
 * What the reflect card says, and how big it says it.
 *
 * Pure so the priority order is testable without a renderer: the card is the
 * only place a prompt lives now (#246), so exactly one source may win and the
 * user's own unfinished words must outrank anything the space would say.
 *
 * Type scale is card-local: the card is a fixed size, so long text scales down
 * within it rather than pushing the page around.
 */
export const DEFAULT_PROMPT = "What’s sitting with you right now?";

/** Above this many characters the card drops to the smaller scale. */
const LONG_TEXT_CHARS = 60;

export type CardContentSource =
  | "draft"
  | "night"
  | "quiet-return"
  | "event"
  | "default";

export type CardContent = {
  text: string;
  scale: "large" | "small";
  source: CardContentSource;
};

export function resolveCardContent({
  isNight = false,
  quietReturnTier = null,
  eventPrompt = null,
  draft = null,
}: {
  isNight?: boolean;
  quietReturnTier?: QuietReturnTier | null;
  eventPrompt?: string | null;
  /** The retained entry text. Whitespace-only is no draft at all. */
  draft?: string | null;
}): CardContent {
  const opening = draft?.trim().split("\n")[0]?.trim();
  if (opening) return withScale(opening, "draft");

  if (isNight) return withScale(NIGHT_HEADLINE, "night");
  if (quietReturnTier)
    return withScale(QUIET_RETURN_PROMPTS[quietReturnTier], "quiet-return");
  if (eventPrompt?.trim()) return withScale(eventPrompt, "event");
  return withScale(DEFAULT_PROMPT, "default");
}

function withScale(text: string, source: CardContentSource): CardContent {
  return {
    text,
    scale: text.length > LONG_TEXT_CHARS ? "small" : "large",
    source,
  };
}
