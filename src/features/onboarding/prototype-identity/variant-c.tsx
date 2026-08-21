/**
 * PROTOTYPE — throwaway. Ticket #198. Variant C — "The Journal Page".
 *
 * Thesis: the strongest thing Xolace already owns is the light theme's warm
 * parchment. So invert — each slide is a page held up in the dark, lit from
 * the side, with editorial structure (label / rule / line / body) instead of a
 * centred hero. Reads as "your journal", not "our product tour".
 *
 * Motion vocabulary: a page turn. 3D perspective rotate + a shadow sweep, so
 * the pages feel like physical objects with a near edge and a far edge.
 *
 * CAVEAT: the page uses `foreground` as its ground, so it inverts correctly in
 * dark but goes dark-page-on-light in a light theme. If this direction wins,
 * it needs a dedicated parchment token, not `foreground`.
 */
import { useWindowDimensions, View } from 'react-native';
import { FlatList, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import { PROTO_SLIDES, type ProtoSlide } from './slides';
import { EmberGlow } from './ember-glow';
import { AuthSheetStub } from './auth-sheet-stub';
import type { ExpandController } from './use-expand-gesture';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ProtoSlide>);

const Page = ({ item, index, width, scrollX }: { item: ProtoSlide; index: number; width: number; scrollX: SharedValue<number> }) => {
  const background = useThemeColor('background') as string;

  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    const rotateY = interpolate(scrollX.get(), range, [26, 0, -26], Extrapolation.CLAMP);
    return {
      opacity: interpolate(scrollX.get(), range, [0.5, 1, 0.5], Extrapolation.CLAMP),
      transform: [
        { perspective: 900 },
        { rotateY: `${rotateY}deg` },
        { scale: interpolate(scrollX.get(), range, [0.9, 1, 0.9], Extrapolation.CLAMP) },
      ],
    };
  });

  // Shadow sweep: the lit edge moves across the page as it turns.
  const rSweepStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0.45, 0, 0.45], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="px-7 py-6">
      <View className="flex-1 rounded-[20px] bg-foreground px-8 pb-10 pt-9 overflow-hidden">
        <AppText className="text-background/40 text-[10px] uppercase" style={{ letterSpacing: 2.5 }}>
          {item.label}
        </AppText>
        <View className="h-[1px] bg-background/12 mt-3 mb-7" />

        <AppText className="text-background text-[29px] leading-[40px]" style={{ fontFamily: 'Poppins-Medium' }}>
          {item.line}
        </AppText>

        <View className="flex-1 justify-end">
          <SymbolView name={item.symbol} size={20} tintColor={background} type="hierarchical" style={{ opacity: 0.35, marginBottom: 14 }} />
          <AppText className="text-background/55 text-[14px] leading-6">{item.detail}</AppText>
        </View>

        <Animated.View pointerEvents="none" className="absolute inset-0 bg-background" style={rSweepStyle} />
      </View>
    </Animated.View>
  );
};

export const VariantC = ({ controller }: { controller: ExpandController }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const { progress, gesture } = controller;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  const rStackStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.get(), [0, 1], [0, -150], Extrapolation.CLAMP) },
      { scale: interpolate(progress.get(), [0, 1], [1, 0.86], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(progress.get(), [0, 1], [1, 0.25], Extrapolation.CLAMP),
  }));

  const rDotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.3], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View className="flex-1 bg-background">
      {/* Side light — the fire is off-frame left, the page catches it. */}
      <View pointerEvents="none" className="absolute" style={{ left: -260, top: 60 }}>
        <EmberGlow size={620} intensity={0.13} token="ember" />
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1, paddingTop: insets.top + 8, paddingBottom: 110 }, rStackStyle]}>
          <AnimatedFlatList
            data={PROTO_SLIDES}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <Page item={item} index={index} width={width} scrollX={scrollX} />}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
          />
          {/* Pagination: page count, not dots. */}
          <Animated.View className="items-center pt-3" style={rDotsStyle}>
            <PageCount width={width} scrollX={scrollX} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <AuthSheetStub controller={controller} tone="paper" />
    </View>
  );
};

const PageCount = ({ width, scrollX }: { width: number; scrollX: SharedValue<number> }) => (
  <View className="flex-row gap-1.5">
    {PROTO_SLIDES.map((s, n) => (
      <Tick key={s.id} index={n} width={width} scrollX={scrollX} />
    ))}
  </View>
);

const Tick = ({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) => {
  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    const t = interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP);
    return { opacity: 0.18 + t * 0.72, height: 10 + t * 8 };
  });
  return <Animated.View className="w-[1.5px] rounded-full bg-foreground" style={rStyle} />;
};
