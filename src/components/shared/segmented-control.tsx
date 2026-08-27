import { createContext, useCallback, useEffect, useMemo, useState, use } from "react";
import { Pressable, View, type LayoutChangeEvent, type PressableProps, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedProps,
  type WithTimingConfig,
} from "react-native-reanimated";
import type { WithSpringConfig } from "react-native-reanimated/lib/typescript/animation/spring";
import { playTextureSelect } from "@/src/lib/haptics";
import { cn } from "@/src/lib/utils";

type ItemMeasurements = { width: number; height: number; x: number };

type ContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  measurements: Record<string, ItemMeasurements>;
  setMeasurements: (key: string, measurements: ItemMeasurements) => void;
};

const SegmentedControlContext = createContext<ContextValue>({
  value: "",
  onValueChange: () => {},
  measurements: {},
  setMeasurements: () => {},
});

type RootProps = ViewProps & {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

function SegmentedControlRoot({ value, onValueChange, className, children, ...props }: RootProps) {
  const [measurements, setMeasurementsState] = useState<Record<string, ItemMeasurements>>({});

  const setMeasurements = useCallback((key: string, next: ItemMeasurements) => {
    setMeasurementsState((prev) => ({ ...prev, [key]: next }));
  }, []);

  const contextValue = useMemo(
    () => ({ value, onValueChange, measurements, setMeasurements }),
    [value, onValueChange, measurements, setMeasurements],
  );

  return (
    <SegmentedControlContext value={contextValue}>
      <View className={cn("flex-row", className)} {...props}>
        {children}
      </View>
    </SegmentedControlContext>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ItemProps = AnimatedProps<PressableProps> & { value: string; className?: string };

function SegmentedControlItem({ value, className, onPress, ...props }: ItemProps) {
  const { onValueChange, setMeasurements, value: activeValue } = use(SegmentedControlContext);
  const isActive = activeValue === value;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height, x } = event.nativeEvent.layout;
      setMeasurements(value, { width, height, x });
    },
    [value, setMeasurements],
  );

  const handlePress: PressableProps["onPress"] = useCallback(
    (event) => {
      // The detent catching — fired on the change itself, not on every tap, so
      // re-tapping the selected segment stays silent.
      if (!isActive) playTextureSelect();
      onValueChange(value);
      // AnimatedProps<PressableProps>["onPress"] also allows a SharedValue,
      // but callers only ever pass a plain function here.
      (onPress as PressableProps["onPress"])?.(event);
    },
    [value, isActive, onValueChange, onPress],
  );

  return (
    <AnimatedPressable
      className={className}
      onLayout={handleLayout}
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
      {...props}
    />
  );
}

type IndicatorProps = AnimatedProps<ViewProps> & {
  className?: string;
  animationConfig?:
    | { type: "timing"; config?: WithTimingConfig }
    | { type: "spring"; config?: WithSpringConfig };
};

const DEFAULT_ANIMATION_CONFIG: IndicatorProps["animationConfig"] = { type: "spring" };

function SegmentedControlIndicator({
  className,
  style,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
  ...props
}: IndicatorProps) {
  const { value, measurements } = use(SegmentedControlContext);
  const active = measurements[value];
  // Geometry lives in shared values, written from an effect — never derived
  // inside the worklet. A worklet that both reads and writes its own state
  // re-runs itself, so which branch it took depended on timing: that is why the
  // pill sometimes sat under the wrong segment, or vanished, after navigating
  // back into a screen that re-laid-out its items.
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const left = useSharedValue(0);
  const positioned = useSharedValue(0);
  const animationType = animationConfig?.type;
  const reanimatedConfig = animationConfig?.config;

  useEffect(() => {
    // A segment with no measurement yet (first layout, or a remount mid-flight)
    // holds the last known position instead of collapsing the pill to nothing —
    // an invisible indicator is what made tapping the already-selected segment
    // look dead.
    if (!active) return;
    const first = positioned.get() === 0;
    const to = (target: number) =>
      first
        ? target
        : animationType === "timing"
          ? withTiming(target, reanimatedConfig as WithTimingConfig)
          : withSpring(target, reanimatedConfig as WithSpringConfig);
    width.set(to(active.width));
    height.set(to(active.height));
    left.set(to(active.x));
    if (first) positioned.set(1);
  }, [
    active,
    animationType,
    reanimatedConfig,
    width,
    height,
    left,
    positioned,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.get(),
    height: height.get(),
    left: left.get(),
    opacity: positioned.get(),
  }));

  return <Animated.View className={cn("absolute", className)} style={[animatedStyle, style]} {...props} />;
}

SegmentedControlRoot.displayName = "SegmentedControl";
SegmentedControlItem.displayName = "SegmentedControl.Item";
SegmentedControlIndicator.displayName = "SegmentedControl.Indicator";

export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Item: SegmentedControlItem,
  Indicator: SegmentedControlIndicator,
});
