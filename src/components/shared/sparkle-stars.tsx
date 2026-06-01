import { View, StyleSheet } from "react-native";
import Animated, { cubicBezier } from "react-native-reanimated";

const starKeyframes = (
  x: number,
  y: number,
  rotate: number,
  scale: number,
) => ({
  "60%": {
    transform: [{ scale }],
  },
  from: {
    transform: [
      { translateX: 0 },
      { translateY: 0 },
      { rotateZ: `-${rotate}deg` },
      { scale: 0.3 },
    ],
  },
  to: {
    opacity: 1,
    transform: [
      { translateX: x },
      { translateY: y },
      { rotateZ: `${rotate}deg` },
      { scale: 0 },
    ],
  },
});

type StarConfig = {
  id: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: string;
  duration: string;
  fontSize: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
  easing: "ease-in-out" | ReturnType<typeof cubicBezier>;
};

const STARS: StarConfig[] = [
  {
    id: "star-bottom-left",
    x: -10,
    y: 12,
    rotate: 15,
    scale: 1.1,
    delay: "0.5s",
    duration: "3s",
    fontSize: 26,
    position: { bottom: 40, left: 80 },
    easing: cubicBezier(0.42, 0, 0.58, 1),
  },
  {
    id: "star-top-right",
    x: 15,
    y: 10,
    rotate: 20,
    scale: 0.9,
    delay: "1.2s",
    duration: "3.5s",
    fontSize: 22,
    position: { top: 0, right: 80 },
    easing: "ease-in-out",
  },
  {
    id: "star-top-left",
    x: -8,
    y: -10,
    rotate: 25,
    scale: 1.0,
    delay: "0.8s",
    duration: "3.2s",
    fontSize: 20,
    position: { top: 15, left: 80 },
    easing: "ease-in-out",
  },
  {
    id: "star-bottom-right",
    x: 12,
    y: -8,
    rotate: 18,
    scale: 0.95,
    delay: "1.5s",
    duration: "3.8s",
    fontSize: 26,
    position: { bottom: 40, right: 100 },
    easing: cubicBezier(0.42, 0, 0.58, 1),
  },
];

type Props = {
  color: string;
};

const STAR_CHARACTER = "✦";
const STAR_ANIMATION_FILL_MODE = "forwards";
const STAR_ANIMATION_ITERATION_COUNT = "infinite";

const SparkleStarsComponent = ({ color }: Props) => {
  const starStylesByIndex = STARS.map((star) => [
    starStyles.star,
    star.position,
    {
      fontSize: star.fontSize,
      color,
      animationDelay: star.delay,
      animationDuration: star.duration,
      animationFillMode: STAR_ANIMATION_FILL_MODE,
      animationName: starKeyframes(star.x, star.y, star.rotate, star.scale),
      animationTimingFunction: star.easing,
      animationIterationCount: STAR_ANIMATION_ITERATION_COUNT,
    } as const,
  ]);

  return (
    <View
      style={starStyles.wrapper}
      pointerEvents="none"
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      {starStylesByIndex.map((style, i) => (
        <Animated.Text
          key={STARS[i].id}
          accessible={false}
          style={style as any}
        >
          {STAR_CHARACTER}
        </Animated.Text>
      ))}
    </View>
  );
};

export const SparkleStars = SparkleStarsComponent;

const starStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    position: "absolute",
  },
  star: {
    opacity: 0,
    position: "absolute",
  },
});
