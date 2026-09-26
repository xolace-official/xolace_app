import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { recordActivity } from "./lib/activityLog";

// Manual-invocation entry point for recordActivity — no production call sites
// route through here yet (#432). Demo via the Convex dashboard:
//   bunx convex run streaks:recordActivity '{"emotionalProfileId": "...", "actionType": "reflect"}'
export const recordActivityManual = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    actionType: v.union(
      v.literal("reflect"),
      v.literal("vent"),
      v.literal("library"),
      v.literal("sit_with_this"),
      v.literal("daily_mood"),
      v.literal("quotes"),
    ),
    timestamp: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await recordActivity(ctx, args);
    return null;
  },
});
