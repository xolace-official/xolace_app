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

  const systemPrompt = `You are given the emotional themes from a user's recent reflections. Generate a beautiful, honest quote that captures the emotional experience without being specific. It should feel like something a thoughtful writer found for themselves and wanted to keep.

Rules:
- 1-2 sentences maximum, mostly 1 where possible
- Poetic but grounded, not therapy-speak
- Can rephrase real-world quotes to suit the user's emotional context
- Second person (You) or first person
- No specific details from the session (the quote will be shared publicly)
- No medical or clinical terminology
- Must be able to stand alone without any context
- Pass the "would someone screenshot this?" test
- Approach the quote through the lens of: ${angleSeed}, use this as a poetic entry point, not a literal theme`;

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
