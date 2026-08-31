import { describe, expect, it } from "vitest";
import { chooseCloseOffer } from "./close-offer-rule";

const person = { displayName: "Maya" };

describe("chooseCloseOffer", () => {
  it("gives the slot to the suggestion even when the Bridge gate also passes", () => {
    // The whole point: Bridge must not win ties, or the suggestion never ships.
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: person,
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("suggestion");
  });

  it("falls back to the Bridge card when there is no suggestion", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("bridge");
  });

  it("shows nothing while the suggestion query is still in flight", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("pending");
  });

  // Offline, or auth not yet hydrated: the query never resolves. Holding the
  // slot forever would offer the user nothing at all, which is worse than the
  // Bridge card the wait was protecting.
  it("falls back to Bridge once the wait is out", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        waitedOut: true,
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("bridge");
  });

  it("shows nothing once the wait is out if Bridge is unavailable too", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        waitedOut: true,
        bridgeEnabled: false,
        hasMirrorText: true,
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
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("suggestion");
  });

  it("does not wait forever when there is no session to ask about", () => {
    expect(
      chooseCloseOffer({
        hasSession: false,
        suggestion: undefined,
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("bridge");
  });

  it("offers nothing when neither gate passes", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
        bridgeEnabled: false,
        hasMirrorText: true,
      }),
    ).toBe("none");
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
        bridgeEnabled: true,
        hasMirrorText: false,
      }),
    ).toBe("none");
  });

  it("still offers the suggestion when Bridge is switched off", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: person,
        bridgeEnabled: false,
        hasMirrorText: false,
      }),
    ).toBe("suggestion");
  });
});

describe("chooseCloseOffer — the Plus moment", () => {
  it("takes the slot from the Bridge card", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
        plusOffer: true,
        bridgeEnabled: true,
        hasMirrorText: true,
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
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("suggestion");
  });

  it("still waits for a suggestion that may yet arrive", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: undefined,
        plusOffer: true,
        bridgeEnabled: true,
        hasMirrorText: true,
      }),
    ).toBe("pending");
  });

  it("is the only offer when Bridge has nothing to show either", () => {
    expect(
      chooseCloseOffer({
        hasSession: true,
        suggestion: null,
        plusOffer: true,
        bridgeEnabled: false,
        hasMirrorText: false,
      }),
    ).toBe("plus");
  });
});
