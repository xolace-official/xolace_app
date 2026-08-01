import { describe, expect, it } from "bun:test";
import {
  isSpecialty,
  MAX_SPECIALTIES,
  SPECIALTIES,
  specialtyLabel,
  specialtyListensTo,
} from "./specialties";

describe("isSpecialty", () => {
  it("accepts a declared slug", () => {
    expect(isSpecialty("anxiety")).toBe(true);
  });

  it("rejects a slug nothing declares", () => {
    expect(isSpecialty("depression")).toBe(false);
  });

  // The guard exists for route params, where the value is whatever was typed
  // into the URL — including nothing at all.
  it("rejects undefined", () => {
    expect(isSpecialty(undefined)).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(isSpecialty("")).toBe(false);
  });

  it("is case-sensitive, so a display label is not a slug", () => {
    expect(isSpecialty("Anxiety")).toBe(false);
  });
});

describe("specialtyLabel / specialtyListensTo", () => {
  it("returns the declared label", () => {
    expect(specialtyLabel("anxiety")).toBe("Anxiety");
  });

  it("returns the declared listensTo phrase", () => {
    expect(specialtyListensTo("loneliness")).toBe("loneliness");
  });

  // Falling back to the raw slug keeps the sentence grammatical rather than
  // rendering "undefined" at the user.
  it("falls back to the slug when nothing matches", () => {
    expect(specialtyLabel("nonexistent")).toBe("nonexistent");
    expect(specialtyListensTo("nonexistent")).toBe("nonexistent");
  });
});

describe("the taxonomy itself", () => {
  it("has unique slugs", () => {
    const slugs = SPECIALTIES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // The guard that matters: the suggestion card renders
  // "<name> listens to <listensTo>." A specialty added without one would fall
  // back to its slug and ship "Maya listens to change." to a user at the end
  // of a heavy session.
  for (const specialty of SPECIALTIES) {
    it(`"${specialty.slug}" has copy for every surface`, () => {
      expect(specialty.label.length).toBeGreaterThan(0);
      expect(specialty.pickerLabel.length).toBeGreaterThan(0);
      expect(specialty.listensTo.length).toBeGreaterThan(0);
    });

  }

  it("caps what a profile may declare below the taxonomy size", () => {
    expect(MAX_SPECIALTIES).toBeLessThan(SPECIALTIES.length);
  });
});
