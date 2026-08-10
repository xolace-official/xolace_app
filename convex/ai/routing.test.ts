import { describe, expect, it } from "bun:test";
import { routeUncertainty } from "./routing";

describe("routeUncertainty", () => {
  it("routes tentative only when confidence AND shape are both low", () => {
    expect(routeUncertainty({ confidence: 0.3, specificity: 2 })).toBe(
      "tentative",
    );
  });

  it("routes confident when confidence AND shape are both high", () => {
    expect(routeUncertainty({ confidence: 0.9, specificity: 8 })).toBe(
      "confident",
    );
  });

  it("routes measured when the two axes disagree (low confidence, sharp shape)", () => {
    expect(routeUncertainty({ confidence: 0.3, specificity: 8 })).toBe(
      "measured",
    );
  });

  it("routes measured when the two axes disagree (sure emotion, no shape)", () => {
    expect(routeUncertainty({ confidence: 0.9, specificity: 2 })).toBe(
      "measured",
    );
  });

  it("routes measured in the ambiguous middle", () => {
    expect(routeUncertainty({ confidence: 0.6, specificity: 5 })).toBe(
      "measured",
    );
  });

  it("treats the low thresholds as exclusive (0.5 / 4 are not 'low')", () => {
    // confidence exactly 0.5 and specificity exactly 4 → not both-low.
    expect(routeUncertainty({ confidence: 0.5, specificity: 3 })).toBe(
      "measured",
    );
    expect(routeUncertainty({ confidence: 0.4, specificity: 4 })).toBe(
      "measured",
    );
  });

  it("treats the high thresholds as inclusive (0.75 / 6 are 'high')", () => {
    expect(routeUncertainty({ confidence: 0.75, specificity: 6 })).toBe(
      "confident",
    );
  });
});
