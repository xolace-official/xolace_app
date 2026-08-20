import { describe, expect, it } from "bun:test";
import { buildArticulatorPrompt } from "./articulator";
import type { ClaimStrength } from "../routing";
import type { ClassificationResult } from "../providers/anthropic";

const classification: ClassificationResult = {
  primaryEmotion: "sadness",
  primaryEmotionConfidence: 0.4,
  intensity: 8,
  specificity: 2,
  thematicTags: [],
  userLanguageTags: ["heavy"],
  requiresFollowUp: false,
};

const build = (claimStrength?: ClaimStrength, userFeedback?: string) =>
  buildArticulatorPrompt({
    rawInput: "feeling heavy tonight",
    classification,
    patternSummary: "carries weight quietly",
    safeguardLevel: "none",
    mirrorTone: "adaptive",
    claimStrength,
    isFirstSession: false,
    recentMirrors: [],
    semanticProfile: "They tend to arrive without words for it.",
    episodicRecall: ["they wrote about work"],
    existingMirror: userFeedback ? "a previous mirror" : undefined,
    userFeedback,
  }).system;

describe("claim strength blocks", () => {
  it("routes reaching and holding to their own blocks", () => {
    expect(build("reaching")).toContain("## Claim Strength: Reaching");
    expect(build("holding")).toContain("## Claim Strength: Holding");
    expect(build("measured")).not.toContain("## Claim Strength:");
  });

  for (const strength of ["reaching", "holding"] as const) {
    it(`applies subtractions 1-4 on the ${strength} path`, () => {
      const system = build(strength);
      // 1: no expansion mandate
      expect(system).toContain("a guess wearing the clothes of insight");
      expect(system).not.toContain("yes, exactly");
      // 2: no Intensity x Specificity body
      expect(system).toContain("The signal is faint.");
      expect(system).not.toContain("Give the vague enormity a form");
      // 3: pattern context informs the ear only
      expect(system).toContain("it may not supply anything tonight's words did not");
      // 4: recognition without explanation
      expect(system).toContain("Recognition and understanding are separate claims");
      expect(system).not.toContain("Use these for continuity");
      // profile block deliberately kept
      expect(system).toContain("## What You Know About This Person");
    });
  }

  it("leaves the standing prompt intact on the measured path", () => {
    const system = build("measured");
    expect(system).toContain("yes, exactly");
    expect(system).toContain("Give the vague enormity a form");
    expect(system).toContain("Use these for continuity");
    expect(system).not.toContain("The signal is faint.");
  });

  it("applies subtraction 5 only on the holding path", () => {
    expect(build("holding", "not_quite")).toContain(
      "Change what you name, not how much you claim",
    );
    expect(build("holding", "say_more")).toContain(
      "They did not add more signal",
    );
    expect(build("reaching", "not_quite")).toContain(
      "Try a different angle, different metaphor",
    );
    expect(build("measured", "say_more")).toContain(
      "they had additional context to share",
    );
  });
});
