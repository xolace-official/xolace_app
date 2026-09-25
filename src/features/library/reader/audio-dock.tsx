/**
 * The reader's audio (#411), built from #395's variant A. A Listen pill beside
 * the source credit starts it; only then does a one-row dock slide up flush
 * with the bottom edge, audio progress on its top edge. Free readers hear the
 * server's 30s preview; once it's spent the transport swaps in place for
 * "Keep listening", which pushes the paywall over the reader. The transcript
 * opens from the dock, for Plus only — never during the preview.
 */
import type { Id } from '@/convex/_generated/dataModel';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';
import { formatTime } from '@/src/features/browse/player/format-time';
import { usePaywall } from '@/src/features/purchases/use-paywall';
import { TranscriptSheet } from './transcript-sheet';
import type { EntryAudio } from './use-entry-audio';

const ICON = {
  listen: { ios: 'headphones', android: 'headphones', web: 'headphones' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  back15: { ios: 'gobackward.15', android: 'replay', web: 'replay' },
  transcript: { ios: 'text.quote', android: 'notes', web: 'notes' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  plus: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
} as const satisfies Record<string, SymbolViewProps['name']>;

function Glyph({ name, size = 18, color }: { name: SymbolViewProps['name']; size?: number; color?: string }) {
  const foreground = useThemeColor('foreground');
  return <SymbolView name={name} size={size} tintColor={color ?? foreground} />;
}

/** Beside the source credit: starts the audio and, with it, the dock. */
export function ListenPill({ audio, listenMin }: { audio: EntryAudio; listenMin: number }) {
  return (
    <Pressable
      onPress={audio.toggle}
      accessibilityRole="button"
      className="flex-row items-center gap-2 rounded-full bg-surface-secondary px-4 py-2 active:opacity-70"
    >
      <Glyph name={audio.isPlaying ? ICON.pause : ICON.listen} size={14} />
      <AppText className="font-semibold text-sm">{audio.started ? 'Playing' : `Listen · ${listenMin}m`}</AppText>
    </Pressable>
  );
}

type DockProps = { audio: EntryAudio; entryId: Id<'library_entries'>; title: string; coverUrl?: string; bottom: number };

export function AudioDock({ audio, entryId, title, coverUrl, bottom }: DockProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  if (!audio.started) return null;
  const pct = audio.duration > 0 ? Math.min(audio.currentTime / audio.duration, 1) : 0;

  return (
    <Animated.View
      // Timed, not sprung: straight up into place, nothing to settle.
      entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutDown.duration(200).easing(Easing.in(Easing.cubic))}
      className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[28px] border-t border-border"
      style={{ paddingBottom: bottom + 8, borderCurve: 'continuous' }}
    >
      <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-surface/70" />
      <View className="h-0.75 bg-separator">
        <View className="h-full bg-accent" style={{ width: `${pct * 100}%` }} />
      </View>

      <View className="flex-row items-center gap-3 p-3">
        <View className="h-11 w-11 overflow-hidden rounded-xl bg-cover-scrim">
          {coverUrl && <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />}
        </View>
        <View className="flex-1">
          <AppText numberOfLines={1} className="font-semibold text-sm">
            {title}
          </AppText>
          <AppText className="text-xs text-muted">
            {audio.error
              ? 'Audio unavailable'
              : audio.previewEnded
                ? 'Free preview · 0:30'
                : `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`}
          </AppText>
        </View>

        {audio.previewEnded ? <KeepListening /> : <Transport audio={audio} />}
        {audio.track && !audio.preview && (
          <Pressable hitSlop={8} onPress={() => setTranscriptOpen(true)} accessibilityRole="button" accessibilityLabel="Transcript">
            <Glyph name={ICON.transcript} size={18} />
          </Pressable>
        )}
        <Pressable hitSlop={8} onPress={audio.close} accessibilityRole="button" accessibilityLabel="Close player">
          <Glyph name={ICON.close} size={14} />
        </Pressable>
      </View>
      {!audio.preview && (
        <TranscriptSheet entryId={entryId} isOpen={transcriptOpen} onClose={() => setTranscriptOpen(false)} />
      )}
    </Animated.View>
  );
}

function Transport({ audio }: { audio: EntryAudio }) {
  const background = useThemeColor('background');
  return (
    <>
      <Pressable hitSlop={8} onPress={() => audio.skip(-15)} accessibilityRole="button" accessibilityLabel="Back 15 seconds">
        <Glyph name={ICON.back15} size={20} />
      </Pressable>
      <Pressable
        hitSlop={8}
        onPress={audio.toggle}
        disabled={!audio.track}
        accessibilityRole="button"
        accessibilityLabel={audio.isPlaying ? 'Pause' : 'Play'}
        className="h-10 w-10 items-center justify-center rounded-full bg-foreground active:opacity-70"
      >
        <Glyph name={audio.isPlaying ? ICON.pause : ICON.play} size={16} color={background} />
      </Pressable>
    </>
  );
}

/** In place of the transport once the 30s preview is spent. */
function KeepListening() {
  const accentInk = useThemeColor('accent-foreground');
  const openPaywall = usePaywall((s) => s.open);
  return (
    <Pressable
      onPress={() => openPaywall('library_audio')}
      accessibilityRole="button"
      className="flex-row items-center gap-2 rounded-full bg-accent px-4 py-2 active:opacity-80"
    >
      <Glyph name={ICON.plus} size={14} color={accentInk} />
      <AppText className="font-semibold text-sm text-accent-foreground">Keep listening</AppText>
    </Pressable>
  );
}
