import { describe, expect, it } from "vitest";
import { buildQuotePrompt, parseQuoteResponse, type QuoteSession } from "./quotesPrompt";

const now = new Date("2026-07-07T00:00:00Z").getTime();

const oneSession: QuoteSession[] = [
  {
    sessionId: "s1",
    sessionCreatedAt: now - 24 * 60 * 60 * 1000,
    primaryEmotion: "heavy",
    granularLabel: "weighed down",
    thematicTags: ["work", "sleep"],
    intensity: 6,
  },
];

const baseParams = {
  angleSeed: "stillness",
  now,
  sessions: oneSession,
  preferredThemes: [] as string[],
  recentQuoteTexts: [] as string[],
};

describe("buildQuotePrompt", () => {
  describe("cold-start fallback (no semantic profile)", () => {
    it("uses the recency-only summary and omits the profile section", () => {
      const { userPrompt } = buildQuotePrompt({ ...baseParams, renderedProfile: null });

      expect(userPrompt).toContain("Recent emotional themes:");
      expect(userPrompt).not.toContain("Longitudinal emotional profile:");
      expect(userPrompt).not.toContain("Recent signal (last few days):");
      expect(userPrompt).toContain("weighed down, intensity 6/10 (work, sleep) — 1 day ago");
    });
  });

  describe("profile-present (Cognition Layer)", () => {
    it("leads with the rendered profile and folds the summary in as a recency signal", () => {
      const renderedProfile = "Recurring themes: overwork, self-doubt\nRecent trajectory: gradually lighter";
      const { userPrompt } = buildQuotePrompt({ ...baseParams, renderedProfile });

      expect(userPrompt).toContain("Longitudinal emotional profile:\n" + renderedProfile);
      expect(userPrompt).toContain("Recent signal (last few days):");
      expect(userPrompt).not.toContain("Recent emotional themes:");
      expect(userPrompt.indexOf("Longitudinal emotional profile:")).toBeLessThan(
        userPrompt.indexOf("Recent signal (last few days):"),
      );
    });
  });

  it("carries the daily angle seed into the system prompt in both branches", () => {
    const withProfile = buildQuotePrompt({ ...baseParams, renderedProfile: "Recurring themes: X" });
    const withoutProfile = buildQuotePrompt({ ...baseParams, renderedProfile: null });

    expect(withProfile.systemPrompt).toContain("lens of: stillness");
    expect(withoutProfile.systemPrompt).toContain("lens of: stillness");
  });

  it("appends the preferred-themes line only when themes are given", () => {
    const withThemes = buildQuotePrompt({
      ...baseParams,
      renderedProfile: null,
      preferredThemes: ["impermanence", "grace"],
    });
    const withoutThemes = buildQuotePrompt({ ...baseParams, renderedProfile: null });

    expect(withThemes.userPrompt).toContain("Preferred themes (align naturally with one if fitting): impermanence, grace");
    expect(withoutThemes.userPrompt).not.toContain("Preferred themes");
  });

  it("appends the avoid-list only when recent quotes are given, in both branches", () => {
    const recentQuoteTexts = ["You are not the storm.", "Stillness is not surrender."];

    const withProfile = buildQuotePrompt({
      ...baseParams,
      renderedProfile: "Recurring themes: X",
      recentQuoteTexts,
    });
    const withoutProfile = buildQuotePrompt({ ...baseParams, renderedProfile: null, recentQuoteTexts });
    const noAvoid = buildQuotePrompt({ ...baseParams, renderedProfile: null });

    for (const { userPrompt } of [withProfile, withoutProfile]) {
      expect(userPrompt).toContain("Recent quotes already shown");
      expect(userPrompt).toContain('- "You are not the storm."');
      expect(userPrompt).toContain('- "Stillness is not surrender."');
    }
    expect(noAvoid.userPrompt).not.toContain("Recent quotes already shown");
  });

  it("handles multiple sessions and empty session lists without throwing", () => {
    const multi = buildQuotePrompt({
      ...baseParams,
      renderedProfile: null,
      sessions: [
        ...oneSession,
        {
          sessionId: "s2",
          sessionCreatedAt: now - 3 * 24 * 60 * 60 * 1000,
          primaryEmotion: "numb",
          thematicTags: [],
          intensity: 3,
        },
      ],
    });
    expect(multi.userPrompt).toContain("weighed down, intensity 6/10 (work, sleep) — 1 day ago");
    expect(multi.userPrompt).toContain("numb, intensity 3/10 — 3 days ago");

    const empty = buildQuotePrompt({ ...baseParams, renderedProfile: null, sessions: [] });
    expect(empty.userPrompt).toContain("Recent emotional themes:\n");
  });

  it("asks for seed-and-write JSON output", () => {
    const { systemPrompt } = buildQuotePrompt({ ...baseParams, renderedProfile: null });
    expect(systemPrompt).toContain('{"seeds": ["...", "..."], "quote": "..."}');
    expect(systemPrompt).toContain("NEVER narrate the reader's progress");
  });
});

describe("parseQuoteResponse", () => {
  it("reads a bare JSON object", () => {
    const parsed = parseQuoteResponse('{"seeds":["a","b"],"quote":"  You are not the storm.  "}');
    expect(parsed).toEqual({ quote: "You are not the storm.", seeds: ["a", "b"] });
  });

  it("tolerates fences and surrounding prose", () => {
    const raw = 'Here you go:\n```json\n{"seeds":["a"],"quote":"Stillness is not surrender."}\n```';
    expect(parseQuoteResponse(raw)?.quote).toBe("Stillness is not surrender.");
  });

  it("defaults seeds to an empty array when missing or malformed", () => {
    expect(parseQuoteResponse('{"quote":"A line."}')?.seeds).toEqual([]);
    expect(parseQuoteResponse('{"seeds":[1,"a"],"quote":"A line."}')?.seeds).toEqual(["a"]);
  });

  it("returns null for unusable responses", () => {
    expect(parseQuoteResponse("You are not the storm.")).toBeNull();
    expect(parseQuoteResponse('{"seeds":["a"],"quote":""}')).toBeNull();
    expect(parseQuoteResponse('{"seeds":["a"], quote:}')).toBeNull();
  });
});
