/**
 * Build the system + user prompts for the follow-up check-in card writer (Haiku).
 *
 * The card is a SINGLE check-in sentence shown in-app a day or so after a
 * session that left something unresolved. It must be rooted in what the person
 * actually processed — never generic — except for two cases:
 *
 * - gave_up sessions: there is no resonant mirror to reference, so the copy is
 *   mirror-free (it references the *act* of trying to put something into words,
 *   not a specific articulation).
 * - acute (crisis) tier: presence-first. The card is a warm "I'm here" check,
 *   not a processing prompt, and stays softer / wound-light.
 *
 * Per house style we give the model constraints and NEVER rules only — no
 * sample outputs (positive examples cause mode-collapse / fixation).
 */

export type FollowUpCardTier = "acute" | "elevated" | "standard";

export type FollowUpCardContext = {
  tier: FollowUpCardTier;
  /** The confirmed mirror text, if any. Absent/empty for gave_up sessions. */
  mirrorText?: string | null;
  /** Internal classifier reason (why a follow-up was warranted). */
  followUpReason?: string | null;
  primaryEmotion?: string | null;
  granularLabel?: string | null;
  /** True when the session ended in gave_up (no landed mirror). */
  gaveUp: boolean;
};

export function buildFollowUpCardPrompt(ctx: FollowUpCardContext): {
  system: string;
  user: string;
} {
  const toneLine =
    ctx.tier === "acute"
      ? `This is a PRESENCE check, not a processing prompt. The person processed something heavy a short while ago. Your job is to let them feel quietly accompanied, warm, unhurried. Do not re-open the wound or name specifics sharply. Lead with care, not curiosity.`
      : `This is a gentle check-in on something the person left unresolved. Reference what they actually processed so it reads as "you were heard", then check softly how they are feeling now or how it is sitting with them.`;

  const sourceRule = ctx.gaveUp
    ? `The mirror never landed for this person, there is NO articulation to quote back. Reference the *act* of trying to put something into words that wouldn't quite come, not a specific feeling you are unsure of. Stay open and humble.`
    : `Ground the sentence in the mirror text below, echo its emotional essence in fresh words. Do NOT quote it verbatim.`;

  const system = `You are the voice of Xolace writing a single, quiet follow-up check-in.

Xolace is an emotional processing space, not therapy and not a chatbot. ${toneLine}

## Output
Return ONLY the check-in text. One sentence, at most two short ones. No greeting, no name, no preamble, no poems, no ambiguous quotes, no quotation marks, no markdown, no emoji. Under 160 characters.

## Source material
${sourceRule}

## NEVER
- NEVER diagnose, label, or use clinical terms.
- NEVER promise outcomes ("you'll feel better"), give advice, or instruct.
- NEVER be cheerful, peppy, or use exclamation marks.
- NEVER guilt-trip about time passing or absence.
- NEVER reference that this is an automated message, a "notification", or a "follow-up".
- NEVER invent details the person did not express.${
    ctx.tier === "acute"
      ? "\n- NEVER name a crisis, a method, or anything alarming. Stay soft and present."
      : ""
  }`;

  const facts: string[] = [];
  if (!ctx.gaveUp && ctx.mirrorText) {
    facts.push(`Mirror they confirmed: "${ctx.mirrorText}"`);
  }
  if (ctx.primaryEmotion) {
    facts.push(
      `Primary emotion: ${ctx.primaryEmotion}${
        ctx.granularLabel ? ` (${ctx.granularLabel})` : ""
      }`,
    );
  }
  if (ctx.followUpReason) {
    facts.push(`Why this earned a check-in (internal): ${ctx.followUpReason}`);
  }
  if (ctx.gaveUp) {
    facts.push(
      `Note: the mirror never landed — write mirror-free, about the attempt itself.`,
    );
  }

  const user = `Write the check-in.\n\n${
    facts.length > 0 ? facts.join("\n") : "No specific context available, keep it warm, present, and non-specific."
  }`;

  return { system, user };
}

/**
 * Defensive fallback used when Haiku is unavailable at card-write time. The row
 * + workflow ALWAYS start (mirrors the FALLBACK_MIRROR pattern) so a
 * safety-relevant follow-up is never silently dropped. Tier-aware so an Acute
 * fallback still reads as presence, not a processing prompt.
 */
export function fallbackFollowUpCard(tier: FollowUpCardTier): string {
  if (tier === "acute") {
    return "Just checking in on you. We're here, no rush.";
  }
  return "A little while ago you let something out here. How's it sitting now?";
}
