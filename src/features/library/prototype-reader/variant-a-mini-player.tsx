/**
 * PROTOTYPE — throwaway (#395). Variant A's player: a one-row dock flush with
 * the bottom edge (C's tucked shape), sliding up only once audio has been
 * started, audio progress on its top edge.
 */
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';
import { formatTime, type MockEntry, type MockPlayback } from './mock-entry';
import { Glyph, PlusUpsell, useInk } from './shared';

export function DockedMiniPlayer({
  entry,
  playback,
  bottom,
}: {
  entry: MockEntry;
  playback: MockPlayback;
  bottom: number;
}) {
  const bg = useInk('--color-background');
  if (!playback.started) return null;
  const pct = playback.currentTime / playback.duration;

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
      <View className="h-[3px] bg-separator">
        <View className="h-full bg-accent" style={{ width: `${pct * 100}%` }} />
      </View>

      <View className="flex-row items-center gap-3 p-3">
        <Image source={entry.coverUrl} style={{ width: 44, height: 44, borderRadius: 12 }} />
        <View className="flex-1">
          <AppText numberOfLines={1} className="font-semibold text-sm">
            {entry.title}
          </AppText>
          <AppText className="text-xs text-muted">
            {playback.previewEnded ? 'Free preview · 0:30' : `${formatTime(playback.currentTime)} / ${formatTime(playback.duration)}`}
          </AppText>
        </View>

        {playback.previewEnded ? (
          <PlusUpsell compact />
        ) : (
          <>
            <Pressable hitSlop={8} onPress={() => playback.skip(-15)} accessibilityLabel="Back 15 seconds">
              <Glyph name="gobackward.15" size={20} />
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={playback.toggle}
              accessibilityLabel={playback.isPlaying ? 'Pause' : 'Play'}
              className="h-10 w-10 items-center justify-center rounded-full bg-foreground"
            >
              <Glyph name={playback.isPlaying ? 'pause.fill' : 'play.fill'} size={16} color={bg} />
            </Pressable>
          </>
        )}
        <Pressable hitSlop={8} onPress={playback.close} accessibilityLabel="Close player">
          <Glyph name="xmark" size={14} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
