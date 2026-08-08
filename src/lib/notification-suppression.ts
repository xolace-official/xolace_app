/**
 * Keeping the app from talking over itself.
 *
 * Suppression is client-side and lives here rather than in the sender, because
 * the notification handler only runs while the app is foregrounded — so a
 * single branch on conversation types covers both "the app is open" and "this
 * thread is open", the second being a subset of the first. Stream sends push
 * irrespective of online status and holds a websocket for up to a minute after
 * backgrounding, so server-side eligibility could not be relied on either way.
 */
import { isChatNotificationType } from '@/convex/lib/chatNotifications';

/** A push payload as it actually arrives: an open bag, nothing guaranteed. */
type NotificationData = Record<string, unknown> | undefined | null;

/**
 * Shape of a delivered notification, narrowed to what the tray sweep reads —
 * which is also what keeps this module free of `expo-notifications`, and so
 * runnable under `bun test`.
 */
type PresentedNotification = {
  request: { identifier: string; content: { data?: NotificationData } };
};

/**
 * Conversation notifications are the ones the app must stay quiet about while
 * it is in use — the thread itself is the notification. AI nudges are not:
 * nothing on screen is already saying what they say.
 */
export function suppressedInForeground(data: NotificationData): boolean {
  return isChatNotificationType(data?.type);
}

/**
 * Which already-delivered notifications belong to one conversation. Matched on
 * both type and id so a nudge that happens to carry a conversation id is never
 * swept out of the tray with them.
 */
export function conversationNotificationIds(
  presented: PresentedNotification[],
  conversationId: string,
): string[] {
  return presented
    .filter((n) => {
      const data = n.request.content.data;
      return (
        isChatNotificationType(data?.type) && data?.conversationId === conversationId
      );
    })
    .map((n) => n.request.identifier);
}
