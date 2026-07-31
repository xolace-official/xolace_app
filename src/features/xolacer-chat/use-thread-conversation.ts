import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { ThreadConversation } from './components/thread-screen';

/**
 * The thread's conversation, seeded from the list the user tapped it in.
 *
 * Returns `undefined` when there is nothing to seed from — a push-notification
 * deep link, or a cold launch straight into this route — and the skeleton is
 * then telling the truth.
 */
export function useThreadConversation(
  conversationId: string,
): ThreadConversation | null | undefined {
  const conversation = useQuery(api.xolacerChat.getConversation, {
    conversationId: conversationId as Id<'xolacer_conversations'>,
  });

  const rows = useQuery(
    api.xolacerChat.myConversations,
    conversation === undefined ? {} : 'skip',
  );

  if (conversation !== undefined) return conversation;

  const row = rows?.find((candidate) => candidate.id === conversationId);
  // `resumable`, `canRate` and `myRating` are per-conversation reads the list
  // doesn't make, so seeding is limited to the two states that never look at
  // them. A resting or closed thread would otherwise show one frame of "find
  // another xolacer" before flipping to "pick this back up" — a worse artifact
  // than the skeleton it replaced.
  if (!row || (row.status !== 'open' && row.status !== 'requested')) return undefined;

  return {
    ...row,
    origin: row.origin,
    resumable: false,
    canRate: false,
    myRating: undefined,
  };
}
