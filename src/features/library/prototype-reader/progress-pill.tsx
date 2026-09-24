/**
 * PROTOTYPE — throwaway (#395). Variant B's one floating object, ported from
 * the scroll-progress sample and merged with the player:
 *
 *   at the top    → "6 min read | ▶ Listen"
 *   while reading → "42%  ▬▬▬───  🎧"
 *   at the end    → "↑"  (back to top)
 *   once playing  → it becomes the mini-player, whatever the scroll
 *
 * The size morph is a layout transition, not a per-frame width animation.
 */
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';
import { formatTime, type MockEntry, type MockPlayback } from './mock-entry';
import { CALM, Glyph, PlusUpsell } from './shared';

const MORPH = LinearTransition.springify().damping(CALM.damping).stiffness(CALM.stiffness);

export function ProgressPill({
  entry,
  pct,
  progress,
  playback,
  bottom,
  onTop,
}: {
  entry: MockEntry;
  pct: number;
  progress: SharedValue<number>;
  playback: MockPlayback;
  bottom: number;
  onTop: () => void;
}) {
  const phase = playback.started ? 'player' : pct < 2 ? 'start' : pct >= 99 ? 'end' : 'reading';
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ bottom }}>
      <Animated.View
        layout={MORPH}
        className="overflow-hidden rounded-full border border-border"
        style={{ borderCurve: 'continuous' }}
      >
        <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
        <View className="absolute inset-0 bg-surface/70" />

        <Animated.View key={phase} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} className="h-14 flex-row items-center gap-3 px-5">
          {phase === 'start' && (
            <>
              <AppText className="text-sm text-muted">{entry.readMin} min read</AppText>
              <View className="h-4 w-px bg-separator" />
              <Pressable onPress={playback.toggle} className="flex-row items-center gap-1.5 active:opacity-60">
                <Glyph name="play.fill" size={12} />
                <AppText className="font-semibold text-sm">Listen · {entry.listenMin}m</AppText>
              </Pressable>
            </>
          )}

          {phase === 'reading' && (
            <>
              <AppText className="w-10 text-sm tabular-nums text-muted">{pct}%</AppText>
              <View className="h-1.5 w-28 overflow-hidden rounded-full bg-separator">
                <Animated.View className="h-full w-full bg-foreground" style={[{ transformOrigin: 'left' }, fill]} />
              </View>
              <Pressable onPress={playback.toggle} hitSlop={10} accessibilityLabel="Listen instead">
                <Glyph name="headphones" size={16} />
              </Pressable>
            </>
          )}

          {phase === 'end' && (
            <Pressable onPress={onTop} hitSlop={10} accessibilityLabel="Back to top" className="flex-row items-center gap-2">
              <Glyph name="arrow.up" size={16} />
            </Pressable>
          )}

          {phase === 'player' && playback.previewEnded && <PlusUpsell />}

          {phase === 'player' && !playback.previewEnded && (
            <>
              <Pressable onPress={() => playback.skip(-15)} hitSlop={8} accessibilityLabel="Back 15 seconds">
                <Glyph name="gobackward.15" size={18} />
              </Pressable>
              <Pressable onPress={playback.toggle} hitSlop={8} accessibilityLabel={playback.isPlaying ? 'Pause' : 'Play'}>
                <Glyph name={playback.isPlaying ? 'pause.fill' : 'play.fill'} size={20} />
              </Pressable>
              <AppText className="text-sm tabular-nums text-muted">
                {formatTime(playback.currentTime)} / {formatTime(playback.duration)}
              </AppText>
              <Pressable onPress={playback.close} hitSlop={8} accessibilityLabel="Stop listening">
                <Glyph name="xmark" size={13} />
              </Pressable>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
