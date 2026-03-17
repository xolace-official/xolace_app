import { useMemo } from 'react';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { buildTimelineSections } from '@/helpers/utils/timeline';
import type { TimelineEntry } from '@/interfaces/timeline';

const PAGE_SIZE = 15;

export function useTimeline() {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.sessions.listForTimeline,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  
  console.log("results", results)

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
