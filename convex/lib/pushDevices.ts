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
 * States the component will not queue further work for. Anything else has a
 * `markNotificationState` patch still coming.
 *
 * `failed` never actually persists — it is the argument that gets written as
 * `needs_retry` — and is listed anyway so a component version that does store
 * it cannot quietly become prunable.
 */
const TERMINAL_PUSH_STATES = new Set<PushNotificationState>([
  "delivered",
  "maybe_delivered",
  "unable_to_deliver",
]);

/**
 * Grace period before a terminal-looking history counts as settled.
 *
 * `maybe_delivered` is where the component's 10-second watchdog parks a send
 * whose action has not reported back yet, and that action *can* still report
 * back afterwards. Registration frequently runs seconds after a send — tapping
 * a notification cold-starts the app — so terminal state alone is not enough.
 */
export const PUSH_HISTORY_PRUNE_GRACE_MS = 15 * 60 * 1000;

export type PushHistoryRow = {
  state: PushNotificationState;
  _creationTime: number;
};

/**
 * Whether a device's stored notifications can be deleted.
 *
 * The component's delete is all-or-nothing for the device, so one in-flight row
 * anywhere in the window vetoes it: deleting a row the sender still holds makes
 * its state patch hit a missing document and throw, taking the bookkeeping for
 * up to 99 other users in the same batch down with it. On registration refusing
 * costs nothing — the next one tries again. On device removal it strands that
 * device's bodies permanently, and that is still the better trade.
 *
 * ponytail: an in-flight row older than the read window is invisible here. It
 * would have to sit behind a full window of newer notifications, and the
 * component retries `needs_retry` continuously, so that means genuinely stuck.
 */
export function canPrunePushHistory(
  rows: PushHistoryRow[],
  now: number,
): boolean {
  if (rows.length === 0) return false;
  if (now - rows[0]._creationTime < PUSH_HISTORY_PRUNE_GRACE_MS) return false;
  return rows.every((row) => TERMINAL_PUSH_STATES.has(row.state));
}
