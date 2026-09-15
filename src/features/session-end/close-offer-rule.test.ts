import { describe, expect, it } from "vitest";
import { chooseCloseOffer } from "./close-offer-rule";

const person = { displayName: "Maya" };

describe("chooseCloseOffer", () => {
  it("gives the slot to the suggestion even when Plus also qualifies", () => {
    // The whole point: a suggestion always wins.
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: person,
        plusOffer: true,
      }),
    ).toBe("suggestion");
  });

  it("falls back to none when there is no suggestion", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
      }),
    ).toBe("none");
  });

  it("shows nothing while the suggestion query is still in flight", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
      }),
    ).toBe("pending");
  });

  // Offline, or auth not yet hydrated: the query never resolves. Holding the
  // slot forever would offer the user nothing at all, and once waited out
  // there is no fallback left but none.
  it("falls back to none once the wait is out", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        waitedOut: true,
      }),
    ).toBe("none");
  });

  // A late arrival still wins — waiting out bounds the hold, it doesn't
  // discard a suggestion that lands afterwards.
  it("still prefers a suggestion that arrives after the wait is out", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: person,
        waitedOut: true,
      }),
    ).toBe("suggestion");
  });

  it("does not wait forever when there is no session to ask about", () => {
    expect(
      chooseCloseOffer({
        hasSession: false,
        suggestion: undefined,
      }),
    ).toBe("none");
  });

  it("offers nothing when there is no suggestion and no Plus moment", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
      }),
    ).toBe("none");
  });
});

describe("chooseCloseOffer — the Plus moment", () => {
  it("takes the slot when there is no suggestion", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
        plusOffer: true,
      }),
    ).toBe("plus");
  });

  // The rarer offer still wins: a suggestion has survived a theme match, an
  // intensity floor, a safeguard gate and a weekly cooldown to get here.
  it("yields to a suggestion", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: person,
        plusOffer: true,
      }),
    ).toBe("suggestion");
  });

  it("still waits for a suggestion that may yet arrive", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        plusOffer: true,
      }),
    ).toBe("pending");
  });

  it("is the only offer once the wait is out", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        waitedOut: true,
        plusOffer: true,
      }),
    ).toBe("plus");
  });
});
