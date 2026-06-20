import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./lib/rateLimits";

const MAX_LENGTH = 1000;

/**
 * Whether the current user can still submit product feedback (rate-limit check
 * without consuming a token). Mirrors `feedback.canSubmitGeneral`.
 */
export const canSubmit = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const { ok } = await rateLimiter.check(ctx, "productFeedback", {
      key: profile._id,
    });
    return ok;
  },
});

/**
 * Submit a bug report or idea from the feedback tray.
 *
 * The owner scope is derived server-side from the authenticated identity —
 * never accepted from the client. Text is trimmed + length-bounded and the
 * submission is rate-limited regardless of any client-side validation.
 */
export const submit = mutation({
  args: {
    kind: v.union(v.literal("bug"), v.literal("idea")),
    text: v.string(),
    context: v.object({
      appVersion: v.string(),
      route: v.string(),
      themeName: v.string(),
      platform: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const { ok } = await rateLimiter.limit(ctx, "productFeedback", {
      key: profile._id,
    });
    if (!ok) {
      throw new Error("You're sending feedback too fast. Try again shortly.");
    }

    const text = args.text.trim();
    if (text.length === 0 || text.length > MAX_LENGTH) {
      throw new Error("Feedback text must be 1–1000 characters.");
    }

    await ctx.db.insert("product_feedback", {
      emotionalProfileId: profile._id,
      kind: args.kind,
      text,
      context: args.context,
      createdAt: Date.now(),
    });

    return null;
  },
});
