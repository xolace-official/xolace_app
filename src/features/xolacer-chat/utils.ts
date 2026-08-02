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
