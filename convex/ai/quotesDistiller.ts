// V8 runtime — Anthropic SDK uses fetch, no Node built-ins needed.

import { v } from "convex/values";
import { ActionCtx, internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { getAnthropicClient } from "./providers/anthropic";

const DISTILLER_MODEL = "claude-haiku-4-5-20251001";

// Regex: flag capitalized mid-sentence words that look like proper nouns
const PROPER_NOUN_RE = /(?<!\. |\? |! |^)[A-Z][a-z]{2,}/g;

// Short medical/clinical term blocklist — keeps quotes shareable
const MEDICAL_BLOCKLIST = [
  "depression",
  "anxiety disorder",
  "ptsd",
  "bipolar",
  "schizophrenia",
  "diagnosis",
  "disorder",
  "symptom",
  "therapy",
  "medication",
  "prescribed",
];

// 12 poetic lenses that rotate daily — forces a fresh rhetorical entry point
// even when emotional input is identical across consecutive days.
const ANGLE_SEEDS = [
  "impermanence",
  "self-compassion",
  "paradox",
  "movement",
  "stillness",
  "clarity",
  "tenderness",
  "observation",
  "strength",
  "surrender",
  "distance",
  "contrast",
] as const;

function dailyAngleSeed(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, 0, 0));
  const current = new Date(Date.UTC(year, month - 1, day));
  const dayOfYear = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return ANGLE_SEEDS[dayOfYear % ANGLE_SEEDS.length];
}

function validateQuote(text: string): { ok: boolean; reason?: string } {
  if (text.length < 20) return { ok: false, reason: "too short" };
  if (text.length > 300) return { ok: false, reason: "too long" };

  const properNouns = text.match(PROPER_NOUN_RE);
  if (properNouns && properNouns.length > 2) {
    return { ok: false, reason: `too many proper nouns: ${properNouns.join(", ")}` };
  }

  const lowerText = text.toLowerCase();
  for (const term of MEDICAL_BLOCKLIST) {
    if (lowerText.includes(term)) {
      return { ok: false, reason: `blocked term: ${term}` };
    }
  }

  return { ok: true };
}

/**
 * Load recent emotional metadata for session-derived quote generation.
 * Uses up to 3 most recent sessions within the last 7 days.
 * NEVER accesses rawInput — only emotional metadata.
 */
export const loadEmotionalContext = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args) => {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;

    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q
          .eq("emotionalProfileId", args.emotionalProfileId)
          .gte("createdAt", fiveDaysAgo)
      )
      .order("desc")
      .filter((q) => q.eq(q.field("state"), "completed"))
      .take(2);

    if (recentSessions.length === 0) return null;

    // Load emotional metadata for each session (privacy-safe: no rawInput)
    const contextItems = [];
    for (const session of recentSessions) {
      const metadata = await ctx.db
        .query("emotional_metadata")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .unique();

      if (metadata) {
        contextItems.push({
          sessionId: session._id,
          sessionCreatedAt: session.createdAt,
          primaryEmotion: metadata.primaryEmotion,
          granularLabel: metadata.granularLabel,
          thematicTags: metadata.thematicTags,
          intensity: metadata.intensity,
        });
      }
    }

    return contextItems.length > 0
      ? { sessions: contextItems, sessionIds: contextItems.map((c) => c.sessionId) }
      : null;
  },
});

/**
 * Load the text of recent session-derived quotes for this user (excluding today).
 * Used to steer the model away from angles it has already taken.
 */
export const loadRecentQuotes = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    beforeDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch last 14 rows (≤7 days × 2 types) bounded by profile + date range
    const rows = await ctx.db
      .query("daily_quotes")
      .withIndex("by_profile_date", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId).lt("date", args.beforeDate)
      )
      .order("desc")
      .take(14);

    return rows
      .filter((r) => r.type === "session")
      .slice(0, 7)
      .map((r) => r.text);
  },
});

/**
 * Generate a session-derived quote for one user.
 * Called per-user by the nightly cron batch processor.
 */
type EmotionalContext = {
  sessions: {
    sessionId: string;
    sessionCreatedAt: number;
    primaryEmotion: string;
    granularLabel?: string;
    thematicTags: string[];
    intensity: number;
  }[];
  sessionIds: string[];
} | null;

/**
 * Plain helper — call directly from actions in the same V8 runtime
 * to avoid ctx.runAction overhead and an extra Convex function round-trip.
 */
export async function distillQuoteForUser(
  ctx: ActionCtx,
  args: { emotionalProfileId: Id<"emotional_profiles">; date: string; preferredThemes: string[] }
): Promise<string | null> {
  try {
      const [context, recentQuoteTexts] = await Promise.all([
        ctx.runQuery(internal.ai.quotesDistiller.loadEmotionalContext, {
          emotionalProfileId: args.emotionalProfileId,
        }) as Promise<EmotionalContext>,
        ctx.runQuery(internal.ai.quotesDistiller.loadRecentQuotes, {
          emotionalProfileId: args.emotionalProfileId,
          beforeDate: args.date,
        }) as Promise<string[]>,
      ]);

      if (!context) {
        console.log(
          `[quotesDistiller] No recent sessions for ${args.emotionalProfileId}, skipping session-derived quote`
        );
        return null;
      }

      const angleSeed = dailyAngleSeed(args.date);

      const now = Date.now();
      const emotionalSummary: string = context.sessions
        .map((s: NonNullable<EmotionalContext>["sessions"][number]) => {
          const label = s.granularLabel ?? s.primaryEmotion;
          const tags = s.thematicTags.length > 0 ? ` (${s.thematicTags.join(", ")})` : "";
          const daysAgo = Math.max(1, Math.round((now - s.sessionCreatedAt) / (1000 * 60 * 60 * 24)));
          const recency = daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
          return `- ${label}, intensity ${s.intensity}/10${tags} — ${recency}`;
        })
        .join("\n");

      const systemPrompt = `You are given the emotional themes from a user's recent reflections. Generate a beautiful, honest quote that captures the emotional experience without being specific. It should feel like something a thoughtful writer found for themselves and wanted to keep.

Rules:
- 1-2 sentences maximum
- Poetic but grounded — not therapy-speak
- Can rephrase real-world quotes to suit the user's emotional context
- Second person (You) or first person
- No specific details from the session (the quote will be shared publicly)
- No medical or clinical terminology
- Must be able to stand alone without any context
- Pass the "would someone screenshot this?" test
- Approach the quote through the lens of: ${angleSeed} — use this as a poetic entry point, not a literal theme`;

      const themesLine =
        args.preferredThemes.length > 0
          ? `\nPreferred themes (align naturally with one if fitting): ${args.preferredThemes.join(", ")}`
          : "";

      const avoidLine =
        recentQuoteTexts.length > 0
          ? `\nRecent quotes already shown — do NOT reuse these framings, metaphors, or angles:\n${recentQuoteTexts.map((t) => `- "${t}"`).join("\n")}`
          : "";

      const userPrompt: string = `Recent emotional themes:\n${emotionalSummary}${themesLine}${avoidLine}\n\nGenerate a quote:`;

      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: DISTILLER_MODEL,
        max_tokens: 150,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      });

      const rawText: string | null =
        response.content[0].type === "text" ? response.content[0].text.trim() : null;

      if (!rawText) {
        console.error(`[quotesDistiller] Empty response for ${args.emotionalProfileId}`);
        return null;
      }

      const validation = validateQuote(rawText);
      if (!validation.ok) {
        console.error(
          `[quotesDistiller] Quote failed validation for ${args.emotionalProfileId}: ${validation.reason}`
        );
        return null;
      }

      const quoteId = await ctx.runMutation(internal.dailyQuotes.store, {
        emotionalProfileId: args.emotionalProfileId,
        date: args.date,
        type: "session",
        text: rawText,
        sessionContextIds: context.sessionIds as any,
      });

      console.log(
        `[quotesDistiller] Stored session-derived quote ${quoteId} for ${args.emotionalProfileId} (${args.date})`
      );
      return rawText;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[quotesDistiller] Failed for ${args.emotionalProfileId}: ${message}`
      );
      return null;
    }
}

export const generateForUser = internalAction({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    date: v.string(),
    preferredThemes: v.array(v.string()),
  },
  handler: (ctx, args) => distillQuoteForUser(ctx, args),
});
