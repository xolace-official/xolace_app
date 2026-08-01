import { describe, expect, it } from "bun:test";
import {
  conversationOrigin,
  isInSuggestionCooldown,
  meetsRatingFloor,
  MIN_RATINGS_TO_JUDGE,
  MIN_SUGGESTION_INTENSITY,
  rankSuggestionCandidates,
  suggestedSpecialty,
  SUGGESTION_COOLDOWN_MS,
  type SuggestionInput,
} from "./xolacerSuggestion";

const base: SuggestionInput = {
  thematicTags: [],
  primaryEmotion: "sadness",
  intensity: 7,
  safeguardLevel: "none",
  entryType: "open_prompt",
};

describe("suggestedSpecialty — theme map", () => {
  const rows: [string, string | null][] = [
    ["work", "burnout"],
    ["relationships", "relationships"],
    ["conflict", "relationships"],
    ["family", "family"],
    ["identity", "identity"],
    ["self-worth", "identity"],
    ["purpose", "identity"],
    ["change", "change"],
    ["loss", "grief"],
    ["isolation", "loneliness"],
    ["health", null],
    ["finances", null],
    ["achievement", null],
    ["creativity", null],
    ["trauma", null],
    ["abuse", null],
    ["neglect", null],
  ];

  for (const [theme, specialty] of rows) {
    it(`maps theme "${theme}" to ${specialty ?? "no suggestion"}`, () => {
      expect(suggestedSpecialty({ ...base, thematicTags: [theme] })).toBe(
        specialty,
      );
    });
  }
});

describe("suggestedSpecialty — emotion fallback", () => {
  it("maps emotion anxiety to anxiety when no theme mapped", () => {
    expect(
      suggestedSpecialty({
        ...base,
        primaryEmotion: "anxiety",
        thematicTags: ["health"],
      }),
    ).toBe("anxiety");
  });

  it("maps emotion grief to grief", () => {
    expect(
      suggestedSpecialty({
        ...base,
        primaryEmotion: "grief",
        thematicTags: ["health"],
      }),
    ).toBe("grief");
  });

  it("maps granular label loneliness to loneliness", () => {
    expect(
      suggestedSpecialty({
        ...base,
        granularLabel: "loneliness",
        thematicTags: ["health"],
      }),
    ).toBe("loneliness");
  });

  it("lets theme win over a matching emotion", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["family"],
        primaryEmotion: "anxiety",
      }),
    ).toBe("family");
  });

  it("returns null for an unmapped emotion and no mapped theme", () => {
    expect(suggestedSpecialty({ ...base, thematicTags: ["health"] })).toBeNull();
  });
});

describe("suggestedSpecialty — suppression and gates", () => {
  it("suppresses trauma even when another theme would match", () => {
    expect(
      suggestedSpecialty({ ...base, thematicTags: ["family", "trauma"] }),
    ).toBeNull();
  });

  it("suppresses abuse over a valid theme match", () => {
    expect(
      suggestedSpecialty({ ...base, thematicTags: ["work", "abuse"] }),
    ).toBeNull();
  });

  it("suppresses neglect over a valid theme match", () => {
    expect(
      suggestedSpecialty({ ...base, thematicTags: ["loss", "neglect"] }),
    ).toBeNull();
  });

  it("suppresses trauma over a matching emotion fallback", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["trauma"],
        primaryEmotion: "anxiety",
      }),
    ).toBeNull();
  });

  it("passes safeguard none", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["work"],
        safeguardLevel: "none",
      }),
    ).toBe("burnout");
  });

  it("passes safeguard gentle", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["work"],
        safeguardLevel: "gentle",
      }),
    ).toBe("burnout");
  });

  it("excludes safeguard elevated", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["work"],
        safeguardLevel: "elevated",
      }),
    ).toBeNull();
  });

  it("excludes safeguard crisis", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["work"],
        safeguardLevel: "crisis",
      }),
    ).toBeNull();
  });

  it("passes at the intensity floor", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["work"],
        intensity: MIN_SUGGESTION_INTENSITY,
      }),
    ).toBe("burnout");
  });

  it("excludes one below the intensity floor", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: ["work"],
        intensity: MIN_SUGGESTION_INTENSITY - 1,
      }),
    ).toBeNull();
  });

  for (const entryType of ["word_cloud", "body_scan"]) {
    it(`returns null for ${entryType}, a tap rather than a sentence`, () => {
      expect(
        suggestedSpecialty({
          ...base,
          entryType,
          primaryEmotion: "anxiety",
        }),
      ).toBeNull();
    });

    // The case the empty-tags proxy missed: the classifier prompt says an
    // empty array is "fine" for these modes, not required, so a tapped
    // session that did get tagged used to fall straight through to a theme
    // match — routing someone off two tapped words.
    it(`returns null for ${entryType} even when a theme did get tagged`, () => {
      expect(
        suggestedSpecialty({
          ...base,
          entryType,
          thematicTags: ["work"],
        }),
      ).toBeNull();
    });
  }

  // The other direction: a typed session keeps the emotion fallback the map
  // deliberately includes, even when the classifier tagged no life domain.
  it("still suggests for a typed session with no thematic tags", () => {
    expect(
      suggestedSpecialty({
        ...base,
        thematicTags: [],
        primaryEmotion: "anxiety",
      }),
    ).toBe("anxiety");
  });

  it("does not suppress voice, which is an utterance not a tap", () => {
    expect(
      suggestedSpecialty({
        ...base,
        entryType: "voice",
        thematicTags: ["work"],
      }),
    ).toBe("burnout");
  });
});

describe("meetsRatingFloor", () => {
  it("passes an unrated xolacer", () => {
    expect(meetsRatingFloor({})).toBe(true);
  });

  it("passes a badly rated xolacer below the judgement threshold", () => {
    expect(
      meetsRatingFloor({ ratingCount: MIN_RATINGS_TO_JUDGE - 1, ratingSum: 4 }),
    ).toBe(true);
  });

  it("excludes an average below 3.0 at the threshold", () => {
    expect(
      meetsRatingFloor({ ratingCount: MIN_RATINGS_TO_JUDGE, ratingSum: 14 }),
    ).toBe(false);
  });

  it("passes an average of exactly 3.0", () => {
    expect(
      meetsRatingFloor({ ratingCount: MIN_RATINGS_TO_JUDGE, ratingSum: 15 }),
    ).toBe(true);
  });
});

describe("rankSuggestionCandidates", () => {
  const load = (xolacerProfileId: string, openCount: number) => ({
    xolacerProfileId,
    openCount,
  });

  it("orders by fewest open conversations", () => {
    const ranked = rankSuggestionCandidates(
      [load("a", 3), load("b", 0), load("c", 1)],
      "session1",
    );
    expect(ranked.map((c) => c.xolacerProfileId)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input", () => {
    const input = [load("a", 3), load("b", 0)];
    rankSuggestionCandidates(input, "session1");
    expect(input.map((c) => c.xolacerProfileId)).toEqual(["a", "b"]);
  });

  it("is stable across repeated reads of one session", () => {
    const candidates = ["a", "b", "c", "d"].map((id) => load(id, 0));
    const first = rankSuggestionCandidates(candidates, "session1");
    const second = rankSuggestionCandidates([...candidates].reverse(), "session1");
    expect(second.map((c) => c.xolacerProfileId)).toEqual(
      first.map((c) => c.xolacerProfileId),
    );
  });

  it("spreads the winner across sessions when everyone is idle", () => {
    const candidates = ["a", "b", "c", "d", "e"].map((id) => load(id, 0));
    const winners = new Set(
      Array.from(
        { length: 40 },
        (_, i) => rankSuggestionCandidates(candidates, `session${i}`)[0].xolacerProfileId,
      ),
    );
    // Not "uniform" — just proof it isn't the id sort handing every first
    // suggestion to whoever sorts lowest.
    expect(winners.size).toBeGreaterThan(1);
  });

  it("never lets the tie-break outrank load", () => {
    const ranked = rankSuggestionCandidates(
      [load("a", 0), load("b", 1)],
      "session-that-favours-b",
    );
    expect(ranked[0].xolacerProfileId).toBe("a");
  });

  it("returns empty for no candidates", () => {
    expect(rankSuggestionCandidates([], "session1")).toEqual([]);
  });
});

describe("isInSuggestionCooldown", () => {
  const now = 1_000_000_000_000;

  it("is open when no recent row carried a suggestion", () => {
    expect(
      isInSuggestionCooldown([{ createdAt: now - 1000 }], now),
    ).toBe(false);
  });

  it("is closed just inside the window", () => {
    const row = {
      createdAt: now - SUGGESTION_COOLDOWN_MS + 1,
      suggestedSpecialty: "burnout",
    };
    expect(isInSuggestionCooldown([row], now)).toBe(true);
  });

  it("is open exactly at the window edge", () => {
    const row = {
      createdAt: now - SUGGESTION_COOLDOWN_MS,
      suggestedSpecialty: "burnout",
    };
    expect(isInSuggestionCooldown([row], now)).toBe(false);
  });

  it("is open on an empty history", () => {
    expect(isInSuggestionCooldown([], now)).toBe(false);
  });
});

describe("conversationOrigin", () => {
  it("stamps a suggestion when a recent specialty overlaps what they declare", () => {
    expect(conversationOrigin(["burnout"], ["burnout", "anxiety"])).toBe(
      "suggestion",
    );
  });

  it("stamps direct with no overlap", () => {
    expect(conversationOrigin(["burnout"], ["grief", "family"])).toBe("direct");
  });

  it("stamps direct when nothing recent was suggested", () => {
    expect(conversationOrigin([], ["burnout"])).toBe("direct");
  });

  it("stamps direct when the xolacer declares nothing", () => {
    expect(conversationOrigin(["burnout"], undefined)).toBe("direct");
    expect(conversationOrigin(["burnout"], [])).toBe("direct");
  });

  it("matches on any of several recent specialties", () => {
    expect(conversationOrigin(["grief", "burnout"], ["burnout"])).toBe(
      "suggestion",
    );
  });
});
