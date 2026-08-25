import { describe, expect, it } from "bun:test";
import {
  COHORT_FLOOR,
  deriveCohortCardState,
  isCohortMatch,
  weekStartUtc,
} from "./cohortCard";

describe("isCohortMatch", () => {
  const cases: Array<{
    name: string;
    safeguard?: "none" | "gentle" | "elevated" | "crisis";
    primary: string;
    secondary?: string;
    target: string;
    expected: boolean;
  }> = [
    // emotion-matching rows: safeguard held at "none" so only the match varies
    {
      name: "match on primary",
      safeguard: "none",
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "match on secondary",
      safeguard: "none",
      primary: "anger",
      secondary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "match on neither",
      safeguard: "none",
      primary: "anger",
      secondary: "fear",
      target: "sadness",
      expected: false,
    },
    {
      name: "no secondary, primary misses",
      safeguard: "none",
      primary: "joy",
      target: "sadness",
      expected: false,
    },
    // safety rows: crisis only, not elevated
    {
      name: "crisis excluded",
      safeguard: "crisis",
      primary: "sadness",
      target: "sadness",
      expected: false,
    },
    {
      name: "elevated still counts",
      safeguard: "elevated",
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      name: "gentle still counts",
      safeguard: "gentle",
      primary: "sadness",
      target: "sadness",
      expected: true,
    },
    {
      // Legacy rows predate the safeguard verdict landing on this table, and
      // their sessions mostly don't carry it either — unknown is not safe.
      name: "no safeguard level recorded is excluded",
      safeguard: undefined,
      primary: "sadness",
      target: "sadness",
      expected: false,
    },
    {
      name: "crisis on a secondary match is still excluded",
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
            safeguardLevel: c.safeguard,
            primaryEmotion: c.primary,
            secondaryEmotion: c.secondary,
          },
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
