/**
 * Did these two ever actually exchange a message? A channel is only created on
 * accept, so a request that was declined or left to expire has no history at
 * all — and copy that reassures someone their words are kept is a false promise
 * on a thread where nothing was ever written.
 *
 * Derived from status + closedReason because that pair is the one shape
 * available on every screen; the profile query deliberately doesn't return
 * `streamChannelId`.
 */
export function hasSpoken(conversation: {
  status: 'requested' | 'open' | 'resting' | 'closed';
  closedReason?: 'declined' | 'expired' | 'blocked' | 'xolacer_left';
}): boolean {
  if (conversation.status === 'requested') return false;
  if (conversation.status !== 'closed') return true;
  return (
    conversation.closedReason !== 'declined' &&
    conversation.closedReason !== 'expired'
  );
}

/**
 * Who to show for one message bubble, or null to leave the SDK's own answer
 * alone.
 *
 * The SDK's answer is a globally-shared, mutable user record keyed by profile
 * id — one record per person for the whole app. A seeker who is *also* an
 * active xolacer has that record written with their real name and photo, and
 * it then renders in conversations where they are anonymous. The conversation
 * itself already carries the right answer (`counterpartName` /
 * `counterpartPhotoUrl`, computed per-conversation and per-role by the
 * server), so that is the only thing read here.
 *
 * Pure, and resolved at render time from data already fetched for the header —
 * which makes the fix retroactive for free: every existing message corrects
 * itself the moment this ships, with nothing stored and nothing to backfill.
 *
 * The match is positive — sender *is* the counterpart — rather than "sender is
 * not me". Matching by negation fails open onto the counterpart for every
 * sender it can't classify: your own bubbles wear the other person's name for
 * the moment the client's user id is unset during a reconnect, and any sender
 * who is neither member (a system notice, a safety intervention) would render
 * as if the other person wrote it. Anything unrecognised keeps the SDK's own
 * record instead, so nothing is impersonated.
 */
export function resolveMessageIdentity(
  senderId: string | undefined,
  conversation: {
    counterpartProfileId: string;
    counterpartName: string;
    counterpartPhotoUrl?: string;
  },
): { name: string; image?: string } | null {
  if (senderId !== conversation.counterpartProfileId) return null;
  return {
    name: conversation.counterpartName,
    image: conversation.counterpartPhotoUrl,
  };
}

/**
 * The `{ code, max, party }` payload a Convex limit refusal carries, or null
 * for any other failure. Shared so the surfaces that can hit a cap read it the
 * same way and only differ in the sentence they show.
 */
export function chatLimitError(
  error: unknown,
): { code?: string; max?: number; party?: 'seeker' | 'xolacer' } | null {
  const data = (error as { data?: unknown } | null)?.data;
  if (!data || typeof data !== 'object') return null;
  return data as { code?: string; max?: number; party?: 'seeker' | 'xolacer' };
}

/**
 * Why an accept didn't go through. `party` matters here and nowhere else: the
 * xolacer tapping Accept is not always the one who is full, and "you have too
 * many open conversations" is a confusing thing to read when you have two.
 * The seeker is never named — only that they have no room right now.
 */
export function acceptFailureLabel(error: unknown): string {
  const data = chatLimitError(error);
  if (data?.code !== 'open_conversation_limit') {
    return "Couldn't open the conversation. Try again.";
  }
  return data.party === 'xolacer'
    ? `You're holding ${data.max ?? 8} open conversations. Let one rest before accepting another.`
    : "They've got as many conversations open as they can hold right now. This request stays in your inbox.";
}

/** Compact relative time for chat rows: "2h", "3d", "3w". */
export function formatCompactTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

/** Profile meta line: "Xolacer since March" / "March 2025" once it's not this year. */
export function formatMonthYear(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.toLocaleString(undefined, { month: 'long' });
  const year = date.getFullYear();
  return year === new Date().getFullYear() ? month : `${month} ${year}`;
}

/** Longer form for thread headers: "last spoke 3 weeks ago". */
export function formatLongAgo(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
}
