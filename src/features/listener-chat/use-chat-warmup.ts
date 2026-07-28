import { useEffect } from 'react';
import { useStreamConnection } from './providers/stream-chat-provider';
import type { ConversationList } from './components/chats-list';

/**
 * `queryChannels` caps at 30 per call. The rows are warmed most-recent-first so
 * the ones over the cap are the least likely to be opened.
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
        { watch: true, limit: MAX_PREFETCH },
      )
      .catch((error) => console.error('[listener-chat] channel prefetch failed', error));
  }, [enabled, client, channelIds]);
}
