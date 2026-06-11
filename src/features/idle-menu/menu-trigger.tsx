import { Pressable, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";
import { useThemeColor } from "heroui-native";
import { Presets } from "react-native-pulsar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  isOpen: SharedValue<boolean>;
  isOpenJS: boolean;
  onPress: () => void;
};

export const MenuTrigger = ({ isOpen, isOpenJS, onPress }: Props) => {
  const foregroundColor = useThemeColor("foreground") as string;

  const rStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.get() ? 0.5 : 1),
    transform: [{ scale: withTiming(isOpen.get() ? 0.6 : 1) }],
  }));

  const triggerStyle = [styles.trigger, rStyle];

  return (
    <AnimatedPressable
      onPress={() => {
        if (isOpenJS) {
          Presets.flick();
        } else {
          Presets.thud();
        }
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isOpenJS ? "Close menu" : "Open menu"}
      accessibilityHint={
        isOpenJS
          ? "Closes navigation options"
          : "Opens navigation options: Vent, Today, Timeline, Settings"
      }
      className="border-foreground/16"
      style={triggerStyle}
    >
      <GlassView
        glassEffectStyle="regular"
        style={styles.glass}
        isInteractive
      />
      <SymbolView
        name={{ ios: "line.3.horizontal", android: "menu" } as any}
        size={22}
        tintColor={foregroundColor}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  trigger: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    borderWidth: 0.5,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
  },
});
