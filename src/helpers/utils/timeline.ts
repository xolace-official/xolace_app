import type { TimelineEntry, TimelineFlatItem } from '@/interfaces/timeline';

/**
 * Produce a human-friendly relative day label for a given timestamp.
 */
function getRelativeLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dateUtc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.floor((nowUtc - dateUtc) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Group pre-sorted (newest-first) timeline entries into sections by relative date.
 */
export function buildTimelineSections(
  entries: TimelineEntry[],
): TimelineFlatItem[] {
  const result: TimelineFlatItem[] = [];
  let lastLabel = '';

  for (const entry of entries) {
    const label = getRelativeLabel(entry.createdAt);

    if (label !== lastLabel) {
      result.push({ type: 'section', id: `section-${label}`, label });
      lastLabel = label;
    }

    result.push({ type: 'entry', id: entry.id, entry });
  }

  return result;
}
