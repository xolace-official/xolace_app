// PROTOTYPE — issue #246. Throwaway route proving motion only.
// The morph spring is settled: see SPRING below. Delete this file and
// src/features/reflect/prototype/ when the real screen lands.
import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import {
  ReduceMotion,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AppText } from "@/src/components/shared/app-text";
import { useAppTheme } from "@/src/context/app-theme-context";
import { MorphCard } from "@/src/features/reflect/prototype/morph-card";
import { SkiaWash, UniwindWash } from "@/src/features/reflect/prototype/wash";
import { playTypingBegin } from "@/src/lib/haptics";

// Chosen over a livelier spring (damping 18 / stiffness 120) and a snappy one
// with a scrim: slow and overshoot-free reads as the space opening, where the
// other two read as an object bouncing and as a modal appearing.
const SPRING = { damping: 26, stiffness: 90, mass: 1.1 };

// Every palette, so the wash can be judged against all of them in one pass.
// Suffixed with the current mode, so cycling doesn't yank you back to dark.
const PALETTES = [
  "",
  "quiet",
  "reverie",
  "human",
  "nightly",
  "emerald",
  "rose",
  "platinum",
  "velvet",
  "noir",
] as const;

const themeName = (palette: string, dark: boolean) =>
  (palette ? `${palette}-` : "") + (dark ? "dark" : "light");

export default function Prototype246() {
  const [expanded, setExpanded] = useState(false);
  const [skiaWash, setSkiaWash] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const { setTheme, toggleTheme, isDark } = useAppTheme();
  const reduceMotion = useReducedMotion();

  const progress = useSharedValue(0);
  const fade = useSharedValue(1);

  const move = (to: number) => {
    if (reduceMotion) {
      // Same object at two sizes, cross-faded: no travel, no rotation.
      //
      // ReduceMotion.Never is required, not optional. With the system flag on,
      // Reanimated resolves every animation to its end value instantly — the
      // cross-fade included — so the card cut between its two sizes in a single
      // frame, which is the degraded screen story 32 rules out. Opacity is safe
      // under reduced motion; travel and rotation are what must go, and those
      // are already gone on this branch.
      fade.set(
        withSequence(
          withTiming(
            0,
            { duration: 90, reduceMotion: ReduceMotion.Never },
            (finished) => {
              "worklet";
              if (finished) progress.set(to);
            },
          ),
          withTiming(1, { duration: 140, reduceMotion: ReduceMotion.Never }),
        ),
      );
      return;
    }
    progress.set(withSpring(to, SPRING));
  };

  const open = () => {
    playTypingBegin();
    setExpanded(true);
    move(1);
  };

  const close = () => {
    Keyboard.dismiss();
    setExpanded(false);
    move(0);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {skiaWash ? <SkiaWash /> : <UniwindWash />}

      <MorphCard
        progress={progress}
        fade={fade}
        reduceMotion={reduceMotion}
        expanded={expanded}
        onOpen={open}
        onClose={close}
      />

      <View className="absolute bottom-24 left-0 right-0 items-center">
        <AppText className="text-xs text-foreground/30">
          {expanded ? "tap ✕ to reverse" : "tap the card"}
        </AppText>
      </View>

      <View style={styles.toggleRow}>
        <Pressable style={styles.toggle} onPress={() => setSkiaWash((v) => !v)}>
          <Text style={styles.toggleLabel}>
            wash: {skiaWash ? "skia" : "uniwind"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.toggle}
          onPress={() => {
            const next = (themeIndex + 1) % PALETTES.length;
            setThemeIndex(next);
            setTheme(themeName(PALETTES[next], isDark) as Parameters<typeof setTheme>[0]);
          }}
        >
          <Text style={styles.toggleLabel}>
            {themeName(PALETTES[themeIndex], isDark)}
          </Text>
        </Pressable>
        <Pressable style={styles.toggle} onPress={toggleTheme}>
          <Text style={styles.toggleLabel}>{isDark ? "dark" : "light"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Harness chrome, deliberately unthemed.
const styles = StyleSheet.create({
  toggleRow: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10,10,10,0.82)",
  },
  toggleLabel: { fontSize: 13, color: "#fff" },
});
