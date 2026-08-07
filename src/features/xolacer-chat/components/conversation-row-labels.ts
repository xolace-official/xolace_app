import type { ConversationList } from './chats-list';

type Conversation = ConversationList[number];

export function chipFor(
  conversation: Conversation,
): { label: string; tone: 'warn' | 'muted' } | null {
  if (conversation.status === 'requested') {
    return { label: conversation.role === 'xolacer' ? 'New request' : 'Waiting', tone: 'warn' };
  }
  if (conversation.status === 'resting') return { label: 'Resting', tone: 'muted' };
  if (conversation.status === 'closed') return { label: 'Closed', tone: 'muted' };
  return null;
}

/**
 * Freshness, never assignment. "Suggested" would read as the app dumping
 * someone on a xolacer, which is exactly how the heaviest requests would end
 * up deprioritised. It says when, and never what about — the first message is
 * the user's to write.
 */
export function originLabel(conversation: Conversation): string | null {
  if (conversation.role !== 'xolacer') return null;
  if (conversation.status !== 'requested') return null;
  return conversation.origin === 'suggestion' ? 'Just after a session' : null;
}

export function subtitleFor(conversation: Conversation): string {
  if (conversation.status === 'requested') {
    return conversation.role === 'xolacer'
      ? 'Wants to talk, accept when you have space'
      : `Request sent, ${conversation.counterpartName} will reply when they can`;
  }
  if (conversation.status === 'open') return 'Tap to open your conversation';
  if (conversation.status === 'resting') return 'Gone quiet, pick it back up anytime';

  if (conversation.closedReason === 'declined') {
    return conversation.role === 'xolacer'
      ? 'You closed this request'
      : `${conversation.counterpartName} couldn't take this one on`;
  }
  if (conversation.closedReason === 'expired') return 'This request quietly expired';
  // Blocked rows are filtered out of the list server-side and left-xolacer rows
  // aren't coming back, so neither can honestly be sold as still open to read —
  // the fallthrough below is for a plain close with no reason recorded.
  if (conversation.closedReason === 'blocked' || conversation.closedReason === 'xolacer_left') {
    return 'This conversation is closed';
  }
  return 'Everything you two wrote is still here';
}
