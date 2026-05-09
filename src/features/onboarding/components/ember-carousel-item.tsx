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
import { AppText } from '@/src/components/shared/app-text';
import type { FrameStep } from '@/src/features/onboarding/frame-steps';

export type EmberSlide = FrameStep & { backgroundElement: React.ReactNode };

const ANGLE_STEP = (2 * Math.PI) / 9;
const SPRING = { damping: 40, stiffness: 200, mass: 4 };

type Props = {
  index: number;
  slide: EmberSlide;
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
    interpolate(animatedIndex.get(), [index - 1, index, index + 1], [0.72, 1, 0.72], Extrapolation.CLAMP)
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

  const rGlowStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isCurrent.get() ? 1 : 0, SPRING),
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', width: '58%', aspectRatio: 1 / 0.72 }, rContainerStyle]}
      onLayout={(e) => itemHeight.set(e.nativeEvent.layout.height)}
    >
      {/* Soft ember halo behind active card */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -18,
            left: -18,
            right: -18,
            bottom: -18,
            borderRadius: 50,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(217,171,111,0.03)',
            boxShadow: '0 0 52px 16px rgba(217,171,111,0.16)',
          },
          rGlowStyle,
        ]}
      />

      {/* Bright border ring for active card */}
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
            borderColor: 'rgba(217,171,111,0.4)',
          },
          rGlowStyle,
        ]}
      />

      {/* Card body */}
      <View
        style={{
          flex: 1,
          borderRadius: 32,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: 'rgba(217,171,111,0.1)',
          overflow: 'hidden',
          backgroundColor: 'rgba(14,10,6,0.9)',
        }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {slide.backgroundElement}
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 4,
          }}
        >
          <AppText
            style={{
              fontFamily: 'Poppins-Medium',
              fontSize: 15,
              color: 'rgba(217,171,111,0.9)',
              textAlign: 'center',
              letterSpacing: 0.3,
            }}
          >
            {slide.action}
          </AppText>
          <AppText
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.32)',
              textAlign: 'center',
              fontWeight: '300',
              lineHeight: 16,
            }}
          >
            {slide.detail}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
};

EmberCarouselItemComponent.displayName = 'EmberCarouselItem';
export const EmberCarouselItem = memo(EmberCarouselItemComponent);
