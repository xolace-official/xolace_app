import type { TimelineEntry, TimelineFlatItem } from "@/interfaces/timeline";

function getRelativeLabel(date: Date): string {
  const now = new Date();
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((nowUtc - dateUtc) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

/**
 * Sorts entries newest-first and inserts a section header whenever the
 * relative date label changes.  The resulting flat array is ready to be
 * passed straight to FlatList (or FlashList / LegendList later).
 */
export function buildTimelineSections(
  entries: TimelineEntry[],
): TimelineFlatItem[] {
  const sorted = [...entries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const result: TimelineFlatItem[] = [];
  let lastLabel = "";

  for (const entry of sorted) {
    const label = getRelativeLabel(entry.timestamp);

    if (label !== lastLabel) {
      result.push({ type: "section", id: `section-${label}`, label });
      lastLabel = label;
    }

    result.push({ type: "entry", id: entry.id, entry });
  }

  return result;
}
