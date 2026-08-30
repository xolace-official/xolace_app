// PROTOTYPE — issue #246. Dev-only entry point; the `xolace://` scheme is shared
// across variants, so a deep link lands in whichever build claimed it.
// Delete with the rest of src/features/reflect/prototype.
import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

export const ProtoEntry = () => {
  const router = useRouter();
  if (!__DEV__) return null;

  return (
    <Pressable
      style={styles.pill}
      onPress={() => router.push("/(protected)/prototype-246")}
      accessibilityLabel="Open prototype 246"
    >
      <Text style={styles.label}>246</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    top: "48%",
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(10,10,10,0.82)",
  },
  label: { fontSize: 12, color: "#fff" },
});
