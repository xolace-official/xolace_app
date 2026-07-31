import { describe, expect, it } from "bun:test";
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
