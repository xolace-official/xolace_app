import { describe, expect, it } from "bun:test";
import {
  canRate,
  isAtOpenCap,
  isBlocked,
  isPairBlocked,
  planBlock,
} from "./conversationGating";

type Reason = "declined" | "expired" | "blocked" | "xolacer_left";

describe("isPairBlocked", () => {
  // forward row | reverse row → is the pair closed?
  const cases: Array<{
    forward?: Reason | null;
    reverse?: Reason | null;
    expected: boolean;
    label: string;
  }> = [
    { expected: false, label: "neither direction was ever opened" },
    {
      forward: "blocked",
      expected: true,
      label: "forward pairing blocked",
    },
    // The regression this predicate exists for: A blocked B on the row where A
    // asked, so B must not be able to open the row where B asks.
    {
      reverse: "blocked",
      expected: true,
      label: "reverse pairing blocked",
    },
    { forward: null, reverse: null, expected: false, label: "both unblocked" },
    // A decline or an expiry is not a block — the seeker may come back.
    {
      forward: "declined",
      reverse: "expired",
      expected: false,
      label: "closed for a non-blocked reason",
    },
    {
      forward: "xolacer_left",
      expected: false,
      label: "xolacer_left is not a block",
    },
  ];

  for (const c of cases) {
    it(`${c.label}: forward=${c.forward} reverse=${c.reverse} → ${c.expected}`, () => {
      expect(
        isPairBlocked(
          c.forward === undefined ? undefined : { closedReason: c.forward ?? undefined },
          c.reverse === undefined ? undefined : { closedReason: c.reverse ?? undefined },
        ),
      ).toBe(c.expected);
    });
  }
});

describe("isAtOpenCap", () => {
  const XOLACER_CAP = 8;
  const SEEKER_CAP = 3;

  // openCount | cap → is this party full?
  const cases: Array<{ open: number; cap: number; expected: boolean }> = [
    { open: 0, cap: SEEKER_CAP, expected: false },
    { open: 2, cap: SEEKER_CAP, expected: false },
    { open: 3, cap: SEEKER_CAP, expected: true },
    // Grandfathered seekers from before the cap existed: still full, never
    // negative-space back under it.
    { open: 5, cap: SEEKER_CAP, expected: true },
    { open: 7, cap: XOLACER_CAP, expected: false },
    { open: 8, cap: XOLACER_CAP, expected: true },
    { open: 9, cap: XOLACER_CAP, expected: true },
  ];

  for (const c of cases) {
    it(`open=${c.open} cap=${c.cap} → ${c.expected}`, () => {
      expect(isAtOpenCap(c.open, c.cap)).toBe(c.expected);
    });
  }
});

describe("planBlock", () => {
  // status | closedReason | channel → noop, channel to freeze
  const cases: Array<{
    status: "requested" | "open" | "resting" | "closed";
    reason?: "declined" | "expired" | "blocked" | "xolacer_left";
    channel?: string;
    noop: boolean;
    freeze?: string;
    label?: string;
  }> = [
    // Retry after a network failure — no error, no second Stream call.
    {
      status: "closed",
      reason: "blocked",
      channel: "xolacer_abc",
      noop: true,
      label: "already blocked",
    },
    { status: "closed", reason: "blocked", noop: true, label: "already blocked" },
    // Closed for any other reason is still blockable: only `blocked` and
    // `xolacer_left` stop the seeker re-requesting, so a declined or expired
    // row left unblocked is a way back in.
    {
      status: "closed",
      reason: "declined",
      noop: false,
      label: "declined is still blockable",
    },
    {
      status: "closed",
      reason: "expired",
      noop: false,
      label: "expired is still blockable",
    },
    {
      status: "closed",
      reason: "xolacer_left",
      channel: "xolacer_abc",
      noop: false,
      freeze: "xolacer_abc",
      label: "xolacer_left is still blockable",
    },
    // Unaccepted request: nothing to freeze, but the row still closes.
    { status: "requested", noop: false },
    { status: "open", channel: "xolacer_abc", noop: false, freeze: "xolacer_abc" },
    { status: "resting", channel: "xolacer_abc", noop: false, freeze: "xolacer_abc" },
  ];

  for (const c of cases) {
    const name = `${c.label ? `${c.label}: ` : ""}status=${c.status} reason=${c.reason} channel=${c.channel} → noop=${c.noop} freeze=${c.freeze}`;
    it(name, () => {
      const plan = planBlock({
        status: c.status,
        closedReason: c.reason,
        streamChannelId: c.channel,
      });
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
