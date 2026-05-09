import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { EmberCarouselItem } from '@/src/features/onboarding/components/ember-carousel-item';
import type { FrameStep } from '@/src/features/onboarding/frame-steps';

const SPRING_CONFIG = { damping: 60, stiffness: 280, mass: 6 };
const INTERVAL_MS = 3200;

type Props = { slides: FrameStep[] };

export const EmberCarousel = ({ slides }: Props) => {
  const [extended, setExtended] = useState<FrameStep[]>(slides);
  const { height: screenHeight } = useWindowDimensions();
  // Start at 0 so "You share" (FRAME_STEPS[0]) is centered on mount
  const animatedIndex = useSharedValue(0);
  const currentIndex = useDerivedValue(() => Math.round(animatedIndex.get()));
  const lengthRef = useRef(slides.length);

  useEffect(() => {
    setExtended(slides);
    lengthRef.current = slides.length;
  }, [slides]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = currentIndex.get() + 1;
      if (next >= lengthRef.current - 2) {
        // Drop invisible items from the front (items before currentIndex - 3 have opacity 0)
        const dropCount = Math.max(0, currentIndex.get() - 3);
        setExtended((prev) => {
          const trimmed = dropCount > 0 ? prev.slice(dropCount) : prev;
          const updated = [...trimmed, ...slides];
          lengthRef.current = updated.length;
          return updated;
        });
        if (dropCount > 0) {
          // Snap to rebased position so the spring starts from the right origin
          animatedIndex.set(animatedIndex.get() - dropCount);
        }
        animatedIndex.set(withSpring(next - dropCount, SPRING_CONFIG));
      } else {
        animatedIndex.set(withSpring(next, SPRING_CONFIG));
      }
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides, currentIndex, animatedIndex]);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <Animated.View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}
      >
        {extended.map((slide, i) => (
          <EmberCarouselItem
            key={`${slide.id}-${i}`}
            index={i}
            slide={slide}
            currentIndex={currentIndex}
            animatedIndex={animatedIndex}
            radius={screenHeight * 0.52}
          />
        ))}
      </Animated.View>
    </View>
  );
};
