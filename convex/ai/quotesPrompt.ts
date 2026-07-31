// =============================================================
// SESSION-DERIVED QUOTE PROMPT — pure assembly logic (Cognition Layer
// transition, additive/fallback design).
//
// Kept free of Convex ctx and the Anthropic client so it stays
// unit-testable; the action/orchestration side lives in quotesDistiller.ts.
// =============================================================

export type QuoteSession = {
  sessionId: string;
  sessionCreatedAt: number;
  primaryEmotion: string;
  granularLabel?: string;
  thematicTags: string[];
  intensity: number;
};

/**
 * Assembles the system/user prompt for a session-derived quote. Drives off
 * the semantic profile (recurring themes + trajectory) when one exists, with
 * the 2-session summary folded in as a recency signal. Falls back to the
 * recency-only summary verbatim for cold-start users with no profile yet
 * (see docs/cognition-layer-architecture.md).
 */
export function buildQuotePrompt(params: {
  angleSeed: string;
  now: number;
  sessions: QuoteSession[];
  renderedProfile: string | null;
  preferredThemes: string[];
  recentQuoteTexts: string[];
}): { systemPrompt: string; userPrompt: string } {
  const { angleSeed, now, sessions, renderedProfile, preferredThemes, recentQuoteTexts } = params;

  const emotionalSummary: string = sessions
    .map((s) => {
      const label = s.granularLabel ?? s.primaryEmotion;
      const tags = s.thematicTags.length > 0 ? ` (${s.thematicTags.join(", ")})` : "";
      const daysAgo = Math.max(1, Math.round((now - s.sessionCreatedAt) / (1000 * 60 * 60 * 24)));
      const recency = daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
      return `- ${label}, intensity ${s.intensity}/10${tags} — ${recency}`;
    })
    .join("\n");

  const systemPrompt = `You are given the emotional themes from a user's recent reflections. Write one original line that captures the emotional experience without being specific, something a thoughtful writer found for themselves and wanted to keep.

Work in two steps:
1. Recall 2-3 real lines, aphorisms, poetry, proverbs, quotes that already live near this emotional territory.
2. Write ONE original line in that same register. It must not be attributable to any of them: no close paraphrase, no borrowed image. You are taking the register, not the words.

Output ONLY this JSON, nothing before or after:
{"seeds": ["...", "..."], "quote": "..."}

The quote:
- Aphorism shape: one sentence, around 20 words, sayable in a single breath. If the thought does not fit, find a smaller way to say it — never leave a cut-off fragment.
- Poetic but grounded, not therapy-speak
- Second person (You) or first person
- No specific details from the session (the quote will be shared publicly)
- No medical or clinical terminology
- Must be able to stand alone without any context
- Pass the "would someone screenshot this?" test
- Enter through the lens of: ${angleSeed}, use this as a poetic entry point, not a literal theme

NEVER (these produce a reflection of the reader, not a quote):
- NEVER narrate the reader's progress or inner process — no "You're beginning to...", "You're learning that...", "Part of you knows..."
- NEVER explain, interpret, or reassure about what the reader feels or why
- NEVER chain clauses with semicolons or stacked commas ("the X, the Y, the Z")
- NEVER reference the reader's situation or session details directly; the emotional register should feel personally resonant, not descriptive of specifics`;

  const themesLine =
    preferredThemes.length > 0
      ? `\nPreferred themes (align naturally with one if fitting): ${preferredThemes.join(", ")}`
      : "";

  const avoidLine =
    recentQuoteTexts.length > 0
      ? `\nRecent quotes already shown — do NOT reuse these framings, metaphors, or angles:\n${recentQuoteTexts.map((t) => `- "${t}"`).join("\n")}`
      : "";

  const contextBlock = renderedProfile
    ? `Longitudinal emotional profile:\n${renderedProfile}\n\nRecent signal (last few days):\n${emotionalSummary}`
    : `Recent emotional themes:\n${emotionalSummary}`;

  const userPrompt = `${contextBlock}${themesLine}${avoidLine}\n\nGenerate a quote:`;

  return { systemPrompt, userPrompt };
}

/**
 * Parses the seed-and-write JSON response. Tolerates the model wrapping the
 * object in prose or a ```json fence by slicing to the outermost braces.
 * Returns null when there is no usable quote — the caller retries or skips.
 */
export function parseQuoteResponse(
  raw: string,
): { quote: string; seeds: string[] } | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      quote?: unknown;
      seeds?: unknown;
    };
    const quote = typeof parsed.quote === "string" ? parsed.quote.trim() : "";
    if (!quote) return null;

    const seeds = Array.isArray(parsed.seeds)
      ? parsed.seeds.filter((s): s is string => typeof s === "string")
      : [];
    return { quote, seeds };
  } catch {
    return null;
  }
}
