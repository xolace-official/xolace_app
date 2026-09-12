import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { posthog } from "../../posthog";
import { ACTIVE_STATUSES } from "../../followUps";
import { INACTIVE_THRESHOLD_MS } from "../../jobs/notificationTriggers";

/**
 * kindling_ready notification (docs/paths-v1.md §10; #335). Called only after
 * `generateDb.write` has landed the kindling — there is no "being generated"
 * notification. Single voice, no variant selection.
 *
 * Reuses the existing suppression rules: 30-day dormancy and an active
 * escalation (an unresolved `follow_up_cards` row born from an
 * escalation-derived session) both suppress it, logged the same way every
 * other nudge logs a suppression. `notifications.schedule` routes this type
 * through its own `kindlingReady` rate-limit bucket (see `lib/rateLimits.ts`)
 * rather than the shared `notification` bucket, so an unrelated gentle_return
 * / pattern_nudge / milestone push earlier in the day can never silently
 * swallow it.
 */

const CONTENT = "Your kindling is ready — a few small things picked for you.";

export const notifyReady = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    pathId: v.id("paths"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const profile = await ctx.db.get("emotional_profiles", args.emotionalProfileId);

    const dormant =
      !!profile?.lastSessionAt && now - profile.lastSessionAt > INACTIVE_THRESHOLD_MS;

    let escalationActive = false;
    if (!dormant) {
      for (const status of ACTIVE_STATUSES) {
        const card = await ctx.db
          .query("follow_up_cards")
          .withIndex("by_profile_status", (q) =>
            q.eq("emotionalProfileId", args.emotionalProfileId).eq("status", status),
          )
          .order("desc")
          .first();
        if (card?.escalationDerived) {
          escalationActive = true;
          break;
        }
      }
    }

    const reason = dormant ? "user_inactive" : escalationActive ? "escalation_active" : null;

    if (reason) {
      await ctx.db.insert("notification_log", {
        emotionalProfileId: args.emotionalProfileId,
        type: "kindling_ready",
        content: CONTENT,
        triggerReason: "kindling_generated",
        delivered: false,
        suppressedReason: reason,
        scheduledFor: now,
        createdAt: now,
      });
      return null;
    }

    await ctx.runMutation(internal.notifications.schedule, {
      emotionalProfileId: args.emotionalProfileId,
      type: "kindling_ready",
      content: CONTENT,
      triggerReason: "kindling_generated",
      scheduledFor: now,
    });

    await posthog.capture(ctx, {
      distinctId: args.emotionalProfileId,
      event: "path_notified",
      properties: { pathId: args.pathId },
    });
    return null;
  },
});
