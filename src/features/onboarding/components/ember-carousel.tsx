import { useEffect, useRef, useState } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import Animated, {
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { EmberCarouselItem } from "@/src/features/onboarding/components/ember-carousel-item";
import type { FrameStep } from "@/src/features/onboarding/frame-steps";

const SPRING_CONFIG = { damping: 60, stiffness: 280, mass: 6 };
const INTERVAL_MS = 3200;
const ABSOLUTE_OVERFLOW_STYLE = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: "hidden" },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

type CarouselItem = { key: string; slide: FrameStep };
type Props = { slides: FrameStep[] };

const mapWithKeys = (
  slides: FrameStep[],
  keySeedRef: React.MutableRefObject<number>,
): CarouselItem[] =>
  slides.map((slide) => {
    const seed = keySeedRef.current;
    keySeedRef.current += 1;
    return { key: `${slide.id}-${seed}`, slide };
  });

export const EmberCarousel = ({ slides }: Props) => {
  const keySeedRef = useRef(0);
  const [extended, setExtended] = useState<CarouselItem[]>(() =>
    mapWithKeys(slides, keySeedRef),
  );
  const { height: screenHeight } = useWindowDimensions();
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
      const next = currentIndex.get() + 1;
      if (next >= lengthRef.current - 2) {
        const dropCount = Math.max(0, currentIndex.get() - 3);
        setExtended((prev) => {
          const trimmed = dropCount > 0 ? prev.slice(dropCount) : prev;
          const updated = [...trimmed, ...mapWithKeys(slides, keySeedRef)];
          lengthRef.current = updated.length;
          return updated;
        });
        if (dropCount > 0) {
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
    <View pointerEvents="none" style={ABSOLUTE_OVERFLOW_STYLE.fill}>
      <Animated.View style={ABSOLUTE_OVERFLOW_STYLE.row}>
        {extended.map((item, i) => (
          <EmberCarouselItem
            key={item.key}
            index={i}
            slide={item.slide}
            currentIndex={currentIndex}
            animatedIndex={animatedIndex}
            radius={screenHeight * 0.52}
          />
        ))}
      </Animated.View>
    </View>
  );
};
