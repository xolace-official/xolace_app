import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { EmberCarouselItem } from '@/src/features/onboarding/components/ember-carousel-item';
import type { EmberSlide } from '@/src/features/onboarding/components/ember-carousel-item';

const SPRING_CONFIG = { damping: 60, stiffness: 280, mass: 6 };
const INTERVAL_MS = 3200;

type Props = { slides: EmberSlide[] };

export const EmberCarousel = ({ slides }: Props) => {
  const [extended, setExtended] = useState<EmberSlide[]>(slides);
  const { height: screenHeight } = useWindowDimensions();
  const animatedIndex = useSharedValue(1);
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
        setExtended((prev) => {
          const updated = [...prev, ...slides];
          lengthRef.current = updated.length;
          return updated;
        });
      }
      animatedIndex.set(withSpring(next, SPRING_CONFIG));
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
