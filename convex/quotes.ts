import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { Id } from "./_generated/dataModel";

export const THEME_SLUGS = [
  "resilience",
  "self-compassion",
  "relationships",
  "grief-and-loss",
  "change",
  "anxiety",
  "identity",
  "loneliness",
  "healing",
  "acceptance",
  "purpose",
  "self-worth",
  "burnout",
  "hope",
  "growth",
  "fear",
  "motivation",
  "inspiration",
] as const;

/**
 * Pick a curated quote for a user today.
 * Respects theme preferences and avoids already-shown IDs.
 * Falls back to any quote if nothing matches preferences.
 */
export const pickCuratedQuote = internalQuery({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    themes: v.array(v.string()),
    shownQuoteIds: v.array(v.id("quotes")),
  },
  handler: async (ctx, args) => {
    const shownSet = new Set<string>(args.shownQuoteIds);
    const allQuotes = await ctx.db.query("quotes").collect();

    // Try preference-matching quotes first
    if (args.themes.length > 0) {
      const matching = allQuotes.filter(
        (q) =>
          !shownSet.has(q._id) &&
          q.themes.some((t) => args.themes.includes(t))
      );
      if (matching.length > 0) {
        return matching[Math.floor(Math.random() * matching.length)];
      }
    }

    // Fallback: any unseen quote
    const unseen = allQuotes.filter((q) => !shownSet.has(q._id));
    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)];
    }

    // All quotes seen — pick random (reset cycle)
    if (allQuotes.length > 0) {
      return allQuotes[Math.floor(Math.random() * allQuotes.length)];
    }

    return null;
  },
});

/**
 * Get total count of quotes in library (for health checks).
 */
export const count = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("quotes").take(1000);
    return all.length;
  },
});

/**
 * Seed the quote library. Idempotent — skips if count ≥ minCount.
 * Run this once on prod deployment before enabling the cron.
 */
export const seed = internalMutation({
  args: {
    quotes: v.array(
      v.object({
        text: v.string(),
        themes: v.array(v.string()),
        source: v.optional(v.string()),
        language: v.optional(v.string()),
      })
    ),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.force) {
      const existing = await ctx.db.query("quotes").take(1);
      if (existing.length > 0) {
        console.log("[quotes:seed] Library not empty, skipping. Pass force=true to override.");
        return { skipped: true };
      }
    }

    let inserted = 0;
    for (const q of args.quotes) {
      await ctx.db.insert("quotes", {
        text: q.text,
        themes: q.themes,
        source: q.source,
        language: q.language ?? "en",
      });
      inserted++;
    }
    console.log(`[quotes:seed] Inserted ${inserted} quotes.`);
    return { inserted };
  },
});
