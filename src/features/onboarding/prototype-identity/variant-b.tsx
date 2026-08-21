/**
 * PROTOTYPE — throwaway. Ticket #198. Variant B — "Embers in the Dark".
 *
 * Thesis: kill the card. A card is a window into another app; Xolace's screen
 * IS the dark room. Content floats directly on the background with nothing
 * framing it, and the fire lives just below the bottom edge. Swiping up to
 * sign in is literally moving toward the fire — the glow rises and warms as
 * you approach, so the auth sheet needs no chrome to announce itself.
 *
 * Motion vocabulary: cross-dissolve + vertical drift instead of horizontal
 * card paging. Nothing slides sideways; slides breathe in and out of the dark.
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
const HEARTH_SIZE = 780;

const Slide = ({ item, index, width, scrollX }: { item: ProtoSlide; index: number; width: number; scrollX: SharedValue<number> }) => {
  const ember = useThemeColor('ember' as 'accent') as string;

  // Cross-dissolve + drift: content fades through the dark rather than sliding past.
  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    return {
      opacity: interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.get(), range, [26, 0, 26], Extrapolation.CLAMP) },
        // Counter-translate so the text does NOT track the finger horizontally.
        { translateX: interpolate(scrollX.get(), range, [-width * 0.85, 0, width * 0.85], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, rStyle]} className="flex-1 justify-end px-9 pb-6">
      <SymbolView name={item.symbol} size={26} tintColor={ember} type="hierarchical" style={{ marginBottom: 26 }} />
      <AppText className="text-foreground/95 text-[34px] leading-[46px]" style={{ fontFamily: 'Poppins-Regular', fontWeight: '300' }}>
        {item.line}
      </AppText>
      <AppText className="text-foreground/40 text-[14px] leading-6 mt-5 pr-6">{item.detail}</AppText>
    </Animated.View>
  );
};

export const VariantB = ({ controller }: { controller: ExpandController }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const { progress, gesture } = controller;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  // The hearth below the fold: rises and brightens as you come closer.
  const rHearthStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (width - HEARTH_SIZE) / 2 },
      { translateY: interpolate(progress.get(), [0, 1], [height - HEARTH_SIZE * 0.3, height - HEARTH_SIZE * 0.66], Extrapolation.CLAMP) },
      { scale: interpolate(progress.get(), [0, 1], [1, 1.12], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(progress.get(), [0, 1], [0.75, 1], Extrapolation.CLAMP),
  }));

  const rContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.55], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [0, -70], Extrapolation.CLAMP) }],
  }));

  return (
    <View className="flex-1 bg-background">
      <Animated.View pointerEvents="none" className="absolute" style={rHearthStyle}>
        <EmberGlow size={HEARTH_SIZE} intensity={0.2} token="ember" />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 130 }, rContentStyle]}>
          <AnimatedFlatList
            data={PROTO_SLIDES}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <Slide item={item} index={index} width={width} scrollX={scrollX} />}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
          />
          {/* Pagination: embers that glow, never fill. */}
          <View className="flex-row justify-start gap-3 px-9 pt-8">
            {PROTO_SLIDES.map((s, n) => (
              <EmberDot key={s.id} index={n} width={width} scrollX={scrollX} />
            ))}
          </View>
        </Animated.View>
      </GestureDetector>

      <AuthSheetStub controller={controller} tone="bare" />
    </View>
  );
};

const EmberDot = ({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) => {
  const rStyle = useAnimatedStyle(() => {
    const range = [width * (index - 1), width * index, width * (index + 1)];
    const t = interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP);
    return { opacity: 0.22 + t * 0.78, transform: [{ scale: 0.8 + t * 0.5 }] };
  });
  return <Animated.View className="h-[6px] w-[6px] rounded-full bg-ember" style={rStyle} />;
};
