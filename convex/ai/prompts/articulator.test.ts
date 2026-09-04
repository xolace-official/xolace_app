import { describe, expect, it } from "vitest";
import { buildArticulatorPrompt } from "./articulator";

/**
 * word_cloud became reach-eligible on 2026-09-04 (routing.ts, §3.5), so the
 * texture-words block now co-occurs with reaching/holding. Its "complete
 * emotional picture" sentence contradicts both and must drop out; the other
 * two sentences are guards the faint path still needs.
 */
const COMPLETE_PICTURE = "complete emotional picture";
const THEIR_LANGUAGE = "These ARE their language";
const NO_ADDING = "Do not add emotions not implied by the words";

const build = (claimStrength?: "reaching" | "holding" | "measured") =>
  buildArticulatorPrompt({
    rawInput: "heavy, tight, blank",
    classification: {
      primaryEmotion: "numbness",
      primaryEmotionConfidence: 0.6,
      intensity: 5,
      specificity: 2,
      thematicTags: [],
      userLanguageTags: ["heavy", "tight", "blank"],
      requiresFollowUp: false,
    },
    patternSummary: "(none)",
    safeguardLevel: "none",
    mirrorTone: "adaptive",
    isFirstSession: false,
    recentMirrors: [],
    entryType: "word_cloud",
    claimStrength,
  }).system;

describe("articulator — word_cloud entry-type block", () => {
  it("asks for a complete picture on the normal path", () => {
    const system = build("measured");
    expect(system).toContain(COMPLETE_PICTURE);
    expect(system).toContain(THEIR_LANGUAGE);
    expect(system).toContain(NO_ADDING);
  });

  it("drops only the complete-picture sentence when faint", () => {
    for (const claimStrength of ["reaching", "holding"] as const) {
      const system = build(claimStrength);
      expect(system).not.toContain(COMPLETE_PICTURE);
      expect(system).toContain(THEIR_LANGUAGE);
      expect(system).toContain(NO_ADDING);
    }
  });
});
