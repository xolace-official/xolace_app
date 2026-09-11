import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useUnreadBadge } from '@/src/features/xolacer-chat/use-unread-badge';

/**
 * Mirrors Stream's unread total onto the app icon. Renders nothing; mounted
 * above the Stack so a read in a thread, on the list, or on another device
 * drops the badge whichever screen the user is on. Foreground only: the SDK
 * closes the socket in the background, so a read elsewhere lands on the next
 * handshake rather than the instant it happens. A chat push sets the same number
 * server-side (`chatNotifications.sendMessagePush`), so the two surfaces agree
 * and the badge means "messages" and only that — non-chat pushes never badge.
 *
 * Skipped while the number is unknown: clearing a push-set badge on a cold
 * start before Stream has spoken would be the stale-badge defect in reverse.
 */
export function UnreadIconBadge() {
  const count = useUnreadBadge();
  useEffect(() => {
    if (count === null) return;
    Notifications.setBadgeCountAsync(count).catch((error) =>
      console.warn('[xolacer-chat] icon badge update failed', error),
    );
  }, [count]);
  return null;
}
