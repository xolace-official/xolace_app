import { describe, expect, it } from "bun:test";
import {
  chatNotificationContent,
  chatNotificationRoute,
  chatNotificationsAllowed,
  conversationIdFromChannelId,
  isChatNotificationType,
  MESSAGE_NOTIFICATION_WINDOW_MS,
  messageNotificationRecipient,
  messageNotificationSuppressed,
  xolacerChannelId,
} from "./chatNotifications";

describe("chatNotificationContent", () => {
  it("puts the counterpart's pseudonym in the title, not the body", () => {
    const content = chatNotificationContent("chat_request", "Camper 4F2A");
    expect(content.title).toBe("Camper 4F2A");
    expect(content.body).not.toContain("Camper 4F2A");
  });

  // The same words the chats list shows for this row, so a xolacer reads the
  // notification and the list entry as one event.
  it("reuses the chats-list wording for a request", () => {
    expect(chatNotificationContent("chat_request", "Camper 4F2A").body).toBe(
      "Wants to talk, accept when you have space",
    );
  });

  it("says nothing beyond the pseudonym about who is asking", () => {
    const content = chatNotificationContent("chat_request", "Camper 9B10");
    expect(`${content.title} ${content.body}`).toBe(
      "Camper 9B10 Wants to talk, accept when you have space",
    );
  });

  // A seeker knows their xolacer by display name, never by a pseudonym — the
  // caller passes whichever name the recipient already sees elsewhere.
  it("titles an accept with the xolacer's name", () => {
    const content = chatNotificationContent("chat_accepted", "River");
    expect(content.title).toBe("River");
    expect(content.body).toBe("Has space for you, your conversation is open");
  });

  // The exception to pseudonym-as-title: being turned down should not be the
  // loudest thing on a lock screen, and the copy ends on an option. The name
  // is not sent at all, so this holds however the caller is written.
  it("keeps Xolace as the title for a decline and names nobody", () => {
    const content = chatNotificationContent("chat_declined");
    expect(content.title).toBe("Xolace");
    expect(content.body).toBe(
      "That conversation didn't open. Other xolacers are available.",
    );
    expect(chatNotificationContent("chat_declined", "Camper 4F2A")).toEqual(
      content,
    );
  });

  it("titles a message with the sender's name and says only that one arrived", () => {
    const content = chatNotificationContent("chat_message", "Camper 4F2A");
    expect(content.title).toBe("Camper 4F2A");
    expect(content.body).toBe("Sent you a message");
  });

  // The whole point of the body being a constant: no branch of this function
  // can ever be handed something the sender wrote.
  it("carries no message content, whatever it is passed", () => {
    expect(chatNotificationContent("chat_message", "River").body).toBe(
      chatNotificationContent("chat_message", "Camper 9B10").body,
    );
  });
});

describe("chatNotificationRoute", () => {
  const conversationId = "k17abc";
  const tappedAt = 1_754_600_000_000;

  // A xolacer who was browsing the roster has `selected` stuck there, so the
  // segment has to be named rather than left to the tab's auto-select.
  it("routes a request to the chats list", () => {
    expect(
      chatNotificationRoute("chat_request", conversationId, tappedAt),
    ).toEqual({
      pathname: "/connect",
      params: { view: "chats", t: String(tappedAt) },
    });
  });

  it("routes an accept into the conversation thread", () => {
    expect(
      chatNotificationRoute("chat_accepted", conversationId, tappedAt),
    ).toEqual({
      pathname: "/chat/[conversationId]",
      params: { conversationId },
    });
  });

  it("routes a message into the conversation thread", () => {
    expect(
      chatNotificationRoute("chat_message", conversationId, tappedAt),
    ).toEqual({
      pathname: "/chat/[conversationId]",
      params: { conversationId },
    });
  });

  // The seeker owns the declined row, so a bare /connect would auto-select
  // Chats and land them back on the dead conversation.
  it("routes a decline to the roster, not the dead conversation", () => {
    const route = chatNotificationRoute(
      "chat_declined",
      conversationId,
      tappedAt,
    );
    expect(route).toEqual({
      pathname: "/connect",
      params: { view: "xolacers", t: String(tappedAt) },
    });
    expect(JSON.stringify(route)).not.toContain(conversationId);
  });

  // Two taps must be two arrivals: the Connect tab stays mounted and compares
  // params, so identical ones read as no navigation.
  it("distinguishes a second tap from the first", () => {
    const first = chatNotificationRoute("chat_declined", conversationId, 1);
    const second = chatNotificationRoute("chat_declined", conversationId, 2);
    expect(first.params.t).not.toBe(second.params.t);
  });
});

describe("isChatNotificationType", () => {
  it("accepts the conversation types", () => {
    expect(isChatNotificationType("chat_request")).toBe(true);
    expect(isChatNotificationType("chat_accepted")).toBe(true);
    expect(isChatNotificationType("chat_declined")).toBe(true);
    expect(isChatNotificationType("chat_message")).toBe(true);
  });

  // The nudge types share the `data.type` field and must not route here.
  it("rejects nudge types and junk", () => {
    expect(isChatNotificationType("gentle_return")).toBe(false);
    expect(isChatNotificationType(undefined)).toBe(false);
  });
});

describe("chatNotificationsAllowed", () => {
  // Absent is the shape of every preferences row written before the chat
  // preference existed; those users must still be reachable.
  it("allows when the chat preference is absent", () => {
    expect(chatNotificationsAllowed({ enabled: true })).toBe(true);
  });

  it("allows when the chat preference is explicitly true", () => {
    expect(chatNotificationsAllowed({ enabled: true, chat: true })).toBe(true);
  });

  it("suppresses when the chat preference is explicitly false", () => {
    expect(chatNotificationsAllowed({ enabled: true, chat: false })).toBe(false);
  });

  // The master switch means what it says, whatever the chat toggle reads.
  it("suppresses when the master switch is off", () => {
    expect(chatNotificationsAllowed({ enabled: false, chat: true })).toBe(false);
  });

  it("suppresses when there is no preferences row", () => {
    expect(chatNotificationsAllowed(null)).toBe(false);
    expect(chatNotificationsAllowed(undefined)).toBe(false);
  });
});

describe("conversationIdFromChannelId", () => {
  const conversationId = "k17abc";

  it("round-trips the id the accept path writes", () => {
    expect(conversationIdFromChannelId(xolacerChannelId(conversationId))).toBe(
      conversationId,
    );
  });

  // The webhook is a public endpoint; every one of these is something a
  // forged or off-product payload can put in the channel_id field.
  it("drops anything that is not one of our channel ids", () => {
    expect(conversationIdFromChannelId("messaging:xolacer_k17abc")).toBeNull();
    expect(conversationIdFromChannelId("support_k17abc")).toBeNull();
    expect(conversationIdFromChannelId("xolacer_")).toBeNull();
    expect(conversationIdFromChannelId("")).toBeNull();
    expect(conversationIdFromChannelId(undefined)).toBeNull();
    expect(conversationIdFromChannelId(42)).toBeNull();
  });
});

describe("messageNotificationRecipient", () => {
  const conversation = {
    userProfileId: "seeker1",
    xolacerProfileId: "xolacer1",
  };

  it("notifies the xolacer when the seeker sent it", () => {
    expect(messageNotificationRecipient(conversation, "seeker1")).toBe(
      "xolacer1",
    );
  });

  it("notifies the seeker when the xolacer sent it", () => {
    expect(messageNotificationRecipient(conversation, "xolacer1")).toBe(
      "seeker1",
    );
  });

  // Sender-exclusion is not a check anywhere — it falls out of resolving the
  // recipient as "the participant who is not them".
  it("never resolves to the sender", () => {
    for (const sender of ["seeker1", "xolacer1"]) {
      expect(messageNotificationRecipient(conversation, sender)).not.toBe(
        sender,
      );
    }
  });

  // The forged-payload case: a stranger named as the sender addresses nobody,
  // rather than addressing whichever participant happens to be listed first.
  it("drops a sender who is not on this row", () => {
    expect(messageNotificationRecipient(conversation, "stranger")).toBeNull();
    expect(messageNotificationRecipient(conversation, undefined)).toBeNull();
  });
});

describe("messageNotificationSuppressed", () => {
  const now = 1_754_600_000_000;

  it("lets the first message in a conversation through", () => {
    expect(messageNotificationSuppressed(undefined, now)).toBe(false);
  });

  it("suppresses a burst inside the window", () => {
    expect(messageNotificationSuppressed(now, now)).toBe(true);
    expect(messageNotificationSuppressed(now - 1_000, now)).toBe(true);
    expect(
      messageNotificationSuppressed(
        now - (MESSAGE_NOTIFICATION_WINDOW_MS - 1),
        now,
      ),
    ).toBe(true);
  });

  it("notifies again once the window has passed", () => {
    expect(
      messageNotificationSuppressed(now - MESSAGE_NOTIFICATION_WINDOW_MS, now),
    ).toBe(false);
    expect(
      messageNotificationSuppressed(
        now - MESSAGE_NOTIFICATION_WINDOW_MS - 1,
        now,
      ),
    ).toBe(false);
  });

  // Keyed on the conversation: a second conversation carries its own stamp, so
  // a chatty thread can never hide a different person entirely.
  it("is per-conversation, so a quiet thread is unaffected by a loud one", () => {
    const loud = now - 1_000;
    const quiet = undefined;
    expect(messageNotificationSuppressed(loud, now)).toBe(true);
    expect(messageNotificationSuppressed(quiet, now)).toBe(false);
  });
});
