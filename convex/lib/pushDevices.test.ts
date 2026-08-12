import { describe, expect, it } from "bun:test";
import {
  canPrunePushHistory,
  classifyPushDevice,
  PUSH_DEVICE_MAX_AGE_MS,
  PUSH_HISTORY_PRUNE_GRACE_MS,
  PUSH_SEND_SETTLE_MS,
  reconcilePushDevice,
} from "./pushDevices";

const PROFILE = "profile_a";
const OTHER = "profile_b";

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe("reconcilePushDevice", () => {
  // A token nobody holds yet: nothing to clean up, nothing to reuse. This is
  // also rotation — a rotated token matches nothing and inserts, leaving the
  // device's old row for the 180-day clock in `classifyPushDevice`.
  it("inserts when no row holds the token", () => {
    expect(reconcilePushDevice([], PROFILE)).toEqual({
      keepId: null,
      deleteIds: [],
    });
  });

  // Relaunch on a device already registered — the common case, and the one
  // that must never create a second recipient.
  it("reuses this profile's existing row", () => {
    expect(
      reconcilePushDevice([{ _id: "d1", emotionalProfileId: PROFILE }], PROFILE),
    ).toEqual({ keepId: "d1", deleteIds: [] });
  });

  // The privacy fix: a reinstalled or handed-down device must not stay
  // attached to whoever held it before.
  it("takes ownership of a token held by another profile", () => {
    expect(
      reconcilePushDevice([{ _id: "d1", emotionalProfileId: OTHER }], PROFILE),
    ).toEqual({ keepId: null, deleteIds: ["d1"] });
  });

  it("keeps one row and deletes duplicates under the same profile", () => {
    expect(
      reconcilePushDevice(
        [
          { _id: "d1", emotionalProfileId: PROFILE },
          { _id: "d2", emotionalProfileId: PROFILE },
        ],
        PROFILE,
      ),
    ).toEqual({ keepId: "d1", deleteIds: ["d2"] });
  });

  it("keeps this profile's row while evicting a foreign holder", () => {
    expect(
      reconcilePushDevice(
        [
          { _id: "d1", emotionalProfileId: OTHER },
          { _id: "d2", emotionalProfileId: PROFILE },
        ],
        PROFILE,
      ),
    ).toEqual({ keepId: "d2", deleteIds: ["d1"] });
  });
});

describe("classifyPushDevice", () => {
  const recent = { lastRegisteredAt: NOW - 7 * DAY, now: NOW };

  // The whole point of the concept: no delivery history plus a recent clock is
  // a dormant device, which is exactly who the return nudge is built to reach.
  it("keeps a dormant device with no delivery history", () => {
    expect(classifyPushDevice({ latestStates: [], ...recent })).toBe("keep");
  });

  it("reaps a device whose newest notification could not be delivered", () => {
    expect(
      classifyPushDevice({ latestStates: ["unable_to_deliver"], ...recent }),
    ).toBe("dead");
  });

  // Every non-terminal state, plus the watchdog's ambiguous bucket. Reaping on
  // any of these would delete devices that are merely mid-retry.
  it.each([
    "awaiting_delivery",
    "in_progress",
    "needs_retry",
    "failed",
    "maybe_delivered",
    "delivered",
  ] as const)("keeps a device whose newest notification is %s", (state) => {
    expect(classifyPushDevice({ latestStates: [state], ...recent })).toBe(
      "keep",
    );
  });

  // Only the newest verdict counts: five rejections followed by a delivery
  // means the token started working again.
  it("ignores an older failure once something newer was delivered", () => {
    expect(
      classifyPushDevice({
        latestStates: ["delivered", "unable_to_deliver"],
        ...recent,
      }),
    ).toBe("keep");
  });

  // The rotation orphan: abandoned by a token change, never sent to, so no
  // delivery verdict will ever arrive. The clock is its only reaper.
  it("reaps an orphan with a stale clock and no history", () => {
    expect(
      classifyPushDevice({
        latestStates: [],
        lastRegisteredAt: NOW - PUSH_DEVICE_MAX_AGE_MS - 1,
        now: NOW,
      }),
    ).toBe("expired");
  });

  it("keeps a device on the day the clock threshold is reached", () => {
    expect(
      classifyPushDevice({
        latestStates: [],
        lastRegisteredAt: NOW - PUSH_DEVICE_MAX_AGE_MS,
        now: NOW,
      }),
    ).toBe("keep");
  });

  // A device can be both; the delivery verdict is the more specific answer.
  it("reports the delivery verdict ahead of the clock", () => {
    expect(
      classifyPushDevice({
        latestStates: ["unable_to_deliver"],
        lastRegisteredAt: NOW - PUSH_DEVICE_MAX_AGE_MS - 1,
        now: NOW,
      }),
    ).toBe("dead");
  });
});

describe("canPrunePushHistory", () => {
  const settled = NOW - PUSH_HISTORY_PRUNE_GRACE_MS - 1;

  it("does nothing when the device has no stored notifications", () => {
    expect(canPrunePushHistory([], NOW)).toBe(false);
  });

  it("prunes a settled history of finished rows", () => {
    expect(
      canPrunePushHistory(
        [
          { state: "delivered", _creationTime: settled },
          { state: "unable_to_deliver", _creationTime: settled - DAY },
          { state: "maybe_delivered", _creationTime: settled - 2 * DAY },
        ],
        NOW,
      ),
    ).toBe(true);
  });

  // The blast radius this guard exists for: deleting a row the sender still
  // holds makes its `markNotificationState` patch a missing document, which
  // throws and takes the state update for the other 99 users in that batch
  // down with it. `awaiting_delivery` and `needs_retry` are safe from that
  // angle — only the coordinator mutation reads them — and are refused because
  // they are pushes the user has not received yet.
  it.each([
    "awaiting_delivery",
    "in_progress",
    "needs_retry",
    "failed",
  ] as const)("refuses while a row is %s", (state) => {
    expect(canPrunePushHistory([{ state, _creationTime: settled }], NOW)).toBe(
      false,
    );
  });

  // Age never rescues an unfinished row: `in_progress` means an action holds
  // this id right now, whenever the row happened to be queued.
  it("refuses an in-flight row however old it is", () => {
    expect(
      canPrunePushHistory(
        [{ state: "in_progress", _creationTime: NOW - 30 * DAY }],
        NOW,
      ),
    ).toBe(false);
  });

  // An older in-flight row hides behind a newer delivered one, so the newest
  // row alone is not enough to clear the history.
  it("refuses when an older row is still mid-retry", () => {
    expect(
      canPrunePushHistory(
        [
          { state: "delivered", _creationTime: settled },
          { state: "needs_retry", _creationTime: settled - DAY },
        ],
        NOW,
      ),
    ).toBe(false);
  });

  // The watchdog parks a slow sender here and the action can still report back
  // afterwards, from outside any transaction — the one case that needs the long
  // grace rather than the short settle.
  it("refuses a maybe_delivered row inside the grace period", () => {
    expect(
      canPrunePushHistory(
        [
          {
            state: "maybe_delivered",
            _creationTime: NOW - PUSH_HISTORY_PRUNE_GRACE_MS + 1000,
          },
        ],
        NOW,
      ),
    ).toBe(false);
  });

  // A watchdog mutation already in flight can still target a just-delivered
  // row, because cancelling a job that has started is a no-op.
  it("refuses a delivered row that has not settled", () => {
    expect(
      canPrunePushHistory(
        [{ state: "delivered", _creationTime: NOW - 1000 }],
        NOW,
      ),
    ).toBe(false);
  });

  // The regression this shape exists for: opening the app from a notification
  // tap used to leave the history unprunable at the exact moment the device
  // proved it was alive, because the newest row was minutes old.
  it("prunes a delivered history a minute after the send", () => {
    expect(
      canPrunePushHistory(
        [{ state: "delivered", _creationTime: NOW - PUSH_SEND_SETTLE_MS }],
        NOW,
      ),
    ).toBe(true);
  });
});
