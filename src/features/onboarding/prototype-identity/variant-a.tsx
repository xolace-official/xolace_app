/**
 * PROTOTYPE — throwaway. Ticket #198. Variant A — "One Fire, Many Angles".
 *
 * Thesis: superlist switches ROOMS (a saturated purple/red/blue card per slide).
 * Xolace has one room and one fire. So every card is the same warm-indigo
 * surface, and what changes per slide is where the firelight falls. Swiping is
 * walking around the fire, not changing channels.
 *
 * Motion vocabulary: no tilt, no snap. A 5s breath on the card, the glow
 * drifting to its new anchor behind the surface, opacity doing the paging work.
 */
import { useWindowDimensions, View } from 'react-native';
import { FlatList, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import { DuskDriftBackdrop } from '@/src/features/onboarding/components/dusk-drift-backdrop';
import { PROTO_SLIDES, type ProtoSlide } from './slides';
import { EmberGlow } from './ember-glow';
import { AuthSheetStub } from './auth-sheet-stub';
import type { ExpandController } from './use-expand-gesture';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ProtoSlide>);
const GLOW_SIZE = 620;
// Hoisted: worklets can capture plain number arrays, but calling .map() inside
// one is a remote call into the JS runtime and throws.
const GLOW_XS = PROTO_SLIDES.map((s) => s.glow.x);
const GLOW_YS = PROTO_SLIDES.map((s) => s.glow.y);
const GLOW_IDX = PROTO_SLIDES.map((_, n) => n);

const Card = ({ item, index, width, scrollX }: { item: ProtoSlide; index: number; width: number; scrollX: SharedValue<number> }) => {
  const accent = useThemeColor('accent') as string;
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.set(withRepeat(withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [breath]);

  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0.35, 1, 0.35], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.get(), range, [0.94, 1, 0.94], Extrapolation.CLAMP) * (1 + breath.get() * 0.008) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="px-6 py-4">
      <View className="flex-1 rounded-[28px] border border-border bg-surface px-7 pb-9 pt-8 justify-between overflow-hidden">
        <View className="flex-row items-center gap-3">
          <SymbolView name={item.symbol} size={18} tintColor={accent} type="hierarchical" />
          <AppText className="text-ember/80 text-[11px] uppercase" style={{ letterSpacing: 2 }}>
            {item.label}
          </AppText>
        </View>

        <View className="gap-4">
          <AppText className="text-foreground/90 text-[27px] leading-[38px]" style={{ fontFamily: 'Poppins-Medium' }}>
            {item.line}
          </AppText>
          <AppText className="text-foreground/45 text-[14px] leading-6">{item.detail}</AppText>
        </View>
      </View>
    </Animated.View>
  );
};

export const VariantA = ({ controller }: { controller: ExpandController }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const { progress, gesture } = controller;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  // Firelight walks to each slide's anchor as you scroll.
  const rGlowStyle = useAnimatedStyle(() => {
    const i = scrollX.get() / width;
    return {
      opacity: interpolate(progress.get(), [0, 1], [1, 0.45], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(i, GLOW_IDX, GLOW_XS, Extrapolation.CLAMP) * width - GLOW_SIZE / 2 },
        { translateY: interpolate(i, GLOW_IDX, GLOW_YS, Extrapolation.CLAMP) * 700 - GLOW_SIZE / 2 },
      ],
    };
  });

  const rDeckStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.get(), [0, 1], [0, -180], Extrapolation.CLAMP) },
      { scale: interpolate(progress.get(), [0, 1], [1, 0.9], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(progress.get(), [0, 1], [1, 0.32], Extrapolation.CLAMP),
  }));

  const rDotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.3], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View className="flex-1 bg-background">
      <DuskDriftBackdrop />
      <Animated.View pointerEvents="none" className="absolute" style={rGlowStyle}>
        <EmberGlow size={GLOW_SIZE} intensity={0.16} token="ember" />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1, paddingTop: insets.top + 12, paddingBottom: 96 }, rDeckStyle]}>
          <AnimatedFlatList
            data={PROTO_SLIDES}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <Card item={item} index={index} width={width} scrollX={scrollX} />}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
          />
          {/* Pagination: hairlines, not filled bars. */}
          <Animated.View className="flex-row justify-center gap-2 pt-5" style={rDotsStyle}>
            {PROTO_SLIDES.map((s, n) => (
              <Hairline key={s.id} index={n} width={width} scrollX={scrollX} />
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <AuthSheetStub controller={controller} tone="surface" />
    </View>
  );
};

const Hairline = ({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) => {
  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0.2, 1, 0.2], Extrapolation.CLAMP),
      width: interpolate(scrollX.get(), range, [14, 28, 14], Extrapolation.CLAMP),
    };
  });
  return <Animated.View className="h-[2px] rounded-full bg-ember" style={rStyle} />;
};
