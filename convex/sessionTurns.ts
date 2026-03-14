import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireSessionOwnership } from "./lib/auth";
import { userFeedbackValidator } from "./lib/validators";

const MAX_TURNS = 2;

/**
 * Submit refinement feedback ("Not quite" / "Say more").
 * Creates a turn, transitions session back to processing, schedules AI.
 */
export const submitFeedback = mutation({
  args: {
    sessionId: v.id("sessions"),
    userFeedback: userFeedbackValidator,
    userInputEncrypted: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    if (session.state !== "mirror_delivered") {
      throw new Error(`Cannot submit feedback in state "${session.state}"`);
    }

    // Check turn count
    const existingTurns = await ctx.db
      .query("session_turns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .take(MAX_TURNS + 1);

    if (existingTurns.length >= MAX_TURNS) {
      throw new Error("Maximum refinement turns reached");
    }

    const turnNumber = existingTurns.length + 1;
    const now = Date.now();

    // Create the turn record (revisedMirrorText will be filled by AI)
    await ctx.db.insert("session_turns", {
      sessionId: args.sessionId,
      turnNumber,
      userFeedback: args.userFeedback,
      userInputEncrypted: args.userInputEncrypted,
      revisedMirrorText: "", // Placeholder until AI delivers
      modelVersion: "",
      createdAt: now,
    });

    // Transition session back to processing
    await ctx.db.patch(args.sessionId, {
      state: "processing",
      updatedAt: now,
    });

    // Schedule AI (mock for Phase 2, real in Phase 3)
    await ctx.scheduler.runAfter(
      2000,
      internal.sessions.deliverMirror,
      {
        sessionId: args.sessionId,
        mirrorText: "I hear you more clearly now. There's something deeper here, and I want you to know that matters.",
        mirrorModelVersion: "mock-v1-refined",
      }
    );

    return null;
  },
});

/**
 * AI delivers the revised mirror text for a turn.
 */
export const deliverRevisedMirror = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    turnNumber: v.number(),
    revisedMirrorText: v.string(),
    modelVersion: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the turn and update it
    const turn = await ctx.db
      .query("session_turns")
      .withIndex("by_session", (q) =>
        q.eq("sessionId", args.sessionId).eq("turnNumber", args.turnNumber)
      )
      .unique();

    if (!turn) {
      throw new Error("Turn not found");
    }

    await ctx.db.patch(turn._id, {
      revisedMirrorText: args.revisedMirrorText,
      modelVersion: args.modelVersion,
    });
  },
});

/**
 * List all turns for a session (with ownership check).
 */
export const listBySession = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await requireSessionOwnership(ctx, args.sessionId);

    return await ctx.db
      .query("session_turns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .take(5);
  },
});
