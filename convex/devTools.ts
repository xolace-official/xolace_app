/**
 * Dev-only helpers for manual testing. Every function is gated on the
 * DEV_TOOLS_ENABLED env var so these are inert on production — set it
 * with `bunx convex env set DEV_TOOLS_ENABLED true` on the dev deployment.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
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
