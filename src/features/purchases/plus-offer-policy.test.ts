import { describe, expect, it } from "bun:test";
import {
  choosePlusOffer,
  PLUS_OFFER_COOLDOWN_MS,
  PLUS_OFFER_FULL_STOP_MS,
  type PlusOfferInput,
} from "./plus-offer-policy";

const NOW = 1_700_000_000_000;

const base = (over: Partial<PlusOfferInput> = {}): PlusOfferInput => ({
  candidates: [1],
  safeguardActive: false,
  now: NOW,
  ...over,
});

describe("choosePlusOffer", () => {
  it("offers the highest-ranked eligible moment", () => {
    expect(choosePlusOffer(base({ candidates: [3, 5] }))).toEqual({
      show: true,
      moment: 3,
      variant: "default",
    });
  });

  it("offers nothing when no moment is eligible right now", () => {
    expect(choosePlusOffer(base({ candidates: [] }))).toEqual({
      show: false,
      reason: "no_candidate",
    });
  });

  // The one rule that has no exception, including for a surface the user
  // tapped themselves.
  it("vetoes on an active safeguard flow regardless of every other input", () => {
    expect(
      choosePlusOffer(
        base({
          safeguardActive: true,
          userInitiated: true,
          registerComplaint: true,
          candidates: [1, 2, 3, 4, 5],
        }),
      ),
    ).toEqual({ show: false, reason: "safeguard" });
  });

  it("shows at most one offer per session", () => {
    expect(choosePlusOffer(base({ shownThisSession: true }))).toEqual({
      show: false,
      reason: "session_cap",
    });
  });

  it("never offers two sessions in a row", () => {
    expect(choosePlusOffer(base({ shownLastSession: true }))).toEqual({
      show: false,
      reason: "back_to_back",
    });
  });

  it("holds a dismissed surface for seven days, then offers it again", () => {
    const dismissed = { lastDismissedAt: { 1: NOW - PLUS_OFFER_COOLDOWN_MS + 1 } };
    expect(choosePlusOffer(base(dismissed))).toEqual({
      show: false,
      reason: "cooldown",
    });
    expect(
      choosePlusOffer(base({ lastDismissedAt: { 1: NOW - PLUS_OFFER_COOLDOWN_MS } })),
    ).toEqual({ show: true, moment: 1, variant: "default" });
  });

  // Per-surface, not global: a week of silence on moment 1 says nothing about
  // moment 3.
  it("still offers another moment while one surface is cooling down", () => {
    expect(
      choosePlusOffer(base({ candidates: [1, 3], lastDismissedAt: { 1: NOW } })),
    ).toEqual({ show: true, moment: 3, variant: "default" });
  });

  it("stops every surface for thirty days after three lifetime dismissals", () => {
    expect(
      choosePlusOffer(
        base({ candidates: [1, 2, 3], dismissalCount: 3, fullStopSince: NOW }),
      ),
    ).toEqual({ show: false, reason: "full_stop" });
  });

  it("lifts the full stop once the thirty days are up", () => {
    expect(
      choosePlusOffer(
        base({ dismissalCount: 3, fullStopSince: NOW - PLUS_OFFER_FULL_STOP_MS }),
      ),
    ).toEqual({ show: true, moment: 1, variant: "default" });
  });

  // "No stop recorded" must read as not stopped, not as a stop that started at
  // the epoch and never ends — a caller that persists the count without the
  // timestamp would otherwise silently suppress every offer forever.
  it("treats a missing full-stop timestamp as no stop at all", () => {
    expect(
      choosePlusOffer(base({ dismissalCount: 5, fullStopSince: null })),
    ).toEqual({ show: true, moment: 1, variant: "default" });
  });

  it("does not stop before the third dismissal", () => {
    expect(choosePlusOffer(base({ dismissalCount: 2, fullStopSince: NOW }))).toEqual({
      show: true,
      moment: 1,
      variant: "default",
    });
  });

  // If they tapped the locked thing, they asked — cadence governs what the app
  // says unprompted, not what the user opens.
  it("lets a user-initiated surface through every cadence and cooldown check", () => {
    expect(
      choosePlusOffer(
        base({
          userInitiated: true,
          candidates: [],
          shownThisSession: true,
          shownLastSession: true,
          dismissalCount: 9,
          fullStopSince: NOW,
          lastDismissedAt: { 1: NOW },
        }),
      ),
    ).toEqual({ show: true, moment: null, variant: "default" });
  });

  it("swaps the copy variant on the register flag without changing what fires", () => {
    expect(choosePlusOffer(base({ registerComplaint: true }))).toEqual({
      show: true,
      moment: 1,
      variant: "register",
    });
  });

  it("never fires a moment on the register flag alone", () => {
    expect(
      choosePlusOffer(base({ registerComplaint: true, candidates: [] })),
    ).toEqual({ show: false, reason: "no_candidate" });
    expect(
      choosePlusOffer(base({ registerComplaint: true, shownThisSession: true })),
    ).toEqual({ show: false, reason: "session_cap" });
  });
});
