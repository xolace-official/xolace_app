import { useMemo } from 'react';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { buildTimelineSections } from '@/src/helpers/utils/timeline';
import type { TimelineEntry } from '@/src/interfaces/timeline';

const PAGE_SIZE = 15;

/**
 * Provides timeline sections and pagination controls for session entries.
 *
 * @returns An object containing:
 * - `sections` — Array of timeline sections derived from recent sessions.
 * - `isEmpty` — `true` when not loading and there are no entries, `false` otherwise.
 * - `isLoading` — `true` while the initial query is loading, `false` otherwise.
 * - `canLoadMore` — `true` when additional pages are available to load, `false` otherwise.
 * - `isLoadingMore` — `true` while additional pages are being fetched, `false` otherwise.
 * - `loadMore` — Function that requests the next page of items.
 */
export function useTimeline() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.sessions.listForTimeline,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const isLoading = status === 'LoadingFirstPage';

  const entries: TimelineEntry[] = useMemo(
    () =>
      results.map((s) => ({
        id: s._id,
        mirrorText: s.mirrorText,
        primaryEmotion: s.primaryEmotion,
        granularLabel: s.granularLabel,
        pathChosen: s.pathChosen,
        confirmationState: s.confirmationState,
        createdAt: s.createdAt,
      })),
    [results],
  );

  const sections = useMemo(() => buildTimelineSections(entries), [entries]);

  return {
    sections,
    isEmpty: !isLoading && entries.length === 0,
    isLoading,
    canLoadMore: status === 'CanLoadMore',
    isLoadingMore: status === 'LoadingMore',
    loadMore: () => loadMore(PAGE_SIZE),
  };
}
