import { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AppText } from '@/src/components/shared/app-text';
import { SharePreview } from '@/src/features/onboarding/components/previews/share-preview';
import { ReflectPreview } from '@/src/features/onboarding/components/previews/reflect-preview';
import { PathsPreview } from '@/src/features/onboarding/components/previews/paths-preview';
import { PeersPreview } from '@/src/features/onboarding/components/previews/peers-preview';
import type { FrameStep } from '@/src/features/onboarding/frame-steps';

type Props = {
  index: number;
  slide: FrameStep;
  animatedIndex: SharedValue<number>;
  cardWidth: number;
  cardHeight: number;
  gap: number;
};

const WINDOW_INSET = 14;
const WINDOW_RATIO = 0.62;
const BLUR_INTENSITY = 70;

const renderPreview = (id: string, isActive: SharedValue<boolean>) => {
  switch (id) {
    case 'share':
      return <SharePreview isActive={isActive} />;
    case 'reflect':
      return <ReflectPreview isActive={isActive} />;
    case 'clarity':
      return <PathsPreview isActive={isActive} />;
    case 'humanity':
      return <PeersPreview isActive={isActive} />;
    default:
      return null;
  }
};

const Item = ({
  slide,
  index,
  animatedIndex,
  cardWidth,
  cardHeight,
  gap,
}: Props) => {
  const rStyle = useAnimatedStyle(() => {
    const d = animatedIndex.get() - index;
    const absD = Math.abs(d);
    if (absD > 2.4) {
      return { opacity: 0, transform: [{ translateX: 0 }, { scale: 0.86 }] };
    }
    const tx = -d * (cardWidth + gap);
    const scale = interpolate(d, [-1, 0, 1], [0.86, 1, 0.86], Extrapolation.CLAMP);
    const opacity = interpolate(absD, [0, 1, 2], [1, 0.22, 0], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: tx }, { scale }],
      opacity,
    };
  });

  const windowHeight = (cardHeight - WINDOW_INSET * 2) * WINDOW_RATIO;

  const isActive = useDerivedValue(() => Math.round(animatedIndex.get()) === index);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: cardWidth,
          height: cardHeight,
          alignItems: 'center',
        },
        rStyle,
      ]}
    >
      <BlurView
        intensity={BLUR_INTENSITY}
        tint="default"
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: 28,
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}
      >
        {/* Hairline card border + soft tint to keep card readable on any backdrop */}
        <View
          pointerEvents="none"
          className="bg-overlay/35 border border-foreground/10"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
            borderCurve: 'continuous',
          }}
        />

        {/* Live moment — clear window inset into the blurred frame */}
        <View
          className="bg-overlay border border-foreground/8 overflow-hidden"
          style={{
            position: 'absolute',
            top: WINDOW_INSET,
            left: WINDOW_INSET,
            right: WINDOW_INSET,
            height: windowHeight,
            borderRadius: 18,
            borderCurve: 'continuous',
          }}
        >
          {renderPreview(slide.id, isActive)}
        </View>

        {/* Caption sits directly on the blurred frame */}
        <View
          style={{
            position: 'absolute',
            top: WINDOW_INSET + windowHeight,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
            gap: 4,
          }}
        >
          <AppText
            className="text-foreground text-[14px]"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {slide.action}
          </AppText>
          <AppText className="text-foreground/55 text-[11px] text-center leading-4">
            {slide.detail}
          </AppText>
        </View>
      </BlurView>
    </Animated.View>
  );
};

Item.displayName = 'PreviewCarouselItem';
export const PreviewCarouselItem = memo(Item);
