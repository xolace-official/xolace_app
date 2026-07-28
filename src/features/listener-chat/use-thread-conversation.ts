import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { ThreadConversation } from './components/thread-screen';

/**
 * The thread's conversation, seeded from the list the user tapped it in.
 *
 * `getConversation` is a cold subscription on every open — a round trip the
 * user watches as a skeleton, for a row the Connect tab is already subscribed
 * to. Reading `myConversations` here resolves from the Convex client's store on
 * the first render while that tab is mounted (`NativeTabs` keeps it mounted for
 * the whole tab group), so the thread paints immediately and swaps to the
 * authoritative document when it lands.
 *
 * Returns `undefined` when there is nothing to seed from — a push-notification
 * deep link, or a cold launch straight into this route — and the skeleton is
 * then telling the truth.
 */
export function useThreadConversation(
  conversationId: string,
): ThreadConversation | null | undefined {
  const conversation = useQuery(api.listenerChat.getConversation, {
    conversationId: conversationId as Id<'listener_conversations'>,
  });

  // Dropped once the real document lands: the Connect tab holds this
  // subscription anyway, and staying on it would re-render the open thread
  // every time any *other* conversation in the list changed.
  const rows = useQuery(
    api.listenerChat.myConversations,
    conversation === undefined ? {} : 'skip',
  );

  if (conversation !== undefined) return conversation;

  const row = rows?.find((candidate) => candidate.id === conversationId);
  // `resumable`, `canRate` and `myRating` are per-conversation reads the list
  // doesn't make, so seeding is limited to the two states that never look at
  // them. A resting or closed thread would otherwise show one frame of "find
  // another listener" before flipping to "pick this back up" — a worse artifact
  // than the skeleton it replaced.
  if (!row || (row.status !== 'open' && row.status !== 'requested')) return undefined;

  return { ...row, resumable: false, canRate: false, myRating: undefined };
}
