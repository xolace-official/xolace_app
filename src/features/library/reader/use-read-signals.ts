/**
 * What a reader leaves behind on an entry (#410, CONTEXT.md "Library:
 * finished, helped, saved"): the view on open, finished (end reached AND
 * dwelt ≥30% of the read time — never a button), and the resume position.
 * Reached from a read twig (#412), `stepId` rides along and a finish tends it.
 */
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useRef, useState } from 'react';
import type Animated from 'react-native-reanimated';
import { useAnimatedReaction, type AnimatedRef, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { trackLibrary, type ReaderFrom } from '@/src/features/library/analytics';

type EntryId = Id<'library_entries'>;

const DWELL_SHARE = 0.3;
const HELPED_FLOOR = 15; // mirrors convex/library/reads.ts
// At or past this the read is done; the next open starts from the top.
const RESUME_CEILING = 0.98;

const nudgeHelped = (count: number | null, was: boolean, now?: boolean) => {
  if (count === null || now === undefined || now === was) return count;
  const next = count + (now ? 1 : -1);
  return next >= HELPED_FLOOR ? next : null;
};

/** `record`, with saved/helped flipping the reader's own state before the round trip. */
export function useRecord() {
  return useMutation(api.library.reads.record).withOptimisticUpdate((store, args) => {
    const ref = api.library.reads.getReaderState;
    const cur = store.getQuery(ref, { entryId: args.entryId });
    if (!cur) return;
    store.setQuery(ref, { entryId: args.entryId }, {
      ...cur,
      saved: args.saved ?? cur.saved,
      helped: args.helped ?? cur.helped,
      // Only a shown total can move locally; crossing up to the floor waits for the server.
      helpedCount: nudgeHelped(cur.helpedCount, cur.helped, args.helped),
    });
  });
}

export function useReadSignals({
  entryId,
  slug,
  readMin,
  scrollY,
  scrollRef,
  maxScroll,
}: {
  entryId: EntryId;
  slug: string;
  readMin: number;
  scrollY: SharedValue<number>;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Scrollable distance (content − viewport); ≤ 0 until laid out. */
  maxScroll: number;
}) {
  // Plain (stable) mutation: the effects below depend on its identity.
  const record = useMutation(api.library.reads.record);
  const state = useQuery(api.library.reads.getReaderState, { entryId });
  const [openedAt] = useState(() => Date.now());
  const [reachedEnd, setReachedEnd] = useState(false);
  const posthog = usePostHog();
  const { stepId, from } = useLocalSearchParams<{ stepId?: Id<'path_steps'>; from?: ReaderFrom }>();

  // The view: the server counts only the first open. Analytics counts every one.
  useEffect(() => {
    record({ entryId, opened: true });
    // A shared link carries no `from`; every in-app way in sets one.
    trackLibrary(posthog, 'library_entry_opened', { slug, from: from ?? 'share' });
    // Once per entry: slug/from/posthog are fixed for a mounted reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, entryId]);

  const endAt = maxScroll > 0 ? maxScroll - 40 : Number.POSITIVE_INFINITY;
  useAnimatedReaction(
    () => scrollY.get() >= endAt,
    (now, was) => {
      if (now && !was) scheduleOnRN(setReachedEnd, true);
    },
    [endAt],
  );

  // Finished once the end was reached and the dwell has run, whichever comes last.
  const finished = state?.finished;
  useEffect(() => {
    if (!reachedEnd || finished !== false) return;
    const wait = openedAt + DWELL_SHARE * readMin * 60_000 - Date.now();
    const t = setTimeout(() => record({ entryId, finished: true }), Math.max(wait, 0));
    return () => clearTimeout(t);
  }, [reachedEnd, finished, openedAt, readMin, record, entryId]);

  // Seen flip to finished while open (read or listened), not already finished on arrival.
  const wasFinished = useRef(finished);
  useEffect(() => {
    if (wasFinished.current === false && finished === true) trackLibrary(posthog, 'library_entry_finished', { slug });
    wasFinished.current = finished;
  }, [finished, posthog, slug]);

  // A read twig is tended by the finish alone (reading or listening), once.
  const completeStep = useMutation(api.paths.completeStep);
  const tended = useRef(false);
  useEffect(() => {
    if (!stepId || finished !== true || tended.current) return;
    tended.current = true;
    completeStep({ stepId }).catch((e) => console.error('[useReadSignals] completeStep failed:', e));
  }, [stepId, finished, completeStep]);

  // Resume once, as soon as both the saved position and the layout are in.
  const restored = useRef(false);
  const position = state?.position;
  useEffect(() => {
    if (restored.current || position === undefined || maxScroll <= 0) return;
    restored.current = true;
    if (position) scrollRef.current?.scrollTo({ y: position * maxScroll, animated: false });
  }, [position, maxScroll, scrollRef]);

  // Save where they left off. The ref keeps the cleanup on the latest layout.
  const maxRef = useRef(maxScroll);
  useEffect(() => {
    maxRef.current = maxScroll;
  }, [maxScroll]);
  useEffect(
    () => () => {
      // Unrestored, scrollY is still 0 — saving would wipe the real position.
      if (!restored.current || maxRef.current <= 0) return;
      const at = scrollY.get() / maxRef.current;
      record({ entryId, position: at >= RESUME_CEILING ? 0 : at });
    },
    [record, entryId, scrollY],
  );

  return state;
}
