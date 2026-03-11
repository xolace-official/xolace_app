import type { TimelineEntry, TimelineFlatItem } from '@/interfaces/timeline';

/**
 * Produce a human-friendly relative day label for a given date.
 *
 * @param date - The date to compare against the current time
 * @returns `'Today'` if the difference is 0 days, `'Yesterday'` if 1 day, or `'{N} days ago'` where `N` is the number of full days between the date and now
 */
function getRelativeLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Produce a flat array that groups timeline entries by relative date with section headers.
 *
 * @param entries - Timeline entries to group and sort (newest first)
 * @returns An array of `TimelineFlatItem` where each section header (`type: 'section'`) precedes its entries (`type: 'entry'`), ordered newest-first
 */
export function buildTimelineSections(entries: TimelineEntry[]): TimelineFlatItem[] {
  const sorted = [...entries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const result: TimelineFlatItem[] = [];
  let lastLabel = '';

  for (const entry of sorted) {
    const label = getRelativeLabel(entry.timestamp);

    if (label !== lastLabel) {
      result.push({ type: 'section', id: `section-${label}`, label });
      lastLabel = label;
    }

    result.push({ type: 'entry', id: entry.id, entry });
  }

  return result;
}
