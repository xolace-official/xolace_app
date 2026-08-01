import { describe, expect, it } from "bun:test";
import { canRate, isBlocked, planBlock } from "./conversationBlock";

describe("planBlock", () => {
  // status | channel → noop, channel to freeze
  const cases: Array<{
    status: "requested" | "open" | "resting" | "closed";
    channel?: string;
    noop: boolean;
    freeze?: string;
  }> = [
    // Retry after a network failure — no error, no second Stream call.
    { status: "closed", channel: "xolacer_abc", noop: true },
    { status: "closed", noop: true },
    // Unaccepted request: nothing to freeze, but the row still closes.
    { status: "requested", noop: false },
    { status: "open", channel: "xolacer_abc", noop: false, freeze: "xolacer_abc" },
    { status: "resting", channel: "xolacer_abc", noop: false, freeze: "xolacer_abc" },
  ];

  for (const c of cases) {
    it(`status=${c.status} channel=${c.channel} → noop=${c.noop} freeze=${c.freeze}`, () => {
      const plan = planBlock({ status: c.status, streamChannelId: c.channel });
      expect(plan.noop).toBe(c.noop);
      expect(plan.channelToFreeze).toBe(c.freeze as string | undefined);
    });
  }
});

describe("isBlocked", () => {
  const cases: Array<{
    reason?: "declined" | "expired" | "blocked" | "xolacer_left";
    expected: boolean;
  }> = [
    { reason: "blocked", expected: true },
    { reason: "declined", expected: false },
    { reason: "expired", expected: false },
    { reason: "xolacer_left", expected: false },
    { reason: undefined, expected: false },
  ];

  for (const c of cases) {
    it(`closedReason=${c.reason} → ${c.expected}`, () => {
      expect(isBlocked(c.reason)).toBe(c.expected);
    });
  }
});

describe("canRate", () => {
  const ACCEPTED = 1_000;
  const AFTER = 2_000;

  // role | closedReason | exchange → rateable
  const cases: Array<{
    role: "user" | "xolacer";
    reason?: "declined" | "expired" | "blocked" | "xolacer_left";
    acceptedAt?: number;
    lastMessageAt?: number;
    expected: boolean;
    label?: string;
  }> = [
    {
      role: "user",
      acceptedAt: ACCEPTED,
      lastMessageAt: AFTER,
      expected: true,
    },
    // A closed conversation is still rateable — only a block isn't.
    {
      role: "user",
      reason: "xolacer_left",
      acceptedAt: ACCEPTED,
      lastMessageAt: AFTER,
      expected: true,
    },
    // The xolacer never rates the people who come to them.
    {
      role: "xolacer",
      acceptedAt: ACCEPTED,
      lastMessageAt: AFTER,
      expected: false,
    },
    // Accepted then ignored: the handshake stamp is the only timestamp.
    {
      role: "user",
      acceptedAt: ACCEPTED,
      lastMessageAt: ACCEPTED,
      expected: false,
    },
    { role: "user", expected: false },
    // safety rows: a blocked conversation never rates, whatever else is true
    {
      role: "user",
      reason: "blocked",
      acceptedAt: ACCEPTED,
      lastMessageAt: AFTER,
      expected: false,
      label: "safety",
    },
    {
      role: "xolacer",
      reason: "blocked",
      acceptedAt: ACCEPTED,
      lastMessageAt: AFTER,
      expected: false,
      label: "safety",
    },
  ];

  for (const c of cases) {
    const name = `${c.label ? `${c.label}: ` : ""}role=${c.role} closedReason=${c.reason} accepted=${c.acceptedAt} last=${c.lastMessageAt} → ${c.expected}`;
    it(name, () => {
      expect(
        canRate(
          {
            closedReason: c.reason,
            acceptedAt: c.acceptedAt,
            lastMessageAt: c.lastMessageAt,
          },
          c.role,
        ),
      ).toBe(c.expected);
    });
  }
});
