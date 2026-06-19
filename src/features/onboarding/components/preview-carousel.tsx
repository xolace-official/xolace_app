import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Presets } from "react-native-pulsar";
import { PreviewCarouselItem } from "@/src/features/onboarding/components/preview-carousel-item";
import type { FrameStep } from "@/src/features/onboarding/frame-steps";

const SPRING_CONFIG = { damping: 60, stiffness: 280, mass: 6 };
const INTERVAL_MS = 3600;
const CARD_WIDTH_RATIO = 0.62;
const CARD_ASPECT = 9 / 13;
const MAX_CARD_WIDTH = 240;
const GAP = 18;
const ABSOLUTE_FILL = StyleSheet.absoluteFill;

type Props = { slides: FrameStep[] };
type CarouselItem = { key: string; slide: FrameStep };

const mapWithKeys = (
  slides: FrameStep[],
  keySeedRef: React.MutableRefObject<number>,
): CarouselItem[] =>
  slides.map((slide) => {
    const seed = keySeedRef.current;
    keySeedRef.current += 1;
    return { key: `${slide.id}-${seed}`, slide };
  });

export const PreviewCarousel = ({ slides }: Props) => {
  const { width } = useWindowDimensions();
  const keySeedRef = useRef(0);
  // Initial keys are index-based (no ref access during render). The mount
  // effect below immediately re-maps via the seed ref, which is the canonical
  // place for ref mutation.
  const [extended, setExtended] = useState<CarouselItem[]>(() =>
    slides.map((slide, i) => ({ key: `${slide.id}-${i}`, slide })),
  );
  const animatedIndex = useSharedValue(0);
  const currentIndex = useDerivedValue(() => Math.round(animatedIndex.get()));
  const lengthRef = useRef(slides.length);

  useEffect(() => {
    keySeedRef.current = 0;
    setExtended(mapWithKeys(slides, keySeedRef));
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
          const newExtended = [
            ...prev.slice(offset),
            ...mapWithKeys(slides, keySeedRef),
          ];
          lengthRef.current = newExtended.length;
          return newExtended;
        });
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
    <View pointerEvents="none" style={ABSOLUTE_FILL}>
      <View className="flex-1 items-center justify-center">
        {extended.map((item, i) => (
          <PreviewCarouselItem
            key={item.key}
            index={i}
            slide={item.slide}
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
