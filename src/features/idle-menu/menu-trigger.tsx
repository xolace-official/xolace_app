import { Pressable, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { playSoftPress } from "@/src/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  isOpen: SharedValue<boolean>;
  onPress: () => void;
};

export const MenuTrigger = ({ isOpen, onPress }: Props) => {
  const foregroundColor = useThemeColor("foreground");
  const borderColor = useThemeColor("accent");

  const rStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 0.5 : 1),
    transform: [{ scale: withTiming(isOpen.value ? 0.5 : 1) }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        playSoftPress();
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      accessibilityHint="Opens navigation options: Vent, Timeline, Settings"
      style={[styles.trigger, { borderColor }, rStyle]}
    >
      <SymbolView
        name={{ ios: "ellipsis", android: "more_horiz" } as any}
        size={20}
        tintColor={foregroundColor}
        style={{ opacity: 0.5 }}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  trigger: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderCurve: "continuous",
  },
});
