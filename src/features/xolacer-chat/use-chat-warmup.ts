import { useEffect } from 'react';
import { useStreamConnection } from './providers/stream-chat-provider';
import type { ConversationList } from './components/chats-list';

/**
 * `queryChannels` caps at 30 per call. The rows are warmed most-recent-first so
 * the ones over the cap are the least likely to be opened.
 *
 * Known ceiling, not a defect: a conversation past this cap is never watched,
 * so `countUnread()` on it stays 0 and no events arrive for it — its row shows
 * no unread badge, ever. Accepted for the same reason the cap exists.
 *
 * ponytail: paginate only if someone actually accumulates 30+ live threads.
 */
const MAX_PREFETCH = 30;

/**
 * Removes the two round trips a thread open used to pay for.
 *
 * The connection is the first: opening it here means the WS handshake overlaps
 * with the user reading their conversation list, instead of running after they
 * tap a row.
 *
 * The channel state is the second. `queryChannels` populates
 * `client.activeChannels`, and `getChannelById` hands the cached instance back
 * to the `client.channel(...)` call in `ThreadMessages` — already `initialized`,
 * so `useWatchedChannel` short-circuits and messages paint on the first frame
 * with no `watch()` at all.
 *
 * It also populates every watched channel's unread count, and *that* needs
 * announcing. Stream dispatches `channels.queried` from inside `queryChannels`
 * — but before `hydrateActiveChannels` runs, so a listener that re-reads
 * `countUnread()` on it still sees zero. Rows have already subscribed by then
 * and nothing tells them to look again, which is why every unread badge was
 * blank until some unrelated re-render happened along. Re-announcing the same
 * event once the counts are actually there lands the badges on the first
 * paint. Deliberately sent through the client's own bus rather than a React
 * state bump: the rows read Stream's state through `useSyncExternalStore`, and
 * the React Compiler caches the list subtree on props that a hydration flag
 * would not be part of — the re-render would never reach them.
 */
export function useChatWarmup(
  conversations: ConversationList | undefined,
  enabled: boolean,
) {
  const { client } = useStreamConnection(enabled);

  const channelIds = (conversations ?? [])
    .filter((conversation) => conversation.streamChannelId)
    .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0))
    .slice(0, MAX_PREFETCH)
    .map((conversation) => conversation.streamChannelId as string)
    .join(',');

  useEffect(() => {
    if (!enabled || !client || !channelIds) return;
    // Not cancellable, and deliberately not awaited: the only effect that
    // matters is the client-side cache it fills, which a later mount still
    // benefits from. Nothing here renders the result.
    client
      .queryChannels(
        { id: { $in: channelIds.split(',') }, members: { $in: [client.userID as string] } },
        { last_message_at: -1 },
        { watch: true, presence: true, limit: MAX_PREFETCH },
      )
      .then(() => client.dispatchEvent({ type: 'channels.queried' }))
      .catch((error) => console.error('[xolacer-chat] channel prefetch failed', error));
  }, [enabled, client, channelIds]);
}
