import { describe, expect, it } from "vitest";
import { shouldOfferKindlingAnnouncement } from "@/src/features/kindling/kindling-announcement";

/**
 * Ways this can fail (written before the function):
 * 1. A non-qualifying session (`supportNeed: "none"`) shows the screen — to
 *    a subscriber or a free user.
 * 2. Plus/free swapped: a subscriber gets the upsell, or a free user is told
 *    kindling is being set up.
 * 3. Entitlement still resolving (hook reports `isPlus: false` until settled)
 *    reads as free, flashing the upsell at a subscriber for a frame.
 * 4. An unknown / missing `supportNeed` (old session rows) is treated as
 *    qualifying.
 */
const offer = (
  supportNeed: "none" | "light" | "active" | undefined,
  isPlus: boolean,
  isResolved = true,
) => shouldOfferKindlingAnnouncement({ supportNeed, isPlus, isResolved });

describe("shouldOfferKindlingAnnouncement", () => {
  it.each([true, false])("no support need → none (isPlus %s)", (isPlus) => {
    expect(offer("none", isPlus)).toBe("none");
  });

  it.each(["light", "active"] as const)("%s + plus → plus", (supportNeed) => {
    expect(offer(supportNeed, true)).toBe("plus");
  });

  it.each(["light", "active"] as const)("%s + free → free", (supportNeed) => {
    expect(offer(supportNeed, false)).toBe("free");
  });

  it.each(["none", "light", "active"] as const)(
    "%s + entitlement resolving → none",
    (supportNeed) => {
      expect(offer(supportNeed, false, false)).toBe("none");
      expect(offer(supportNeed, true, false)).toBe("none");
    },
  );

  it("missing support need → none", () => {
    expect(offer(undefined, true)).toBe("none");
  });
});
