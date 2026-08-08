import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  chatNotificationContent,
  chatNotificationsAllowed,
} from "./lib/chatNotifications";
import { pushNotifications } from "./lib/pushNotifications";

/**
 * The transactional dispatch path for conversation notifications, beside the
 * AI-nudge scheduler in `notifications.ts` rather than inside it.
 *
 * Deliberately does not apply:
 * - the **Quiet Window** — a person waiting on you is not a 9am-appropriate touch,
 * - the **nudge rate bucket** — a busy chat day must not silence the AI's own reaching out,
 * - a **`notification_log` row** — that table is the nudge analytics surface, and
 *   four transactional types in its union would distort every read of it.
 *
 * It does honour the notification master switch and the chat preference.
 *
 * Because no log row exists, the payload carries `conversationId` instead of a
 * log id; the client's tap handler branches on the type rather than marking a
 * row.
 *
 * Scheduled with `runAfter(0)` from the lifecycle mutations rather than called
 * inline: a push that fails must not roll back the request that earned it.
 */
export const send = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    type: v.union(
      v.literal("chat_request"),
      v.literal("chat_accepted"),
      v.literal("chat_declined"),
      v.literal("chat_message"),
    ),
    // The recipient's counterpart, named by the caller exactly as the recipient
    // already sees them elsewhere — this path never resolves an identity of its
    // own. Absent for a decline, which names nobody.
    counterpartName: v.optional(v.string()),
    conversationId: v.id("xolacer_conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", args.emotionalProfileId),
      )
      .unique();

    if (!chatNotificationsAllowed(preferences?.notifications)) return null;

    const { title, body } = chatNotificationContent(
      args.type,
      args.counterpartName,
    );

    // allowUnregisteredTokens: the recipient may have preferences on and no
    // token yet (never opened the app on a physical device).
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.emotionalProfileId,
      notification: {
        title,
        body,
        sound: "default",
        data: { type: args.type, conversationId: args.conversationId },
      },
      allowUnregisteredTokens: true,
    });

    return null;
  },
});
