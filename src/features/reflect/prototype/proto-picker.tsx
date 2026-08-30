// PROTOTYPE harness chrome — deliberately unthemed, per the prototype skill's
// picker spec (dark glass pill, bottom-center, never adapts to the project).
// Delete with the rest of src/features/reflect/prototype.
import { useState } from "react";
import { LayoutRectangle, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = {
  items: readonly string[];
  index: number;
  onChange: (i: number) => void;
  onReplay?: () => void;
};

const SLIDE = { duration: 250, easing: Easing.bezier(0.23, 1, 0.32, 1) };

export const ProtoPicker = ({ items, index, onChange, onReplay }: Props) => {
  const [rects, setRects] = useState<Record<number, LayoutRectangle>>({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const ready = useSharedValue(false);

  const place = (i: number, r: LayoutRectangle) => {
    setRects((prev) => ({ ...prev, [i]: r }));
    if (i !== index) return;
    if (ready.get()) {
      x.set(withTiming(r.x, SLIDE));
      w.set(withTiming(r.width, SLIDE));
    } else {
      x.set(r.x);
      w.set(r.width);
      ready.set(true);
    }
  };

  const select = (i: number) => {
    const r = rects[i];
    if (r) {
      x.set(withTiming(r.x, SLIDE));
      w.set(withTiming(r.width, SLIDE));
    }
    onChange(i);
  };

  const highlight = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    width: w.get(),
  }));

  return (
    <View style={styles.picker} accessibilityLabel="Prototype variants">
      <Animated.View style={[styles.highlight, highlight]} pointerEvents="none" />
      {items.map((label, i) => (
        <Pressable
          key={label}
          onPress={() => select(i)}
          onLayout={(e) => place(i, e.nativeEvent.layout)}
          accessibilityRole="button"
          accessibilityState={{ selected: i === index }}
          style={styles.item}
        >
          <Text style={[styles.label, i === index && styles.labelActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
      {onReplay && (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={onReplay}
            accessibilityLabel="Replay animation"
            style={styles.item}
          >
            <Text style={styles.replay}>↻</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 2,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(10,10,10,0.82)",
  },
  highlight: {
    position: "absolute",
    top: 4,
    left: 0,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  item: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: "center",
  },
  label: { fontSize: 13, lineHeight: 13, color: "rgba(255,255,255,0.55)" },
  labelActive: { color: "#fff" },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  replay: { fontSize: 14, lineHeight: 16, color: "rgba(255,255,255,0.55)" },
});
