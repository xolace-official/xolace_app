import { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
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

const renderPreview = (id: string) => {
  switch (id) {
    case 'share':
      return <SharePreview />;
    case 'reflect':
      return <ReflectPreview />;
    case 'clarity':
      return <PathsPreview />;
    case 'humanity':
      return <PeersPreview />;
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

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: cardWidth,
          alignItems: 'center',
        },
        rStyle,
      ]}
    >
      <View
        className="overflow-hidden bg-overlay border border-foreground/8"
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: 28,
          borderCurve: 'continuous',
        }}
      >
        <View className="absolute top-0 left-0 right-0 h-12 bg-accent/4" />
        {renderPreview(slide.id)}
      </View>

      <View className="mt-7 items-center px-3 gap-1">
        <AppText
          className="text-foreground text-[15px]"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {slide.action}
        </AppText>
        <AppText className="text-foreground/40 text-[12px] text-center leading-4">
          {slide.detail}
        </AppText>
      </View>
    </Animated.View>
  );
};

Item.displayName = 'PreviewCarouselItem';
export const PreviewCarouselItem = memo(Item);
