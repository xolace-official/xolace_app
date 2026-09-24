/**
 * PROTOTYPE — throwaway (#396). For you as a focus carousel, from the opal
 * sample: cards snap to centre; the further a card is from centre, the smaller
 * (→0.88) and blurrier (iOS BlurView, →intensity 15) it gets. One scroll
 * offset on the UI thread drives both effects; transforms only, no re-layout.
 */
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { Entry } from './mock-library';
import { UpNextCard } from './parts';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const GAP = 10;

type Item = { entry: Entry; reason: string };

function Card({ item, index, scrollX, itemW, height, isPlus }: {
  item: Item; index: number; scrollX: SharedValue<number>; itemW: number; height: number; isPlus: boolean;
}) {
  // Distance of this card's centre from the viewport centre, in card widths.
  // With centring padding, card i is centred exactly at scrollX = i * step.
  const step = itemW + GAP;
  const style = useAnimatedStyle(() => {
    const d = Math.abs(scrollX.get() - index * step) / step;
    return { transform: [{ scale: interpolate(d, [0, 0.15, 1], [1, 1, 0.88], Extrapolation.CLAMP) }] };
  });
  const blurProps = useAnimatedProps(() => {
    const d = Math.abs(scrollX.get() - index * step) / step;
    return { intensity: interpolate(d, [0, 0.15, 1], [0, 0, 15], Extrapolation.CLAMP) };
  });

  return (
    <Animated.View style={[{ width: itemW }, style]}>
      <UpNextCard entry={item.entry} kicker={item.reason} isPlus={isPlus} width={itemW} height={height} />
      {Platform.OS === 'ios' && (
        <AnimatedBlurView
          animatedProps={blurProps}
          pointerEvents="none"
          tint="systemThinMaterialDark"
          style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}
        />
      )}
    </Animated.View>
  );
}

export function ForYouCarousel({ items, isPlus }: { items: Item[]; isPlus: boolean }) {
  const { width } = useWindowDimensions();
  const itemW = Math.round(width * 0.7);
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => scrollX.set(e.contentOffset.x));

  return (
    <Animated.ScrollView
      horizontal
      onScroll={onScroll}
      scrollEventThrottle={16}
      snapToInterval={itemW + GAP}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: (width - itemW) / 2, gap: GAP }}
    >
      {items.map((item, i) => (
        <Card key={item.entry.slug} item={item} index={i} scrollX={scrollX} itemW={itemW} height={340} isPlus={isPlus} />
      ))}
    </Animated.ScrollView>
  );
}
