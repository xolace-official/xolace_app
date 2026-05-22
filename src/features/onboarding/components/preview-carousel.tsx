import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Presets } from 'react-native-pulsar';
import { PreviewCarouselItem } from '@/src/features/onboarding/components/preview-carousel-item';
import type { FrameStep } from '@/src/features/onboarding/frame-steps';

const SPRING_CONFIG = { damping: 60, stiffness: 280, mass: 6 };
const INTERVAL_MS = 3600;
const CARD_WIDTH_RATIO = 0.62;
const CARD_ASPECT = 9 / 13;
const MAX_CARD_WIDTH = 240;
const GAP = 18;

type Props = { slides: FrameStep[] };

export const PreviewCarousel = ({ slides }: Props) => {
  const { width } = useWindowDimensions();
  const [extended, setExtended] = useState<FrameStep[]>(slides);
  const animatedIndex = useSharedValue(0);
  const currentIndex = useDerivedValue(() => Math.round(animatedIndex.get()));
  const lengthRef = useRef(slides.length);

  useEffect(() => {
    setExtended(slides);
    lengthRef.current = slides.length;
  }, [slides]);

  useEffect(() => {
    const id = setInterval(() => {
      Presets.flick();
      const next = currentIndex.get() + 1;
      if (next >= lengthRef.current - 2) {
        const currentAnimated = animatedIndex.get();
        const offset = Math.max(0, Math.floor(currentAnimated) - 1);
        setExtended((prev) => {
          const newExtended = [...prev.slice(offset), ...slides];
          lengthRef.current = newExtended.length;
          return newExtended;
        });
        // Snap to equivalent position in re-indexed buffer, then spring forward.
        animatedIndex.set(currentAnimated - offset);
        animatedIndex.set(withSpring(next - offset, SPRING_CONFIG));
      } else {
        animatedIndex.set(withSpring(next, SPRING_CONFIG));
      }
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides, currentIndex, animatedIndex]);

  const cardWidth = Math.min(width * CARD_WIDTH_RATIO, MAX_CARD_WIDTH);
  const cardHeight = cardWidth / CARD_ASPECT;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View className="flex-1 items-center justify-center">
        {extended.map((slide, i) => (
          <PreviewCarouselItem
            key={`${slide.id}-${i}`}
            index={i}
            slide={slide}
            animatedIndex={animatedIndex}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            gap={GAP}
          />
        ))}
      </View>
    </View>
  );
};
