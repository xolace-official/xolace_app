import { describe, expect, it } from "bun:test";
import {
  chatNotificationContent,
  chatNotificationRoute,
  chatNotificationsAllowed,
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

  it("routes a request to the chats list", () => {
    expect(chatNotificationRoute("chat_request")).toBe("/connect");
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
