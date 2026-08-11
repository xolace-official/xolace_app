/**
 * Pure reconciliation for the app-owned push device registry.
 *
 * The Expo push token *is* the device key — it is already a stable
 * per-installation identifier, so no separate device id is stored. The
 * consequence is that a token rotation looks like a brand new device and
 * orphans the old row; that orphan holds a token Expo answers with
 * `DeviceNotRegistered` and is cleaned up by receipt handling (#152).
 *
 * Kept free of Convex imports so it can be covered by `bun test`, which is how
 * every other piece of notification logic in this repo is tested.
 */

export type PushDeviceRow<TId extends string> = {
  _id: TId;
  emotionalProfileId: string;
};

export type PushDeviceReconciliation<TId extends string> = {
  /** Row to reuse for this registration, or null when one must be inserted. */
  keepId: TId | null;
  /**
   * Rows to delete along with their component recipients: any row holding this
   * token under a different profile (ownership transfer — a reinstalled or
   * handed-down device must never inherit the previous account's
   * notifications), plus any duplicate row under this profile.
   */
  deleteIds: TId[];
};

/**
 * Decide what to do with every registry row currently holding an incoming
 * token, given the profile that is registering it.
 */
export function reconcilePushDevice<TId extends string>(
  rowsForToken: PushDeviceRow<TId>[],
  emotionalProfileId: string,
): PushDeviceReconciliation<TId> {
  let keepId: TId | null = null;
  const deleteIds: TId[] = [];

  for (const row of rowsForToken) {
    if (row.emotionalProfileId === emotionalProfileId && keepId === null) {
      keepId = row._id;
    } else {
      deleteIds.push(row._id);
    }
  }

  return { keepId, deleteIds };
}
