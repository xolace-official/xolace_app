import { useSyncExternalStore } from 'react';
import { useStreamStatus } from './providers/stream-chat-provider';

/**
 * Live unread badge for a `ConversationRow`. Reads `channel.countUnread()`,
 * which is only meaningful once the channel has been watched — already true
 * by the time a row mounts, since the Connect tab's `useChatWarmup` queries
 * and watches every channel in the list ahead of any row rendering. Passive:
 * doesn't call `useStreamConnection`, so a row never opens the socket itself.
 *
 * `channel.countUnread()` reads mutable state Stream owns, not React state —
 * `useSyncExternalStore` re-derives it on every relevant event instead of
 * mirroring it into `useState` via an effect, so there's no seed/reset call
 * to keep in sync by hand.
 */
export function useConversationUnreadCount(streamChannelId: string | undefined) {
  const { client, status } = useStreamStatus();
  const channel =
    status === 'ready' && client && streamChannelId
      ? client.channel('messaging', streamChannelId)
      : null;

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!channel) return () => {};
      const listeners = [
        channel.on('message.new', onStoreChange),
        channel.on('message.read', onStoreChange),
        channel.on('message.read_locally', onStoreChange),
        channel.on('notification.mark_unread', onStoreChange),
      ];
      return () => listeners.forEach((listener) => listener.unsubscribe());
    },
    () => channel?.countUnread() ?? 0,
  );
}
