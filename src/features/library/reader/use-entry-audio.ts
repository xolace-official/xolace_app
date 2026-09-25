import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useState } from 'react';

import { trackLibrary } from '@/src/features/library/analytics';
import { usePlayback } from '@/src/lib/audio/use-playback';

/** The dock's height above the safe area — what the page and Back to top clear. */
const DOCK_H = 80;

/**
 * The reader's audio (#411), shared by the Listen pill and the dock (#395
 * variant A). `started` is the dock's presence: the first Listen raises it,
 * close lowers it. Free readers are minted the 30s preview; `previewEnded`
 * latches when it runs out and swaps the dock's transport for the upsell.
 */
export function useEntryAudio(entryId: Id<'library_entries'>, slug: string, hasAudio: boolean) {
  const convex = useConvex();
  const posthog = usePostHog();
  // Keyed on server entitlement: buying Plus from the upsell re-mints the full
  // asset. Unresolved counts as free, so a free reader mints once.
  const isPlus = useQuery(api.premium.getEntitlement)?.isPlus ?? false;
  const p = usePlayback(
    `${entryId}:${hasAudio}:${isPlus}`,
    () => (hasAudio ? convex.query(api.library.audio.getEntryAudio, { entryId }) : Promise.resolve(null)),
    (t) => ({ title: t.title, artist: 'Lantern', artworkUrl: t.coverUrl }),
  );
  const [started, setStarted] = useState(false);
  const [played, setPlayed] = useState(false); // once per open, not per resume

  // Latched per URL, so a re-mint (expiry, or the full asset after buying) clears it.
  // didJustFinish is one status tick wide, so latch it during render.
  const [endedUrl, setEndedUrl] = useState<string>();
  if (p.didJustFinish && p.track?.preview && endedUrl !== p.track.url) setEndedUrl(p.track.url);
  const previewEnded = !!p.track && endedUrl === p.track.url;
  // The upsell replaces the transport the moment the preview ends, so it's shown here, once per preview.
  useEffect(() => {
    if (!endedUrl) return;
    trackLibrary(posthog, 'library_audio_preview_ended', { slug });
    trackLibrary(posthog, 'library_paywall_shown', { slug, trigger: 'audio_preview' });
  }, [endedUrl, posthog, slug]);

  // Hearing the full asset to the end finishes the entry, same as reading it (#410, #412).
  const record = useMutation(api.library.reads.record);
  const [listened, setListened] = useState(false);
  if (p.didJustFinish && p.track && !p.track.preview && !listened) setListened(true);
  useEffect(() => {
    if (!listened) return;
    record({ entryId, finished: true });
    trackLibrary(posthog, 'library_audio_completed', { slug });
  }, [listened, record, entryId, posthog, slug]);

  return {
    ...p,
    slug,
    started,
    /** Room to leave for the dock: 0 until it's up. */
    dockH: started ? DOCK_H : 0,
    previewEnded,
    preview: p.track?.preview ?? false,
    toggle: () => {
      setStarted(true);
      if (previewEnded) return; // preview spent — the dock shows the upsell
      if (!played) {
        setPlayed(true);
        trackLibrary(posthog, 'library_audio_played', { slug, preview: p.track?.preview ?? !isPlus });
      }
      p.toggle();
    },
    skip: (d: number) => p.seekTo(p.currentTime + d),
    close: () => {
      if (p.isPlaying) p.toggle();
      setStarted(false);
    },
  };
}

export type EntryAudio = ReturnType<typeof useEntryAudio>;
