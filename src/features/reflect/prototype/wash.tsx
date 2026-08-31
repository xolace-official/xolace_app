// PROTOTYPE — issue #246. Two candidate background washes, side by side.
// Delete with the rest of src/features/reflect/prototype.
import { View } from "react-native";

// The Skia wash shipped: it now lives with the real screen.
export { ReflectWash as SkiaWash } from "@/src/features/reflect/components/reflect-wash";

/** Uniwind's built-in gradient classes — no JS, no extra dependency. */
export const UniwindWash = () => (
  <View
    pointerEvents="none"
    className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-b from-background via-surface-secondary to-background"
  />
);
