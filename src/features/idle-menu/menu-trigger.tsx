import { Pressable, StyleSheet } from "react-native";
import { useMemo } from "react";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { Presets } from "react-native-pulsar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  isOpen: SharedValue<boolean>;
  isOpenJS: boolean;
  onPress: () => void;
};

const ICON_DIM_STYLE = { opacity: 0.5 };

export const MenuTrigger = ({ isOpen, isOpenJS, onPress }: Props) => {
  const foregroundColor = useThemeColor("foreground");
  const borderColor = useThemeColor("accent");

  const rStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 0.5 : 1),
    transform: [{ scale: withTiming(isOpen.value ? 0.6 : 1) }],
  }));

  const triggerStyle = useMemo(
    () => [styles.trigger, { borderColor }, rStyle],
    [borderColor, rStyle],
  );
  const iconStyle = useMemo(() => ICON_DIM_STYLE, []);

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
          : "Opens navigation options: Vent, Timeline, Settings"
      }
      style={triggerStyle}
    >
      <SymbolView
        name={{ ios: "ellipsis", android: "more_horiz" } as any}
        size={20}
        tintColor={foregroundColor}
        style={iconStyle}
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
