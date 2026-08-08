import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { conversationNotificationIds } from '@/src/lib/notification-suppression';

/**
 * Clears the tray of anything still sitting there for a conversation the user
 * has just opened — the thread itself has now said everything the banner was
 * for. Only that conversation's entries go: someone else waiting on you in
 * another thread is not answered by this one being read.
 *
 * Best-effort. A failure leaves a stale banner, which is not worth an error
 * surface of its own.
 */
export function useDismissThreadNotifications(conversationId: string) {
  useEffect(() => {
    Notifications.getPresentedNotificationsAsync()
      .then((presented) =>
        Promise.all(
          conversationNotificationIds(presented, conversationId).map((id) =>
            Notifications.dismissNotificationAsync(id),
          ),
        ),
      )
      .catch((error) =>
        console.log('[xolacer-chat] failed to clear conversation tray', error),
      );
  }, [conversationId]);
}
