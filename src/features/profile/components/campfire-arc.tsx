import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "heroui-native";
import { useAppStore } from "@/src/store/store";

// Each arc: size (diameter) and opacity at rest
const ARCS = [
  { size: 72, opacity: 1.0 },
  { size: 120, opacity: 0.55 },
  { size: 172, opacity: 0.28 },
  { size: 224, opacity: 0.13 },
  { size: 276, opacity: 0.06 },
];

const CONTAINER_HEIGHT = 148;

type Props = { children?: React.ReactNode };

export function CampfireArc({ children }: Props) {
  const emberColor = useThemeColor("ember") as string;
  const reducedMotion = useAppStore((s) => s.preferences?.reducedMotion ?? false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.set(
      withRepeat(
        withTiming(1.035, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [reducedMotion, pulse]);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.get() }],
  }));

  return (
    <View
      style={{
        height: CONTAINER_HEIGHT,
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
    >
      {/* Arcs positioned so their center is at the bottom edge of the container */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -ARCS[ARCS.length - 1].size / 2,
            alignItems: "center",
            justifyContent: "center",
            width: ARCS[ARCS.length - 1].size,
            height: ARCS[ARCS.length - 1].size,
          },
          rStyle,
        ]}
      >
        {ARCS.map((arc, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: arc.size,
              height: arc.size,
              borderRadius: arc.size / 2,
              borderWidth: i === 0 ? 2 : 1,
              borderColor: emberColor,
              opacity: arc.opacity,
            }}
          />
        ))}
      </Animated.View>

      {/* Totem or avatar rendered on top of the innermost arc */}
      <View style={{ marginBottom: 8, zIndex: 1 }}>{children}</View>
    </View>
  );
}
