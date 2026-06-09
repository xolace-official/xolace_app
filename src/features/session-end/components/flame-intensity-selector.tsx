import { Dimensions } from "react-native";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Presets } from "react-native-pulsar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated";

const FLAME_COUNT = 5;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Account for FeedbackSheet.Frame px-6 (24px * 2) padding
const CONTAINER_WIDTH = SCREEN_WIDTH - 48;
const FLAME_WIDTH = CONTAINER_WIDTH / FLAME_COUNT;

const SPRING_BOUNCE = { damping: 8, stiffness: 320, mass: 0.6 };
const SPRING_SETTLE = { damping: 14, stiffness: 220, mass: 0.6 };
const SPRING_FILL = { damping: 20, stiffness: 180, mass: 0.6 };

type Props = {
  value: number;
  onChange: (intensity: number) => void;
};

export function FlameIntensitySelector({ value, onChange }: Props) {
  const accent = useThemeColor("accent") as string;

  // Gradient fill progress (0-100%)
  const gradientWidth = useSharedValue(value > 0 ? (value / FLAME_COUNT) * 100 : 0);

  // Per-flame scale values
  const s1 = useSharedValue(value >= 1 ? 1 : 0.75);
  const s2 = useSharedValue(value >= 2 ? 1 : 0.75);
  const s3 = useSharedValue(value >= 3 ? 1 : 0.75);
  const s4 = useSharedValue(value >= 4 ? 1 : 0.75);
  const s5 = useSharedValue(value >= 5 ? 1 : 0.75);

  const updateScales = (rating: number) => {
    "worklet";
    s1.set(withSpring(rating >= 1 ? 1 : 0.75, SPRING_SETTLE));
    s2.set(withSpring(rating >= 2 ? 1 : 0.75, SPRING_SETTLE));
    s3.set(withSpring(rating >= 3 ? 1 : 0.75, SPRING_SETTLE));
    s4.set(withSpring(rating >= 4 ? 1 : 0.75, SPRING_SETTLE));
    s5.set(withSpring(rating >= 5 ? 1 : 0.75, SPRING_SETTLE));
  };

  const bounceFlame = (index: number) => {
    "worklet";
    const sv = [s1, s2, s3, s4, s5][index];
    sv.set(
      withSpring(1.35, SPRING_BOUNCE, () => {
        sv.set(withSpring(1.0, SPRING_SETTLE));
      }),
    );
  };

  const applyRating = (rating: number) => {
    "worklet";
    gradientWidth.set(withSpring((rating / FLAME_COUNT) * 100, SPRING_FILL));
    updateScales(rating);
    runOnJS(Presets.plunk)();
    runOnJS(onChange)(rating);
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      "worklet";
      const rating = Math.max(1, Math.min(FLAME_COUNT, Math.ceil(e.x / FLAME_WIDTH)));
      applyRating(rating);
    })
    .onUpdate((e) => {
      "worklet";
      const rating = Math.max(1, Math.min(FLAME_COUNT, Math.ceil(e.x / FLAME_WIDTH)));
      applyRating(rating);
    });

  const handleTap = (intensity: number) => {
    gradientWidth.set(withSpring((intensity / FLAME_COUNT) * 100, SPRING_FILL));
    updateScales(intensity);
    bounceFlame(intensity - 1);
    Presets.plunk();
    onChange(intensity);
  };

  const gradientStyle = useAnimatedStyle(() => ({
    width: `${gradientWidth.get()}%`,
    opacity: gradientWidth.get() > 0 ? 1 : 0,
  }));

  const f1Style = useAnimatedStyle(() => ({
    transform: [{ scale: s1.get() }],
    opacity: interpolate(s1.get(), [0.75, 1], [0.2, 1]),
  }));
  const f2Style = useAnimatedStyle(() => ({
    transform: [{ scale: s2.get() }],
    opacity: interpolate(s2.get(), [0.75, 1], [0.2, 1]),
  }));
  const f3Style = useAnimatedStyle(() => ({
    transform: [{ scale: s3.get() }],
    opacity: interpolate(s3.get(), [0.75, 1], [0.2, 1]),
  }));
  const f4Style = useAnimatedStyle(() => ({
    transform: [{ scale: s4.get() }],
    opacity: interpolate(s4.get(), [0.75, 1], [0.2, 1]),
  }));
  const f5Style = useAnimatedStyle(() => ({
    transform: [{ scale: s5.get() }],
    opacity: interpolate(s5.get(), [0.75, 1], [0.2, 1]),
  }));

  const flameStyles = [f1Style, f2Style, f3Style, f4Style, f5Style];

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View className="h-14 rounded-2xl overflow-hidden bg-surface/60">
        {/* Gradient fill bar */}
        <Animated.View
          style={[gradientStyle, { position: "absolute", top: 0, bottom: 0, left: 0 }]}
        >
          <LinearGradient
            colors={[`${accent}50`, `${accent}CC`, accent]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Flames row */}
        <Animated.View className="flex-row h-full items-center justify-around px-2">
          {Array.from({ length: FLAME_COUNT }, (_, i) => {
            const intensity = i + 1;
            return (
              <PressableFeedback
                key={intensity}
                onPress={() => handleTap(intensity)}
                accessibilityRole="button"
                accessibilityLabel={`Intensity ${intensity} of ${FLAME_COUNT}`}
                accessibilityState={{ selected: value === intensity }}
                className="flex-1 items-center justify-center h-full"
              >
                <Animated.View style={flameStyles[i]}>
                  <SymbolView
                    name="flame.fill"
                    size={26}
                    tintColor="#ffffff"
                    resizeMode="scaleAspectFit"
                  />
                </Animated.View>
              </PressableFeedback>
            );
          })}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
