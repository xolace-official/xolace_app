// V8 runtime — Anthropic SDK uses fetch, no Node built-ins needed.

import { v } from "convex/values";
import { ActionCtx, internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { getAnthropicClient } from "./providers/anthropic";
import { renderSemanticProfile } from "../semanticProfiles";
import { buildQuotePrompt, parseQuoteResponse } from "./quotesPrompt";

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

const RETRY_NUDGE =
  "That attempt did not land — it ran long, drifted into explaining the reader, or was not valid JSON. Write it again: one breath, around 20 words, no interpretation, JSON only.";

function dailyAngleSeed(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, 0, 0));
  const current = new Date(Date.UTC(year, month - 1, day));
  const dayOfYear = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return ANGLE_SEEDS[dayOfYear % ANGLE_SEEDS.length];
}

function validateQuote(text: string): { ok: boolean; reason?: string } {
  if (text.length < 20) return { ok: false, reason: "too short" };
  if (text.length > 200) return { ok: false, reason: "too long" };

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
    referenceDate: v.number(),
  },
  handler: async (ctx, args) => {
    const fiveDaysAgo = args.referenceDate - 5 * 24 * 60 * 60 * 1000;

    // by_profile_state lands the two newest completed sessions in exactly two
    // doc reads; the 5-day cutoff is then a cheap in-memory check on those.
    const recentSessions = (
      await ctx.db
        .query("sessions")
        .withIndex("by_profile_state", (q) =>
          q
            .eq("emotionalProfileId", args.emotionalProfileId)
            .eq("state", "completed")
        )
        .order("desc")
        .take(2)
    ).filter((s) => s.createdAt >= fiveDaysAgo);

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
      const refMs = new Date(args.date + "T00:00:00Z").getTime();

      const [context, recentQuoteTexts, semanticProfileDoc] = await Promise.all([
        ctx.runQuery(internal.ai.quotesDistiller.loadEmotionalContext, {
          emotionalProfileId: args.emotionalProfileId,
          referenceDate: refMs,
        }) as Promise<EmotionalContext>,
        ctx.runQuery(internal.ai.quotesDistiller.loadRecentQuotes, {
          emotionalProfileId: args.emotionalProfileId,
          beforeDate: args.date,
        }) as Promise<string[]>,
        ctx.runQuery(internal.semanticProfiles.getCurrent, {
          emotionalProfileId: args.emotionalProfileId,
        }) as Promise<Doc<"semantic_profiles"> | null>,
      ]);

      if (!context) {
        console.log(
          `[quotesDistiller] No recent sessions for ${args.emotionalProfileId}, skipping session-derived quote`
        );
        return null;
      }

      const angleSeed = dailyAngleSeed(args.date);
      const renderedProfile = semanticProfileDoc
        ? renderSemanticProfile(semanticProfileDoc)
        : null;

      const { systemPrompt, userPrompt } = buildQuotePrompt({
        angleSeed,
        now: refMs,
        sessions: context.sessions,
        renderedProfile,
        preferredThemes: args.preferredThemes,
        recentQuoteTexts,
      });

      const client = getAnthropicClient();

      // Two attempts: the retry nudges the model back toward aphorism shape
      // rather than dropping the user's session quote for the day.
      const prompts = [userPrompt, `${userPrompt}\n\n${RETRY_NUDGE}`];
      let quoteText: string | null = null;

      for (const prompt of prompts) {
        let response;
        try {
          response = await client.messages.create({
            model: DISTILLER_MODEL,
            max_tokens: 400,
            messages: [{ role: "user", content: prompt }],
            system: systemPrompt,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `[quotesDistiller] API call failed for ${args.emotionalProfileId}: ${message}`
          );
          continue;
        }

        const rawText: string | null =
          response.content[0].type === "text" ? response.content[0].text.trim() : null;

        if (!rawText) {
          console.error(`[quotesDistiller] Empty response for ${args.emotionalProfileId}`);
          continue;
        }

        const parsed = parseQuoteResponse(rawText);
        if (!parsed) {
          console.error(
            `[quotesDistiller] Unparseable response for ${args.emotionalProfileId}: ${rawText.slice(0, 160)}`
          );
          continue;
        }

        console.log(
          `[quotesDistiller] Seeds for ${args.emotionalProfileId}: ${parsed.seeds.join(" | ") || "(none)"}`
        );

        const validation = validateQuote(parsed.quote);
        if (!validation.ok) {
          console.error(
            `[quotesDistiller] Quote failed validation for ${args.emotionalProfileId}: ${validation.reason}`
          );
          continue;
        }

        quoteText = parsed.quote;
        break;
      }

      if (!quoteText) return null;

      const quoteId = await ctx.runMutation(internal.dailyQuotes.store, {
        emotionalProfileId: args.emotionalProfileId,
        date: args.date,
        type: "session",
        text: quoteText,
        sessionContextIds: context.sessionIds as any,
      });

      console.log(
        `[quotesDistiller] Stored session-derived quote ${quoteId} for ${args.emotionalProfileId} (${args.date})`
      );
      return quoteText;
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
