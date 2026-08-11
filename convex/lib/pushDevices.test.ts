import { describe, expect, it } from "bun:test";
import { reconcilePushDevice } from "./pushDevices";

const PROFILE = "profile_a";
const OTHER = "profile_b";

describe("reconcilePushDevice", () => {
  // A token nobody holds yet: nothing to clean up, nothing to reuse. This is
  // also rotation — a rotated token matches nothing and inserts, leaving the
  // installation's old row for receipt-driven cleanup (#152).
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
