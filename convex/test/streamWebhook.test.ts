// @vitest-environment edge-runtime
/**
 * The `message.new` webhook seam (#344): what a signed Stream event schedules.
 * Both scheduled callees are stubbed to no-ops — the push would ask Stream for
 * an unread count and the moderation job would call the model — so the
 * assertions read the scheduler at the enqueue boundary.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedConversation } from "./fixtures.helpers";
import { scheduledCalls } from "./fixtures.helpers";
import { asNewUser } from "./harness.helpers";
import { aggregatesMock, noopJob } from "./mocks.helpers";

vi.mock("../lib/aggregates", () => aggregatesMock());
vi.mock("../chatNotifications", () => ({ sendMessagePush: noopJob(), send: noopJob() }));
vi.mock("../ai/chat/moderate", async (orig) => ({
  ...(await orig<typeof import("../ai/chat/moderate")>()),
  moderateChatMessage: noopJob(),
}));

const SECRET = "test-stream-secret";

async function sign(body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

beforeEach(() => {
  process.env.STREAM_API_KEY = "test-key";
  process.env.STREAM_API_SECRET = SECRET;
  process.env.XOLACER_CHAT_ENABLED = "true";
});

async function setup() {
  const user = await asNewUser();
  // Both seats are this user — the row is the seam, identity is not under test.
  const conversationId = await seedConversation(user.root, user.profileId);
  await user.root.run(async (ctx) => {
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", user.profileId))
      .unique();
    await ctx.db.patch("preferences", prefs!._id, {
      notifications: { ...prefs!.notifications, enabled: true },
    });
  });
  const deliver = async (
    message: { id: string; text: string; kind?: string },
    webhookId = "wh_1",
  ) => {
    const body = JSON.stringify({
      type: "message.new",
      channel_id: `xolacer_${conversationId}`,
      user: { id: user.profileId },
      message,
    });
    return user.root.fetch("/webhooks/stream", {
      method: "POST",
      headers: { "x-signature": await sign(body), "x-webhook-id": webhookId },
      body,
    });
  };
  return { user, conversationId, deliver };
}

describe("streamEvents", () => {
  it("a message schedules the push and then the moderation job with the message, not the payload", async () => {
    const { user, conversationId, deliver } = await setup();
    const response = await deliver({ id: "msg_1", text: "i really can't do this anymore" });
    expect(response.status).toBe(200);

    const calls = await scheduledCalls(user.root);
    expect(calls.map((c) => c.name)).toEqual([
      "chatNotifications:sendMessagePush",
      "ai/chat/moderate:moderateChatMessage",
    ]);
    expect(calls[1].args).toEqual({
      conversationId,
      senderRole: "user",
      streamChannelId: `xolacer_${conversationId}`,
      streamMessageId: "msg_1",
      text: "i really can't do this anymore",
    });
  });

  it("a one-word message is pushed but never moderated", async () => {
    const { user, deliver } = await setup();
    await deliver({ id: "msg_1", text: "thanks" });
    const calls = await scheduledCalls(user.root);
    expect(calls.map((c) => c.name)).toEqual(["chatNotifications:sendMessagePush"]);
  });

  it("a redelivered webhook id schedules no second moderation job", async () => {
    const { user, deliver } = await setup();
    await deliver({ id: "msg_1", text: "i really can't do this anymore" }, "wh_1");
    await deliver({ id: "msg_1", text: "i really can't do this anymore" }, "wh_1");
    const calls = await scheduledCalls(user.root);
    expect(calls.filter((c) => c.name.endsWith("moderateChatMessage"))).toHaveLength(1);
  });

  it("our own resources card is neither counted, pushed, nor moderated", async () => {
    const { user, conversationId, deliver } = await setup();
    await deliver({ id: "sys_1", text: "Support is available", kind: "crisis_resources" });
    expect(await scheduledCalls(user.root)).toEqual([]);
    const row = await user.root.run((ctx) => ctx.db.get("xolacer_conversations", conversationId));
    expect(row?.messageCount ?? 0).toBe(0);
  });
});
