// V8 runtime — Anthropic SDK uses fetch, no Node built-ins needed.

import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAnthropicClient } from "./providers/anthropic";

const DISTILLER_MODEL = "claude-haiku-4-5-20251001";

// Regex: flag capitalized mid-sentence words that look like proper nouns
const PROPER_NOUN_RE = /(?<!\. |\? |! |^)[A-Z][a-z]{2,}/g;

// Short medical/clinical term blocklist — keeps quotes shareable
const MEDICAL_BLOCKLIST = [
  "depression",
  "anxiety disorder",
  "PTSD",
  "bipolar",
  "schizophrenia",
  "diagnosis",
  "disorder",
  "symptom",
  "therapy",
  "medication",
  "prescribed",
];

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
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get recent completed sessions
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q
          .eq("emotionalProfileId", args.emotionalProfileId)
          .gte("createdAt", sevenDaysAgo)
      )
      .order("desc")
      .filter((q) => q.eq(q.field("state"), "completed"))
      .take(3);

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
          primaryEmotion: metadata.primaryEmotion,
          granularLabel: metadata.granularLabel,
          thematicTags: metadata.thematicTags,
          intensity: metadata.intensity,
        });
      }
    }

    return contextItems.length > 0
      ? { sessions: contextItems, sessionIds: recentSessions.map((s) => s._id) }
      : null;
  },
});

/**
 * Generate a session-derived quote for one user.
 * Called per-user by the nightly cron batch processor.
 */
type EmotionalContext = {
  sessions: {
    sessionId: string;
    primaryEmotion: string;
    granularLabel?: string;
    thematicTags: string[];
    intensity: number;
    }[];
  sessionIds: string[];
} | null;

export const generateForUser = internalAction({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    date: v.string(),
    preferredThemes: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    try {
      const context = (await ctx.runQuery(
        internal.ai.quotesDistiller.loadEmotionalContext,
        { emotionalProfileId: args.emotionalProfileId }
      )) as EmotionalContext;

      if (!context) {
        console.log(
          `[quotesDistiller] No recent sessions for ${args.emotionalProfileId}, skipping session-derived quote`
        );
        return null;
      }

      const emotionalSummary: string = context.sessions
        .map((s: NonNullable<EmotionalContext>["sessions"][number]) => {
          const label = s.granularLabel ?? s.primaryEmotion;
          const tags = s.thematicTags.length > 0 ? ` (${s.thematicTags.join(", ")})` : "";
          return `- ${label}, intensity ${s.intensity}/10${tags}`;
        })
        .join("\n");

      const systemPrompt = `You are given the emotional themes from a user's recent reflections. Generate one beautiful, honest sentence (or two short sentences); more like a quote that captures the emotional experience without being specific. It should feel like something a thoughtful writer found for themselves and wanted to keep.

Rules:
- 1-2 sentences maximum
- Poetic but grounded — not therapy-speak.
- Second person ("You've been carrying something...") or first person ("There's a weight I'm starting to name.")
- No specific details from the session (the quote will be shared publicly)
- No platitudes ("Everything happens for a reason", "You've got this")
- No medical or clinical terminology
- Must be able to stand alone without any context
- Pass the "would someone screenshot this?" test`;

      const themesLine =
        args.preferredThemes.length > 0
          ? `\nUser's preferred themes (let the quote naturally align with one if fitting): ${args.preferredThemes.join(", ")}`
          : "";

      const userPrompt: string = `Recent emotional themes:\n${emotionalSummary}${themesLine}\n\nGenerate a quote:`;

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
          `[quotesDistiller] Quote failed validation for ${args.emotionalProfileId}: ${validation.reason} — "${rawText}"`
        );
        return null;
      }

      await ctx.runMutation(internal.dailyQuotes.store, {
        emotionalProfileId: args.emotionalProfileId,
        date: args.date,
        type: "session",
        text: rawText,
        sessionContextIds: context.sessionIds as any,
      });

      console.log(
        `[quotesDistiller] Stored session-derived quote for ${args.emotionalProfileId}: "${rawText.substring(0, 60)}..."`
      );
      return rawText;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[quotesDistiller] Failed for ${args.emotionalProfileId}: ${message}`
      );
      return null;
    }
  },
});
