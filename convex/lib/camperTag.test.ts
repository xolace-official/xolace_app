import { describe, expect, it } from "bun:test";
import { camperName, generateCamperTag, legacyCamperTag } from "./camperTag";

const SHAPE = /^[A-Z0-9]{4}$/;

describe("generateCamperTag", () => {
  it("draws four uppercase alphanumerics", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCamperTag()).toMatch(SHAPE);
    }
  });

  it("never returns a taken tag", () => {
    // Every tag over one small alphabet slice is taken, so the draw has to
    // keep going until it lands outside it.
    const taken = new Set<string>();
    for (const a of "AB") {
      for (const b of "AB") {
        for (const c of "AB") {
          for (const d of "AB") taken.add(a + b + c + d);
        }
      }
    }
    for (let i = 0; i < 200; i++) {
      const tag = generateCamperTag(taken);
      expect(tag).toMatch(SHAPE);
      expect(taken.has(tag)).toBe(false);
    }
  });

  it("keeps a preferred tag that is free, and drops one that is not", () => {
    expect(generateCamperTag(["AAAA"], "BBBB")).toBe("BBBB");
    const tag = generateCamperTag(["BBBB"], "BBBB");
    expect(tag).not.toBe("BBBB");
    expect(tag).toMatch(SHAPE);
  });
});

describe("legacyCamperTag", () => {
  it("takes the last four characters of the pair row id, uppercased", () => {
    expect(legacyCamperTag("kd7abc4f2a")).toBe("4F2A");
    expect(legacyCamperTag("kd7abc4f2a")).toMatch(SHAPE);
  });
});

describe("camperName", () => {
  it("is the word and the tag", () => {
    expect(camperName("4F2A")).toBe("Camper 4F2A");
  });
});
