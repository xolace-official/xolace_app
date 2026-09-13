import { describe, expect, it } from "vitest";
import { formatTime } from "./format-time";

describe("formatTime", () => {
  it("pads seconds and rounds down", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65.9)).toBe("1:05");
    expect(formatTime(3599)).toBe("59:59");
  });
  it("clamps negatives from an early seek to zero", () => {
    expect(formatTime(-3)).toBe("0:00");
  });
});
