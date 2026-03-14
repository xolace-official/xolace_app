import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { requireSessionOwnership } from "./lib/auth";
import { triggerTypeValidator, actionTakenValidator } from "./lib/validators";

/**
 * AI creates an escalation event when safety signals are detected.
 * Enforces triggerEvidence policy: ONLY model confidence categories
 * and trigger type descriptions. NEVER paraphrased user language.
 */
export const create = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    sessionId: v.id("sessions"),
    triggerType: triggerTypeValidator,
    triggerConfidence: v.number(),
    triggerEvidence: v.string(),
    actionTaken: actionTakenValidator,
    resourcesPresented: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Create the escalation event
    const eventId = await ctx.db.insert("escalation_events", {
      emotionalProfileId: args.emotionalProfileId,
      sessionId: args.sessionId,
      triggerType: args.triggerType,
      triggerConfidence: args.triggerConfidence,
      triggerEvidence: args.triggerEvidence,
      actionTaken: args.actionTaken,
      resourcesPresented: args.resourcesPresented,
      reviewedByHuman: false,
      createdAt: Date.now(),
    });

    // Mark the session as having triggered escalation
    await ctx.db.patch(args.sessionId, {
      escalationTriggered: true,
      updatedAt: Date.now(),
    });

    return eventId;
  },
});

/**
 * Record how the user responded to an escalation.
 */
export const recordUserResponse = mutation({
  args: {
    sessionId: v.id("sessions"),
    userResponse: v.union(
      v.literal("engaged"),
      v.literal("dismissed"),
      v.literal("no_response")
    ),
  },
  handler: async (ctx, args) => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    // Find the escalation event for this session
    const event = await ctx.db
      .query("escalation_events")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", session.emotionalProfileId)
      )
      .order("desc")
      .first();

    if (!event || event.sessionId !== args.sessionId) {
      throw new Error("No escalation event found for this session");
    }

    await ctx.db.patch(event._id, {
      userResponse: args.userResponse,
    });

    return null;
  },
});
