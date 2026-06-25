/**
 * Dev-only helpers for manual testing. Every function is gated on the
 * DEV_TOOLS_ENABLED env var so these are inert on production — set it
 * with `bunx convex env set DEV_TOOLS_ENABLED true` on the dev deployment.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { WorkflowId } from "@convex-dev/workflow";
import { requireAuth } from "./lib/auth";

function assertDevToolsEnabled() {
  if (process.env.DEV_TOOLS_ENABLED !== "true") {
    throw new Error("Dev tools are disabled on this deployment");
  }
}

/**
 * Force the caller's streak for testing the streak calendar reveal.
 * `bump` adds a day (simulates a new calendar day without waiting);
 * `reset` puts the profile back to day 1.
 *
 * Streak is denormalized on emotional_profiles — deleting session rows
 * never recomputes it, which is why this mutation exists.
 */
export const setStreak = mutation({
  args: { mode: v.union(v.literal("bump"), v.literal("reset")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    assertDevToolsEnabled();
    const { profile } = await requireAuth(ctx);

    const newStreak = args.mode === "bump" ? profile.currentStreak + 1 : 1;
    await ctx.db.patch(profile._id, {
      currentStreak: newStreak,
      // Keep the user in the "active" variant (streak window is 48h)
      lastSessionAt: Date.now(),
      // computeUserVariant needs sessionCount > 0 to show the calendar
      sessionCount: Math.max(profile.sessionCount, 1),
    });
    return newStreak;
  },
});

/**
 * Seed a `ready` follow-up card for the caller so the check-in sheet can be
 * QA'd in the simulator without waiting for a real workflow ladder. Clears any
 * existing active cards first for a clean run. The workflowId is a placeholder
 * (the read path — sheet render, markShown, resolve — never touches it).
 */
export const seedFollowUpCard = mutation({
  args: {
    tier: v.union(
      v.literal("acute"),
      v.literal("elevated"),
      v.literal("standard"),
    ),
    escalationDerived: v.optional(v.boolean()),
    cardText: v.optional(v.string()),
  },
  returns: v.id("follow_up_cards"),
  handler: async (ctx, args) => {
    assertDevToolsEnabled();
    const { profile } = await requireAuth(ctx);

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profile._id),
      )
      .order("desc")
      .first();
    if (!session) {
      throw new Error("No session to attach a follow-up card to — process one moment first.");
    }

    // Clear existing active cards so QA always shows exactly this one.
    for (const status of ["pending", "ready", "shown"] as const) {
      const existing = await ctx.db
        .query("follow_up_cards")
        .withIndex("by_profile_status", (q) =>
          q.eq("emotionalProfileId", profile._id).eq("status", status),
        )
        .collect();
      for (const c of existing) await ctx.db.delete(c._id);
    }

    const defaultText =
      args.tier === "acute"
        ? "Just checking in on you. We're here, no rush."
        : "A couple of days ago you let something heavy out here. How's it sitting now?";

    return await ctx.db.insert("follow_up_cards", {
      emotionalProfileId: profile._id,
      sessionId: session._id,
      workflowId: `qa-seed-${Date.now()}` as WorkflowId,
      tier: args.tier,
      cardText: args.cardText ?? defaultText,
      escalationDerived: args.escalationDerived ?? args.tier === "acute",
      status: "ready",
      createdAt: Date.now(),
    });
  },
});
