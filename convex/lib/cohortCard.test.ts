import { describe, expect, it } from "bun:test";
import {
  COHORT_FLOOR,
  deriveCohortCardState,
  isCohortMatch,
  weekStartUtc,
} from "./cohortCard";

const VIEWER = "session_viewer" as const;
const OTHER = "session_other" as const;

describe("isCohortMatch", () => {
  const cases: Array<{
    name: string;
    sessionId: string;
    viewerSessionId?: string;
    safeguard?: "none" | "gentle" | "elevated" | "crisis";
    primary: string;
    secondary?: string;
    target: string;
    expected: boolean;
  }> = [
    {
      name: "match on primary",
      sessionId: OTHER,
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "match on secondary",
      sessionId: OTHER,
      primary: "anger",
      secondary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "match on neither",
      sessionId: OTHER,
      primary: "anger",
      secondary: "fear",
      target: "sadness",
      expected: false,
    },
    {
      name: "no secondary, primary misses",
      sessionId: OTHER,
      primary: "joy",
      target: "sadness",
      expected: false,
    },
    // viewer exclusion: your own session is never evidence you aren't alone
    {
      name: "viewer's own session, otherwise matching",
      sessionId: VIEWER,
      viewerSessionId: VIEWER,
      primary: "sadness",
      target: "sadness",
      expected: false,
    },
    {
      name: "no viewer given (aggregation time) counts everything",
      sessionId: VIEWER,
      viewerSessionId: undefined,
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    // safety rows: crisis only, not elevated
    {
      name: "crisis excluded",
      sessionId: OTHER,
      safeguard: "crisis",
      primary: "sadness",
      target: "sadness",
      expected: false,
    },
    {
      name: "elevated still counts",
      sessionId: OTHER,
      safeguard: "elevated",
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "gentle still counts",
      sessionId: OTHER,
      safeguard: "gentle",
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "no safeguard level recorded still counts",
      sessionId: OTHER,
      safeguard: undefined,
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "crisis on a secondary match is still excluded",
      sessionId: OTHER,
      safeguard: "crisis",
      primary: "anger",
      secondary: "sadness",
      target: "sadness",
      expected: false,
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      expect(
        isCohortMatch(
          {
            sessionId: c.sessionId as never,
            safeguardLevel: c.safeguard,
            primaryEmotion: c.primary,
            secondaryEmotion: c.secondary,
          },
          c.viewerSessionId,
          c.target,
        ),
      ).toBe(c.expected);
    });
  }
});

describe("deriveCohortCardState", () => {
  const cases: Array<{ count: number; expected: ReturnType<typeof deriveCohortCardState> }> = [
    { count: 0, expected: { type: "warming" } },
    { count: 1, expected: { type: "warming" } },
    // the floor boundary, both sides
    { count: 2, expected: { type: "warming" } },
    { count: 3, expected: { type: "count", value: 3 } },
    { count: 22, expected: { type: "count", value: 22 } },
  ];

  for (const c of cases) {
    it(`count=${c.count} → ${c.expected.type}`, () => {
      expect(deriveCohortCardState(c.count)).toEqual(c.expected);
    });
  }

  it("floor is 3", () => {
    expect(COHORT_FLOOR).toBe(3);
  });
});

describe("weekStartUtc", () => {
  // 2026-08-25 is a Tuesday; its week starts Mon 2026-08-24 00:00 UTC.
  const monday = Date.UTC(2026, 7, 24);

  it("Monday 00:00 is its own week start", () => {
    expect(weekStartUtc(monday)).toBe(monday);
  });

  it("mid-week rounds back to Monday", () => {
    expect(weekStartUtc(Date.UTC(2026, 7, 26, 13, 45))).toBe(monday);
  });

  it("Sunday belongs to the week that started six days earlier", () => {
    expect(weekStartUtc(Date.UTC(2026, 7, 30, 23, 59, 59))).toBe(monday);
  });
});
