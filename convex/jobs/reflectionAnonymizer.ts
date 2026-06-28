import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Load session + its metadata for anonymization.
 * Queries metadata by sessionId (1:1) to avoid picking up a different session's data.
 */
export const loadSessionForAnonymize = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    return { session, metadata };
  },
});

/**
 * Contribute a session's distilled reflection into the anonymous pool.
 * Called after session completion when user chose to contribute.
 *
 * Uses the pre-generated distilledText (voice-preserving, first-person).
 * Falls back to mirrorText if distillation wasn't generated or returned NULL.
 */
export const anonymize = internalAction({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runQuery(
      internal.jobs.reflectionAnonymizer.loadSessionForAnonymize,
      { sessionId: args.sessionId }
    );
    if (!result) return;

    const { session, metadata } = result;
    if (session.kept !== true) return;
    if (!metadata) return;

    // Safety gate: crisis sessions must never enter the anonymous pool.
    if (session.safeguardLevel === "crisis") return;

    // Prefer distilled text (first-person, voice-preserving)
    // Fall back to mirror text (second-person, AI voice)
    const displayText =
      (session as { distilledText?: string }).distilledText ??
      (session as { mirrorText?: string }).mirrorText;
    if (!displayText) return;

    await ctx.runMutation(internal.reflections.contribute, {
      displayText,
      primaryEmotion: metadata.primaryEmotion,
      granularLabel: metadata.granularLabel,
      thematicTags: metadata.thematicTags,
      intensity: metadata.intensity,
    });
  },
});
