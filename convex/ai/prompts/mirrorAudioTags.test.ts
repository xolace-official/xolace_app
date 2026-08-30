import { describe, expect, it } from "vitest";
import { applyAudioFence } from "./mirrorAudioTags";

describe("applyAudioFence", () => {
  it("keeps tags in ttsText but strips them from displayText for premium", () => {
    const { ttsText, displayText } = applyAudioFence({
      mirrorText: "[sighs] I hear you.",
      isFallback: false,
      isPremium: true,
    });
    expect(ttsText).toBe("[sighs] I hear you.");
    expect(displayText).toBe("I hear you.");
  });

  it("leaves text untouched for non-premium (tags never generated)", () => {
    const { ttsText, displayText } = applyAudioFence({
      mirrorText: "I hear you.",
      isFallback: false,
      isPremium: false,
    });
    expect(ttsText).toBe("I hear you.");
    expect(displayText).toBe("I hear you.");
  });

  it("passes the fallback mirror through unstripped even for premium", () => {
    const fallback = "I hear you, and what you're feeling matters.";
    const { ttsText, displayText } = applyAudioFence({
      mirrorText: fallback,
      isFallback: true,
      isPremium: true,
    });
    expect(ttsText).toBe(fallback);
    expect(displayText).toBe(fallback);
  });

  it("both texts equal for premium mirror with no tags", () => {
    const { ttsText, displayText } = applyAudioFence({
      mirrorText: "Just words, no tags.",
      isFallback: false,
      isPremium: true,
    });
    expect(ttsText).toBe("Just words, no tags.");
    expect(displayText).toBe("Just words, no tags.");
  });
});
