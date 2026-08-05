import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

type CarouselPaginatorProps = {
  pagesAmount: number;
  currentPageIndex: SharedValue<number>;
  visibleDots: number;
  dotSize?: number;
  spacing?: number;
  dotColor: string;
};

const SpringConfig = {
  damping: 15,
  stiffness: 100,
  mass: 0.5,
} as const;

export function CarouselPaginator({
  pagesAmount,
  currentPageIndex,
  visibleDots,
  dotSize = 7,
  spacing = 8,
  dotColor,
}: CarouselPaginatorProps) {
  const dots = new Array(pagesAmount).fill(0);

  const visibleDotsIndices = useDerivedValue(() => {
    const currentIndex = Math.round(currentPageIndex.get());
    const halfVisible = Math.floor(visibleDots / 2);
    let start = Math.max(currentIndex - halfVisible, 0);
    const end = Math.min(start + visibleDots, pagesAmount);

    if (end === pagesAmount) {
      start = Math.max(pagesAmount - visibleDots, 0);
    }

    return { start, end, currentIndex };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const { currentIndex } = visibleDotsIndices.get();
    const dotFullWidth = dotSize * 2.5;
    const regularDotWidth = dotSize;
    const totalSpacing = spacing * (pagesAmount - 1);
    const totalWidth = (pagesAmount - 1) * regularDotWidth + dotFullWidth;
    const centerOffset = (totalWidth + totalSpacing) / 2;
    const currentPosition = currentIndex * (regularDotWidth + spacing) + dotFullWidth / 2;
    const translateX = centerOffset - currentPosition;

    return {
      transform: [{ translateX: withSpring(translateX, SpringConfig) }],
    };
  });

  return (
    <View style={styles.paginatorContainer}>
      <Animated.View style={[styles.dotsContainer, containerAnimatedStyle]}>
        {dots.map((_, index) => (
          <AnimatedDot
            key={index}
            index={index}
            visibleDotsIndices={visibleDotsIndices}
            spacing={spacing}
            dotSize={dotSize}
            dotColor={dotColor}
          />
        ))}
      </Animated.View>
    </View>
  );
}

type AnimatedDotProps = {
  index: number;
  visibleDotsIndices: SharedValue<{ start: number; end: number; currentIndex: number }>;
  spacing: number;
  dotSize: number;
  dotColor: string;
};

function AnimatedDot({ index, visibleDotsIndices, spacing, dotSize, dotColor }: AnimatedDotProps) {
  const isVisible = useDerivedValue(() => {
    return index >= visibleDotsIndices.get().start && index < visibleDotsIndices.get().end;
  });

  // Compare against the window's already-rounded currentIndex, not the raw
  // fractional scrollX/cardWidth — that value is mid-swipe almost every
  // frame, so an exact-equality check against it flickered the active dot
  // in and out on every drag instead of holding steady until a page settles.
  const visibility = useDerivedValue(() => {
    const isActive = visibleDotsIndices.get().currentIndex === index;
    const opacity = isActive ? 1 : isVisible.get() ? 0.75 : 0;

    return withTiming(opacity, {
      duration: 500,
      easing: Easing.linear,
    });
  }, [visibleDotsIndices, index]);

  const rContainerStyle = useAnimatedStyle(() => {
    const scale = withSpring(visibleDotsIndices.get().currentIndex !== index ? 0.75 : 1, SpringConfig);
    return {
      opacity: visibility.get(),
      marginRight: spacing,
      transform: [{ scale }],
    };
  });

  const rDotStyle = useAnimatedStyle(() => {
    return {
      width: dotSize,
      height: dotSize,
      backgroundColor: dotColor,
    };
  });

  return (
    <Animated.View style={rContainerStyle}>
      <Animated.View style={[styles.dot, rDotStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: {
    alignItems: "flex-start",
    borderRadius: 9999,
    justifyContent: "center",
  },
  dotsContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  paginatorContainer: {
    alignItems: "center",
    bottom: 0,
    height: 20,
    justifyContent: "center",
    left: 0,
    overflow: "hidden",
    pointerEvents: "none",
    position: "absolute",
    right: 0,
  },
});
