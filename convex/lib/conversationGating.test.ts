import { describe, expect, it } from "bun:test";
import {
  type BlockPlanRow,
  canRate,
  DECLINE_COOLDOWN_MS,
  declineCooldownUntil,
  hasRequestExpired,
  isAtOpenCap,
  isBlocked,
  isPairBlocked,
  planBlock,
  REQUEST_EXPIRY_MS,
} from "./conversationGating";

type Reason = "declined" | "expired" | "blocked" | "xolacer_left";

describe("hasRequestExpired", () => {
  const HOUR = 60 * 60 * 1000;
  const REQUESTED = 1_000_000;

  // requestedAt + elapsed → has the sweep's span run out?
  const cases: Array<{ elapsed: number; expected: boolean; label: string }> = [
    { elapsed: 0, expected: false, label: "just sent" },
    // The window the median accept (4h) and the 90th percentile (32h) live in.
    { elapsed: 4 * HOUR, expected: false, label: "the median accept" },
    { elapsed: 32 * HOUR, expected: false, label: "the 90th percentile" },
    { elapsed: REQUEST_EXPIRY_MS - 1, expected: false, label: "one tick early" },
    { elapsed: REQUEST_EXPIRY_MS, expected: true, label: "exactly at the span" },
    { elapsed: REQUEST_EXPIRY_MS + 1, expected: true, label: "one tick late" },
    // The request that sat pending for four days in production.
    { elapsed: 106 * HOUR, expected: true, label: "four days and change" },
  ];

  for (const c of cases) {
    it(`${c.label} → ${c.expected}`, () => {
      expect(hasRequestExpired(REQUESTED, REQUESTED + c.elapsed)).toBe(
        c.expected,
      );
    });
  }

  // The span itself, so shortening it from a week is a deliberate edit rather
  // than something a refactor can slide back. Written as hours because that is
  // the unit the decision was made in.
  it("waits two days, not a week", () => {
    expect(REQUEST_EXPIRY_MS).toBe(48 * HOUR);
  });

  // Clock skew between the sweep's `now` and a row's stamp must not expire a
  // request that has not happened yet.
  it("never expires a request stamped in the future", () => {
    expect(hasRequestExpired(REQUESTED, REQUESTED - HOUR)).toBe(false);
  });
});

// Expiry writes no `declinedAt`, so the cooldown gate has nothing to read and
// the seeker may ask the same xolacer again the moment the sweep closes the
// row. Asserted here as the seeker-facing rule, not as a relationship between
// the two constants — they are independent by decision.
describe("an expired request carries no cooldown", () => {
  const REQUESTED = 1_000_000;
  const now = REQUESTED + REQUEST_EXPIRY_MS;

  it("reopens the door the instant the sweep closes the row", () => {
    expect(
      declineCooldownUntil(
        { status: "closed", closedReason: "expired", declinedAt: undefined },
        now,
      ),
    ).toBeUndefined();
  });
});

describe("declineCooldownUntil", () => {
  const DECLINED = 1_000_000;
  const OPEN_AGAIN = DECLINED + DECLINE_COOLDOWN_MS;

  // row state | now → when the pair may ask again, or undefined for "now"
  const cases: Array<{
    status?: "requested" | "open" | "resting" | "closed";
    reason?: Reason;
    declinedAt?: number;
    now: number;
    expected?: number;
    label: string;
  }> = [
    // The loop this exists to break: declined, asked again the same hour.
    {
      status: "closed",
      reason: "declined",
      declinedAt: DECLINED,
      now: DECLINED + 3_600_000,
      expected: OPEN_AGAIN,
      label: "declined an hour ago",
    },
    {
      status: "closed",
      reason: "declined",
      declinedAt: DECLINED,
      now: OPEN_AGAIN - 1,
      expected: OPEN_AGAIN,
      label: "one tick before the window closes",
    },
    // The genuine second attempt has to still work.
    {
      status: "closed",
      reason: "declined",
      declinedAt: DECLINED,
      now: OPEN_AGAIN,
      label: "exactly at the boundary",
    },
    {
      status: "closed",
      reason: "declined",
      declinedAt: DECLINED,
      now: DECLINED + 30 * 24 * 60 * 60 * 1000,
      label: "a month later",
    },
    // Expiry is silence, not a refusal — no cooldown, whatever the stamp says.
    {
      status: "closed",
      reason: "expired",
      declinedAt: DECLINED,
      now: DECLINED + 1,
      label: "expired rather than declined",
    },
    // Blocked has its own, permanent refusal upstream; it must not read as a
    // timed one that expires into a reopened door.
    {
      status: "closed",
      reason: "blocked",
      declinedAt: DECLINED,
      now: DECLINED + 1,
      label: "blocked",
    },
    {
      status: "closed",
      reason: "xolacer_left",
      declinedAt: DECLINED,
      now: DECLINED + 1,
      label: "xolacer left",
    },
    // Rows declined before the stamp existed wait for nothing.
    {
      status: "closed",
      reason: "declined",
      now: DECLINED + 1,
      label: "declined with no stamp (grandfathered)",
    },
    // A re-request already through the door reopens this row — status is what
    // says so, and a stale declinedAt must not gate the live request.
    {
      status: "requested",
      declinedAt: DECLINED,
      now: DECLINED + 1,
      label: "re-requested, stamp still on the row",
    },
    { status: "open", declinedAt: DECLINED, now: DECLINED + 1, label: "open" },
    { status: "resting", declinedAt: DECLINED, now: DECLINED + 1, label: "resting" },
    { now: DECLINED, label: "no row at all" },
  ];

  for (const c of cases) {
    it(`${c.label} → ${c.expected ?? "may ask now"}`, () => {
      expect(
        declineCooldownUntil(
          c.status === undefined
            ? null
            : {
                status: c.status,
                closedReason: c.reason,
                declinedAt: c.declinedAt,
              },
          c.now,
        ),
      ).toBe(c.expected as number);
    });
  }
});

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
  type Row = { id: string; reason?: Reason; channel?: string };
  const row = (r: Row | undefined): BlockPlanRow | undefined =>
    r === undefined
      ? undefined
      : {
          _id: r.id as BlockPlanRow["_id"],
          closedReason: r.reason,
          streamChannelId: r.channel,
        };

  // forward row | reverse row → noop, channels to freeze, rows to close
  const cases: Array<{
    forward?: Row;
    reverse?: Row;
    noop: boolean;
    freeze: string[];
    close: string[];
    label: string;
  }> = [
    // The regression this ticket exists for: a pair holding two open rows must
    // lose both, or they keep messaging through the sibling.
    {
      forward: { id: "f", channel: "ch_f" },
      reverse: { id: "r", channel: "ch_r" },
      noop: false,
      freeze: ["ch_f", "ch_r"],
      close: ["f", "r"],
      label: "both rows open",
    },
    // A still-`requested` sibling has no channel, but must still close — a
    // live invitation from the person just blocked cannot survive.
    {
      forward: { id: "f", channel: "ch_f" },
      reverse: { id: "r" },
      noop: false,
      freeze: ["ch_f"],
      close: ["f", "r"],
      label: "sibling requested, no channel",
    },
    // `closedReason` is a gate input, not an audit log: a declined sibling
    // left unblocked is a way back in.
    {
      forward: { id: "f", channel: "ch_f" },
      reverse: { id: "r", reason: "declined", channel: "ch_r" },
      noop: false,
      freeze: ["ch_f", "ch_r"],
      close: ["f", "r"],
      label: "sibling closed for another reason is overwritten",
    },
    {
      forward: { id: "f", channel: "ch_f" },
      noop: false,
      freeze: ["ch_f"],
      close: ["f"],
      label: "only one row present",
    },
    { forward: { id: "f" }, noop: false, freeze: [], close: ["f"], label: "only one row, requested" },
    // Retry after a network failure, or a double-tap — no error, no Stream call.
    {
      forward: { id: "f", reason: "blocked", channel: "ch_f" },
      reverse: { id: "r", channel: "ch_r" },
      noop: true,
      freeze: [],
      close: [],
      label: "already blocked on the forward row",
    },
    {
      forward: { id: "f", channel: "ch_f" },
      reverse: { id: "r", reason: "blocked", channel: "ch_r" },
      noop: true,
      freeze: [],
      close: [],
      label: "already blocked on the reverse row",
    },
  ];

  for (const c of cases) {
    it(`${c.label} → noop=${c.noop} freeze=[${c.freeze}] close=[${c.close}]`, () => {
      const plan = planBlock({ forward: row(c.forward), reverse: row(c.reverse) });
      expect(plan.noop).toBe(c.noop);
      expect(plan.channelsToFreeze).toEqual(c.freeze);
      expect(plan.rowsToClose).toEqual(c.close as never[]);
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
