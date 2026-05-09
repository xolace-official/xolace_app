import { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import type { FrameStep } from '@/src/features/onboarding/frame-steps';

const ANGLE_STEP = (2 * Math.PI) / 9;
const SPRING = { damping: 40, stiffness: 200, mass: 4 };

type Props = {
  index: number;
  slide: FrameStep;
  currentIndex: SharedValue<number>;
  animatedIndex: SharedValue<number>;
  radius: number;
};

const EmberCarouselItemComponent = ({
  slide,
  index,
  currentIndex,
  animatedIndex,
  radius,
}: Props) => {
  const accentColor = useThemeColor('accent') ?? 'oklch(62% 0.14 285)';
  const itemHeight = useSharedValue(0);

  const isInRange = useDerivedValue(
    () => currentIndex.get() - 2 <= index && currentIndex.get() + 2 >= index
  );

  const angle = useDerivedValue(() => {
    const base = -Math.PI / 2;
    return interpolate(
      animatedIndex.get(),
      [index - 2, index - 1, index, index + 1, index + 2],
      [base - ANGLE_STEP * 2, base - ANGLE_STEP, base, base + ANGLE_STEP, base + ANGLE_STEP * 2],
      Extrapolation.CLAMP
    );
  });

  const translateX = useDerivedValue(() =>
    isInRange.get() ? -radius * Math.cos(angle.get()) : 0
  );

  const translateY = useDerivedValue(() =>
    isInRange.get() ? radius * Math.sin(angle.get()) + itemHeight.get() / 2 : 0
  );

  const scale = useDerivedValue(() =>
    interpolate(
      animatedIndex.get(),
      [index - 1, index, index + 1],
      [0.72, 1, 0.72],
      Extrapolation.CLAMP
    )
  );

  const rotation = useDerivedValue(() =>
    isInRange.get() ? -angle.get() - Math.PI / 2 : 0
  );

  const opacity = useDerivedValue(() => {
    if (!isInRange.get()) return 0;
    return interpolate(
      animatedIndex.get(),
      [index - 2, index - 1, index, index + 1, index + 2],
      [0, 0.5, 1, 0.5, 0],
      Extrapolation.CLAMP
    );
  });

  const rContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
      { rotate: `${rotation.get()}rad` },
    ],
  }));

  const isCurrent = useDerivedValue(() => currentIndex.get() === index);

  // Animate halo opacity 0→1 when active
  const rHaloStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isCurrent.get() ? 1 : 0, SPRING),
  }));

  // Animate border ring opacity 0→0.45 when active
  const rRingStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isCurrent.get() ? 0.45 : 0, SPRING),
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', width: '58%', aspectRatio: 1 / 0.72 }, rContainerStyle]}
      onLayout={(e) => itemHeight.set(e.nativeEvent.layout.height)}
    >
      {/* Soft ambient halo — opacity-controlled so it works with any accent color format */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -18,
            left: -18,
            right: -18,
            bottom: -18,
            borderRadius: 52,
            borderCurve: 'continuous',
            opacity: 0,
            boxShadow: `0 0 52px 18px ${accentColor}`,
          },
          rHaloStyle,
        ]}
      />

      {/* Active border ring */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            borderRadius: 33,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: accentColor,
          },
          rRingStyle,
        ]}
      />

      {/* Card — clean surface, no decorative shapes */}
      <View
        className="flex-1 overflow-hidden bg-overlay border border-accent/10"
        style={{ borderRadius: 32, borderCurve: 'continuous' }}
      >
        {/* Subtle top accent wash */}
        <View className="absolute top-0 left-0 right-0 h-10 bg-accent/6" />

        <View className="flex-1 justify-center items-center px-5 py-4 gap-1">
          <AppText
            className="text-accent text-[15px] text-center"
            style={{  letterSpacing: 0.3 }}
          >
            {slide.action}
          </AppText>
          <AppText className="text-foreground/30 text-[11px] text-center leading-4">
            {slide.detail}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
};

EmberCarouselItemComponent.displayName = 'EmberCarouselItem';
export const EmberCarouselItem = memo(EmberCarouselItemComponent);
