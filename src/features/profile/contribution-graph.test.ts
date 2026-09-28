/**
 * #438: contribution graph mapping. What can go wrong: the grid draws fewer
 * than 16 weeks or ends mid-week, a long history stops short of today, a
 * frozen/today/future day reads as active or missed, a quotes-only day lights
 * up, the readout loses repeats, or today is taken from the device clock's
 * zone instead of the user's stored one.
 */
import { describe, expect, it } from "vitest";
import {
  cellState,
  dayKeyOf,
  graphRange,
  indexHistory,
  readout,
  todayIn,
} from "@/src/features/profile/contribution-graph";

const history = indexHistory(
  {
    joinDay: "2026-09-01",
    timezone: "UTC",
    days: [
      {
        dayKey: "2026-09-02",
        breadth: 2,
        actions: [
          { type: "reflect", count: 1 },
          { type: "vent", count: 3 },
        ],
      },
      {
        dayKey: "2026-09-04",
        breadth: 0,
        actions: [{ type: "quotes", count: 1 }],
      },
    ],
    frozenDays: ["2026-09-03"],
    daysShowedUp: 1,
  },
  "2026-09-10",
);

describe("contribution graph (#438)", () => {
  it("draws 16 weeks from join for a new user, ending on a week's last day", () => {
    const { start, end } = graphRange("2026-09-01", "2026-09-10");
    expect(dayKeyOf(start)).toBe("2026-09-01");
    expect(end.getDay()).toBe(6);
    // 16 weeks from join's week (Sun Aug 30) → Sat Dec 19.
    expect(dayKeyOf(end)).toBe("2026-12-19");
  });

  it("past 16 weeks, ends on the current week so the grid scrolls back to join", () => {
    const { start, end } = graphRange("2025-01-01", "2026-09-10");
    expect(dayKeyOf(start)).toBe("2025-01-01");
    expect(dayKeyOf(end)).toBe("2026-09-12");
  });

  it("resolves each cell state", () => {
    expect(cellState("2026-09-02", history)).toBe("active");
    expect(cellState("2026-09-03", history)).toBe("frozen");
    expect(cellState("2026-09-04", history)).toBe("missed");
    expect(cellState("2026-09-10", history)).toBe("today");
    expect(cellState("2026-09-11", history)).toBe("future");
  });

  it("takes today from the stored timezone, falling back to UTC", () => {
    const now = Date.UTC(2026, 8, 10, 23, 30);
    expect(todayIn("UTC", now)).toBe("2026-09-10");
    expect(todayIn("Asia/Tokyo", now)).toBe("2026-09-11");
    expect(todayIn("Not/AZone", now)).toBe("2026-09-10");
  });

  it("reads out a held day's breakdown, and the lifetime count at rest", () => {
    expect(readout(null, history).value).toBe("1 day showed up");
    expect(readout("2026-09-02", history).caption).toBe(
      "Reflected · Vented ×3",
    );
    expect(readout("2026-09-03", history).caption).toBe(
      "A freeze kept your streak lit",
    );
    expect(readout("2026-09-04", history).caption).toBe("Held a quote");
    expect(readout("2026-09-11", history).caption).toBe("Still ahead");
  });
});
