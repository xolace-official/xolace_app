/**
 * The reader's audio dock (#411, decision in #390): a mini-player flush to the
 * bottom of the reader, never a full-screen takeover. Free readers get the
 * server's 30s preview asset; at its end the dock swaps in place to an unlock
 * row, and the paywall is pushed over the reader so the read stays put. The
 * transcript opens from here, for Plus only — never during the preview.
 */
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useConvex, useQuery } from 'convex/react';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/shared/app-text';
import { formatTime } from '@/src/features/browse/player/format-time';
import { usePaywall } from '@/src/features/purchases/use-paywall';
import { usePlayback } from '@/src/lib/audio/use-playback';
import { TranscriptSheet } from './transcript-sheet';

export const DOCK_ROW = 68;

const PLAY = { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' } as const;
const PAUSE = { ios: 'pause.fill', android: 'pause', web: 'pause' } as const;
const TRANSCRIPT = { ios: 'text.quote', android: 'notes', web: 'notes' } as const;

type Props = { entryId: Id<'library_entries'>; title: string; listenMin: number };

export function AudioDock({ entryId, title, listenMin }: Props) {
  const insets = useSafeAreaInsets();
  const convex = useConvex();
  const [accentInk, page, foreground] = useThemeColor(['accent-foreground', 'background', 'foreground']);
  const openPaywall = usePaywall((s) => s.open);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  // Keyed on server entitlement: buying Plus from the unlock row re-mints the full asset.
  // Unresolved counts as free, so a free reader mints once.
  const isPlus = useQuery(api.premium.getEntitlement)?.isPlus;
  const p = usePlayback(
    `${entryId}:${isPlus ?? false}`,
    () => convex.query(api.library.audio.getEntryAudio, { entryId }),
    (t) => ({ title: t.title, artist: 'Lantern', artworkUrl: t.coverUrl }),
  );

  // Latched per URL, so a re-mint (expiry, or the full asset after buying) clears it.
  const [endedUrl, setEndedUrl] = useState<string>();
  // didJustFinish is one status tick wide, so latch it during render.
  if (p.didJustFinish && p.track?.preview && endedUrl !== p.track.url) setEndedUrl(p.track.url);
  const ended = !!p.track && endedUrl === p.track.url;

  if (p.track === null) return null;
  const preview = p.track?.preview ?? false;
  const progress = p.duration > 0 ? Math.min(p.currentTime / p.duration, 1) : 0;

  return (
    <View
      className="absolute inset-x-0 bottom-0 border-t border-separator px-4"
      style={{ backgroundColor: page, paddingBottom: insets.bottom }}
    >
      {ended ? (
        <View className="flex-row items-center gap-3" style={{ height: DOCK_ROW }}>
          <View className="flex-1">
            <AppText className="font-semibold text-foreground">That was the first 30 seconds</AppText>
            <AppText className="text-xs text-muted">Hear all {listenMin} min</AppText>
          </View>
          <Pressable
            onPress={() => openPaywall('library_audio')}
            accessibilityRole="button"
            className="rounded-full bg-accent px-4 py-2 active:opacity-70"
          >
            <AppText className="font-semibold text-sm text-accent-foreground">Unlock with Xolace+</AppText>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center gap-3" style={{ height: DOCK_ROW }}>
          <Pressable
            onPress={p.toggle}
            disabled={!p.track}
            accessibilityRole="button"
            accessibilityLabel={p.isPlaying ? 'Pause' : preview ? 'Play preview' : 'Listen'}
            className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-70"
          >
            {p.track ? (
              <SymbolView name={p.isPlaying ? PAUSE : PLAY} size={18} tintColor={accentInk} />
            ) : (
              <ActivityIndicator color={accentInk} />
            )}
          </Pressable>
          <View className="flex-1 gap-1.5">
            <AppText numberOfLines={1} className="text-sm font-semibold text-foreground">
              {p.error ? 'Audio unavailable' : preview ? `Preview · ${listenMin} min listen` : title}
            </AppText>
            <View className="h-0.75 overflow-hidden rounded-full bg-foreground/10">
              <View className="h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
            </View>
          </View>
          <AppText className="text-xs tabular-nums text-muted">
            {formatTime(p.currentTime)} / {formatTime(p.duration)}
          </AppText>
          {p.track && !preview && (
            <Pressable
              onPress={() => setTranscriptOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Transcript"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-secondary active:opacity-60"
            >
              <SymbolView name={TRANSCRIPT} size={15} tintColor={foreground} />
            </Pressable>
          )}
        </View>
      )}
      {!preview && (
        <TranscriptSheet entryId={entryId} isOpen={transcriptOpen} onClose={() => setTranscriptOpen(false)} />
      )}
    </View>
  );
}
