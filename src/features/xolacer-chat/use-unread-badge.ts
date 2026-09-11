import { useCallback, useSyncExternalStore } from 'react';
import type { StreamChat } from 'stream-chat';
import { useStreamStatus } from '@/src/features/xolacer-chat/providers/stream-chat-provider';
import { badgeFromEvents } from '@/src/features/xolacer-chat/unread-badge';

/**
 * Held beside the client rather than read off `client.user`: the SDK only
 * writes `total_unread_count` there on the handshake, not on later events.
 * One entry per client instance, so every hook instance folds the same stream
 * once and reads one number. `null` until Stream has said one.
 */
const totals = new WeakMap<StreamChat, number | null>();

function seed(client: StreamChat): number | null {
  const me = client.user;
  return me && 'total_unread_count' in me ? (me.total_unread_count ?? null) : null;
}

/**
 * The one unread number, across every conversation. Feeds the Connect tab
 * badge and the app-icon badge so the two can never disagree. Passive: reads
 * whatever client the provider already holds and never opens the socket —
 * a user who has never used chat has nothing to count.
 *
 * `null` until Stream has said a number — no client, or a socket that hasn't
 * handshaken yet. Callers must treat that as "unknown", not zero: the icon
 * badge a push just set is right until Stream says otherwise.
 */
export function useUnreadBadge(): number | null {
  const { client, status } = useStreamStatus();
  const connected = status === 'ready' ? client : null;

  // Stable per client for the same reason as `useConversationUnreadCount`.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!connected) return () => {};
      if (!totals.has(connected)) totals.set(connected, seed(connected));
      const { unsubscribe } = connected.on((event) => {
        const next = badgeFromEvents(totals.get(connected) ?? 0, event);
        if (next === totals.get(connected)) return;
        totals.set(connected, next);
        onStoreChange();
      });
      return unsubscribe;
    },
    [connected],
  );

  return useSyncExternalStore(subscribe, () =>
    connected ? (totals.get(connected) ?? seed(connected)) : null,
  );
}
