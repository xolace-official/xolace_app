/**
 * PROTOTYPE — throwaway (#395). Variant C's persistent dock, after the
 * reference: grabber, thumb + title + save, transport, and an audio progress
 * line on its top edge. Always present (it *is* the invitation to listen);
 * tucks to one row while reading downwards.
 *
 * ⏮ / ⏭ jump between sections — the "listen from this section" handoff the
 * reading-UX research ranks first. Faked here: real markers are deferred (#390).
 */
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';
import { formatTime, PREVIEW_SEC, type MockEntry, type MockPlayback } from './mock-entry';
import { CALM, Glyph, PlusUpsell, useInk } from './shared';

export function ListenDock({
  entry,
  playback,
  compact,
  sectionIndex,
  bottom,
}: {
  entry: MockEntry;
  playback: MockPlayback;
  compact: boolean;
  sectionIndex: number;
  bottom: number;
}) {
  const [saved, setSaved] = useState(false);
  const bg = useInk('--color-background');
  const pct = playback.currentTime / playback.duration;
  const perSection = playback.duration / entry.sections.length;

  const subtitle = playback.previewEnded
    ? `Free preview ended at ${formatTime(PREVIEW_SEC)}`
    : playback.started
      ? `${formatTime(playback.currentTime)} / ${formatTime(playback.duration)}`
      : `Listen · ${entry.listenMin} min · from “${entry.sections[sectionIndex].heading}”`;

  const play = (
    <Pressable
      onPress={playback.toggle}
      accessibilityLabel={playback.isPlaying ? 'Pause' : 'Play'}
      className="items-center justify-center rounded-full bg-foreground"
      style={{ width: compact ? 40 : 56, height: compact ? 40 : 56 }}
    >
      <Glyph name={playback.isPlaying ? 'pause.fill' : 'play.fill'} size={compact ? 16 : 22} color={bg} />
    </Pressable>
  );

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(CALM.damping).stiffness(CALM.stiffness)}
      className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[28px] border-t border-border"
      style={{ paddingBottom: bottom + 8, borderCurve: 'continuous' }}
    >
      <BlurView intensity={70} tint="default" style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-surface/80" />
      <View className="h-[3px] bg-separator">
        <View className="h-full bg-accent" style={{ width: `${pct * 100}%` }} />
      </View>
      {!compact && <View className="mt-2 h-1 w-10 self-center rounded-full bg-separator" />}

      <View className="flex-row items-center gap-3 px-4 pt-3">
        <Image source={entry.coverUrl} style={{ width: 48, height: 48, borderRadius: 12 }} />
        <View className="flex-1">
          <AppText numberOfLines={1} className="font-semibold">
            {entry.title}
          </AppText>
          <AppText numberOfLines={1} className="text-xs text-muted">
            {subtitle}
          </AppText>
        </View>
        {compact ? (
          playback.previewEnded ? <PlusUpsell compact /> : play
        ) : (
          <Pressable onPress={() => setSaved((s) => !s)} hitSlop={10} accessibilityLabel="Save">
            <Glyph name={saved ? 'bookmark.fill' : 'bookmark'} size={20} />
          </Pressable>
        )}
      </View>

      {!compact && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(100)} className="items-center px-4 pb-1 pt-4">
          {playback.previewEnded ? (
            <PlusUpsell />
          ) : (
            <View className="flex-row items-center gap-10">
              <Pressable
                onPress={() => playback.skip(-perSection)}
                hitSlop={10}
                accessibilityLabel="Previous section"
              >
                <Glyph name="backward.end.fill" size={20} />
              </Pressable>
              {play}
              <Pressable onPress={() => playback.skip(perSection)} hitSlop={10} accessibilityLabel="Next section">
                <Glyph name="forward.end.fill" size={20} />
              </Pressable>
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}
