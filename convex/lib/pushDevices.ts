/**
 * Pure rules for the app-owned push device registry: which row a registration
 * reuses, when a device is past saving, and when its notification history is
 * safe to clear.
 *
 * The Expo push token *is* the device key — it is already a stable
 * per-device identifier, so no separate device id is stored. The
 * consequence is that a token rotation looks like a brand new device and
 * orphans the old row; that orphan holds a token Expo would reject, and is
 * reaped by the 180-day `lastRegisteredAt` clock rather than by a delivery
 * failure, because nothing is ever successfully sent to it. See
 * docs/adr/0001-no-expo-receipts.md.
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

/**
 * The push component's per-notification delivery states, newest-first as
 * `getNotificationsForUser` returns them.
 */
export type PushNotificationState =
  | "awaiting_delivery"
  | "in_progress"
  | "delivered"
  | "needs_retry"
  | "failed"
  | "maybe_delivered"
  | "unable_to_deliver";

/**
 * How long a device may go without registering before it is assumed gone.
 *
 * Far clear of the 30-day inactivity cap both nudge families already apply
 * (`convex/jobs/notificationTriggers.ts`), so the only thing this can cost is a
 * chat notification to someone who has not opened the app in half a year.
 */
export const PUSH_DEVICE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type PushDeviceVerdict = "keep" | "dead" | "expired";

/**
 * Decide whether a device is still worth sending to.
 *
 * Both reap rules live here so the two callers cannot drift, and so the one
 * distinction that matters is enforced in a tested place: **dead is not
 * dormant.** A device with no delivery history and a recent clock is someone
 * who simply has not opened the app, which is precisely who the return nudge
 * exists to reach — see CONTEXT.md.
 *
 * `latestStates` is the device's notification history newest-first, passed
 * through untouched from the component. Only the head decides: reading it here
 * rather than at the call site keeps "most recent" part of what the tests pin
 * down. `unable_to_deliver` alone means dead — it is five consecutive Expo
 * rejections, not one failure, and every other state is either mid-retry or
 * the watchdog's ambiguous bucket. See docs/adr/0001-no-expo-receipts.md.
 */
export function classifyPushDevice(args: {
  latestStates: PushNotificationState[];
  lastRegisteredAt: number;
  now: number;
}): PushDeviceVerdict {
  if (args.latestStates[0] === "unable_to_deliver") return "dead";
  if (args.now - args.lastRegisteredAt > PUSH_DEVICE_MAX_AGE_MS) {
    return "expired";
  }
  return "keep";
}

/**
 * Grace period before a `maybe_delivered` row counts as settled.
 *
 * That state is where the component's 10-second watchdog parks a send whose
 * action has not reported back yet, and the action *can* still come back
 * afterwards and patch the row — from a scheduled action, so no transaction
 * covers the gap. Sized to outlast an action rather than a mutation.
 */
export const PUSH_HISTORY_PRUNE_GRACE_MS = 15 * 60 * 1000;

/**
 * How long a genuinely finished row has to sit before it is safe to delete.
 *
 * `markNotificationState` cancels the watchdog in the same transaction that
 * writes the final state, but cancelling a job that already started is a no-op
 * — so a just-delivered row can still be the target of a watchdog mutation
 * already in flight. That job is scheduled 10s after the send; a minute clears
 * it with room to spare.
 */
export const PUSH_SEND_SETTLE_MS = 60 * 1000;

export type PushHistoryRow = {
  state: PushNotificationState;
  _creationTime: number;
};

/**
 * Whether one stored notification is past everything that might still write to
 * it.
 *
 * Only references that escape the transaction system can be hurt by a delete:
 * a scheduled *action* holding notification ids in its args. That is
 * `in_progress` (a sender is running right now) and `maybe_delivered` (the
 * watchdog gave up but the action can still report). Everything the coordinator
 * mutation touches — `awaiting_delivery`, `needs_retry` — is safe from that
 * angle, because Convex serializes it against our delete either way.
 *
 * They are refused anyway, for the other reason: they are pushes that have not
 * been delivered yet, and pruning at registration must not silently drop the
 * user's queued notifications. `failed` never persists (it is the argument
 * written as `needs_retry`) and is refused so a component version that does
 * store it cannot quietly become prunable.
 *
 * ponytail: `_creationTime` is when the row was queued, not when it entered its
 * current state, so a long queue wait makes both windows read early. Same
 * approximation as before; the component exposes no state timestamp.
 */
function isSettledPushRow(row: PushHistoryRow, now: number): boolean {
  const age = now - row._creationTime;
  switch (row.state) {
    case "maybe_delivered":
      return age >= PUSH_HISTORY_PRUNE_GRACE_MS;
    case "delivered":
    case "unable_to_deliver":
      return age >= PUSH_SEND_SETTLE_MS;
    default:
      return false;
  }
}

/**
 * Whether a device's stored notifications can be deleted.
 *
 * The component's delete is all-or-nothing for the device, so one unsettled row
 * anywhere in the window vetoes it: deleting a row a sender still holds makes
 * its state patch hit a missing document and throw, taking the bookkeeping for
 * up to 99 other users in the same batch down with it. On registration refusing
 * costs nothing — the next one tries again. On device removal it strands that
 * device's bodies permanently, and that is still the better trade.
 *
 * Judged per row rather than by the newest one's age, because the hazard is
 * per row. A blanket age gate on the head vetoed the single most common
 * registration there is — tapping a notification cold-starts the app, so the
 * newest row is a `delivered` one seconds old — and that device never got
 * pruned at the moment it proved it was alive.
 *
 * ponytail: an unsettled row older than the read window is invisible here. It
 * would have to sit behind a full window of newer notifications, and the
 * component retries `needs_retry` continuously, so that means genuinely stuck.
 */
export function canPrunePushHistory(
  rows: PushHistoryRow[],
  now: number,
): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => isSettledPushRow(row, now));
}
