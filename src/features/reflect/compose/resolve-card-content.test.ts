import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROMPT,
  resolveCardContent,
} from "@/src/features/reflect/compose/resolve-card-content";
import { QUIET_RETURN_PROMPTS } from "@/src/features/reflect/quiet-return-copy";
import { NIGHT_HEADLINE } from "@/src/features/reflect/night-copy";

const EVENT_PROMPT = "It's Pride month. What are you carrying about that?";

describe("resolveCardContent — priority", () => {
  it("falls back to the default prompt when nothing else applies", () => {
    const { text, source } = resolveCardContent({});
    expect(text).toBe(DEFAULT_PROMPT);
    expect(source).toBe("default");
  });

  it("prefers an event prompt to the default", () => {
    const { text, source } = resolveCardContent({ eventPrompt: EVENT_PROMPT });
    expect(text).toBe(EVENT_PROMPT);
    expect(source).toBe("event");
  });

  it("prefers the quiet-return prompt to an event prompt", () => {
    const { text, source } = resolveCardContent({
      quietReturnTier: "away-30-90",
      eventPrompt: EVENT_PROMPT,
    });
    expect(text).toBe(QUIET_RETURN_PROMPTS["away-30-90"]);
    expect(source).toBe("quiet-return");
  });

  it("prefers the night headline to the quiet-return prompt", () => {
    const { text, source } = resolveCardContent({
      isNight: true,
      quietReturnTier: "anniversary",
      eventPrompt: EVENT_PROMPT,
    });
    expect(text).toBe(NIGHT_HEADLINE);
    expect(source).toBe("night");
  });

  // The user's own unfinished words are never overwritten by the space.
  it("prefers a draft to every prompt source", () => {
    const { text, source } = resolveCardContent({
      isNight: true,
      quietReturnTier: "anniversary",
      eventPrompt: EVENT_PROMPT,
      draft: "I keep thinking about",
    });
    expect(text).toBe("I keep thinking about");
    expect(source).toBe("draft");
  });

  it("shows only the draft's opening line", () => {
    const { text } = resolveCardContent({
      draft: "  first line  \nsecond line\nthird",
    });
    expect(text).toBe("first line");
  });

  it("does not treat an empty or whitespace-only draft as a draft", () => {
    for (const draft of ["", "   ", "\n\n", "\t \n"]) {
      const { text, source } = resolveCardContent({ draft });
      expect(source).toBe("default");
      expect(text).toBe(DEFAULT_PROMPT);
    }
  });

  it("ignores a blank event prompt", () => {
    expect(resolveCardContent({ eventPrompt: "   " }).source).toBe("default");
  });
});

describe("resolveCardContent — type scale", () => {
  it("keeps short text on the larger scale", () => {
    expect(resolveCardContent({ isNight: true }).scale).toBe("large");
    expect(resolveCardContent({}).scale).toBe("large");
  });

  it("drops long text to the smaller scale", () => {
    for (const tier of Object.keys(
      QUIET_RETURN_PROMPTS
    ) as (keyof typeof QUIET_RETURN_PROMPTS)[]) {
      expect(resolveCardContent({ quietReturnTier: tier }).scale).toBe("small");
    }
    expect(
      resolveCardContent({ draft: "a".repeat(200) }).scale,
    ).toBe("small");
  });
});
