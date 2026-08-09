import { describe, it, expect } from "bun:test";
import { chatNotificationsAllowed } from "@/convex/lib/chatNotifications";
import {
  chatChoice,
  gentleChoice,
  gentleRemindersOn,
  nextNotificationPrefs,
  type NotificationPrefs,
} from "@/src/features/settings/notification-prefs";

const prefs = (partial: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  enabled: true,
  gentleReturn: true,
  patternNudge: true,
  milestone: true,
  ...partial,
});

/** All off: what a user who has never granted permission looks like. */
const allOff = prefs({ enabled: false, gentleReturn: false, patternNudge: false, milestone: false });

describe("gentleRemindersOn", () => {
  it("follows the nudge preference under the master", () => {
    expect(gentleRemindersOn(prefs())).toBe(true);
    expect(gentleRemindersOn(prefs({ gentleReturn: false }))).toBe(false);
    expect(gentleRemindersOn(prefs({ enabled: false }))).toBe(false);
    expect(gentleRemindersOn(undefined)).toBe(false);
  });
});

describe("stored choice vs delivered state", () => {
  it("keeps chat's absent-means-enabled default while the master is off", () => {
    expect(chatNotificationsAllowed(allOff)).toBe(false); // delivers nothing
    expect(chatChoice(allOff)).toBe(true); // but was never muted
  });

  it("remembers an explicit mute through a master that is off", () => {
    expect(chatChoice(prefs({ enabled: false, chat: false }))).toBe(false);
  });

  it("does not invent a gentle preference the user never set", () => {
    expect(gentleChoice(allOff)).toBe(false);
    expect(gentleChoice(prefs())).toBe(true);
    expect(gentleChoice(undefined)).toBe(false);
  });
});

describe("nextNotificationPrefs", () => {
  it("keeps the master on while either family wants delivery", () => {
    expect(nextNotificationPrefs(prefs(), { gentle: false, chat: true }).enabled).toBe(true);
    expect(nextNotificationPrefs(prefs(), { gentle: true, chat: false }).enabled).toBe(true);
    expect(nextNotificationPrefs(prefs(), { gentle: false, chat: false }).enabled).toBe(false);
  });

  it("mutes chat without touching the AI nudges", () => {
    const next = nextNotificationPrefs(prefs(), { gentle: true, chat: false });
    expect(next.chat).toBe(false);
    expect(next.gentleReturn).toBe(true);
    expect(next.patternNudge).toBe(true);
    expect(next.milestone).toBe(true);
  });

  it("mutes the AI nudges without touching chat", () => {
    const next = nextNotificationPrefs(prefs(), { gentle: false, chat: true });
    expect(next.chat).toBe(true);
    expect(next.gentleReturn).toBe(false);
    expect(next.patternNudge).toBe(false);
    expect(next.milestone).toBe(false);
  });

  it("round-trips through the read helpers", () => {
    for (const gentle of [true, false]) {
      for (const chat of [true, false]) {
        const next = nextNotificationPrefs(prefs(), { gentle, chat });
        expect(gentleRemindersOn(next)).toBe(gentle);
        expect(chatNotificationsAllowed(next)).toBe(chat);
      }
    }
  });

  it("preserves the reach and quiet window the user already chose", () => {
    const current = prefs({
      reach: "quiet",
      quietWindow: { dontReachBefore: 8, dontReachAfter: 21 },
      timezone: "Africa/Accra",
    });
    const next = nextNotificationPrefs(current, { gentle: false, chat: true });
    expect(next.reach).toBe("quiet");
    expect(next.quietWindow).toEqual({ dontReachBefore: 8, dontReachAfter: 21 });
    expect(next.timezone).toBe("Africa/Accra");
  });

  it("defaults reach for a profile that has never set one", () => {
    expect(nextNotificationPrefs(undefined, { gentle: true, chat: true }).reach).toBe("warm");
  });
});

/**
 * The settings screen composes the helpers exactly this way. These cases are
 * the ones a wrong composition gets wrong, so they run against the same shape
 * the hook uses rather than against the pieces alone.
 */
const enableGentle = (p: NotificationPrefs) =>
  nextNotificationPrefs(p, { gentle: true, chat: chatChoice(p) });
const enableChat = (p: NotificationPrefs) =>
  nextNotificationPrefs(p, { gentle: gentleChoice(p), chat: true });

describe("toggling one family from a cold start", () => {
  it("leaves chat on when a fresh user turns on gentle reminders", () => {
    // The whole point of absent-means-enabled: granting permission for one
    // gets the other, without hunting for a setting.
    expect(chatNotificationsAllowed(enableGentle(allOff))).toBe(true);
  });

  it("still respects a chat mute made before everything went quiet", () => {
    const muted = prefs({ enabled: false, gentleReturn: false, patternNudge: false, milestone: false, chat: false });
    expect(chatNotificationsAllowed(enableGentle(muted))).toBe(false);
  });

  it("does not switch on AI nudges when a fresh user turns on chat", () => {
    expect(gentleRemindersOn(enableChat(allOff))).toBe(false);
    expect(chatNotificationsAllowed(enableChat(allOff))).toBe(true);
  });

  it("keeps AI nudges on when chat is re-enabled beside them", () => {
    const chatMuted = prefs({ chat: false });
    expect(gentleRemindersOn(enableChat(chatMuted))).toBe(true);
  });
});
