// PROTOTYPE — issue #246. Throwaway route proving motion only.
// The morph spring is settled: see SPRING below. Delete this file and
// src/features/reflect/prototype/ when the real screen lands.
import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import AccountCircle from "@expo/material-symbols/account_circle.xml";
import CrisisAlert from "@expo/material-symbols/crisis_alert.xml";
import {
  ReduceMotion,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { useAppTheme } from "@/src/context/app-theme-context";
import { MorphCard } from "@/src/features/reflect/prototype/morph-card";
import { ProtoPicker } from "@/src/features/reflect/prototype/proto-picker";
import { TOP_VARIANTS } from "@/src/features/reflect/prototype/top-strip";
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

const REST_TOPS = [0.32, 0.29, 0.26, 0.35] as const;

const themeName = (palette: string, dark: boolean) =>
  (palette ? `${palette}-` : "") + (dark ? "dark" : "light");

export default function Prototype246() {
  const [expanded, setExpanded] = useState(false);
  const [skiaWash, setSkiaWash] = useState(false);
  // The real idle screen ships a transparent native header with two toolbar
  // buttons. It eats the top ~44pt, so every "dead air above the card" call
  // has to be made with it on.
  const [header, setHeader] = useState(true);
  const [themeIndex, setThemeIndex] = useState(0);
  const [topIndex, setTopIndex] = useState(0);
  // Card's resting top edge. 0.32 is where the morph was tuned; the lower
  // values pull the whole composition up under the Ledger band.
  const [restIndex, setRestIndex] = useState(0);
  // Bumped to force-remount the strip so its entrance replays.
  const [replayKey, setReplayKey] = useState(0);
  const insets = useSafeAreaInsets();
  const rawHeaderHeight = useHeaderHeight();
  // Hiding the header on expand drops useHeaderHeight to 0, which would yank
  // the strip up ~44pt mid-morph and drop it back on close. Freeze the last
  // non-zero height, the same trick idle-state uses across its transitions.
  const [headerHeight, setHeaderHeight] = useState(0);
  if (rawHeaderHeight > 0 && rawHeaderHeight !== headerHeight) {
    setHeaderHeight(rawHeaderHeight);
  }
  const router = useRouter();
  const crisisTint = useThemeColor("warning") as string;
  const { setTheme, toggleTheme, isDark } = useAppTheme();
  const reduceMotion = useReducedMotion();

  const TopStrip = TOP_VARIANTS[topIndex].Component;

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
      <Stack.Screen
        options={{
          // The real screen ties this to `isIdle`; expanded is the analog here.
          headerShown: header && !expanded,
          headerTransparent: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerBackVisible: false,
        }}
      />
      {header && !expanded && (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              icon={
                process.env.EXPO_OS === "ios" ? "person.circle" : AccountCircle
              }
              onPress={() => router.push("/(protected)/profile")}
            />
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon={
                process.env.EXPO_OS === "ios" ? "lifepreserver" : CrisisAlert
              }
              tintColor={crisisTint}
              onPress={() => router.push("/crisis-resources?from=idle_button")}
            />
          </Stack.Toolbar>
        </>
      )}

      {skiaWash ? <SkiaWash /> : <UniwindWash />}

      <View
        key={replayKey}
        style={{
          paddingTop: (header ? Math.max(headerHeight, insets.top) : insets.top) + 8,
        }}
      >
        <TopStrip />
      </View>

      <MorphCard
        progress={progress}
        fade={fade}
        reduceMotion={reduceMotion}
        expanded={expanded}
        onOpen={open}
        onClose={close}
        fluxOffset={TOP_VARIANTS[topIndex].flux}
        restTopFactor={REST_TOPS[restIndex]}
      />

      <View className="absolute bottom-24 left-0 right-0 items-center">
        <AppText className="text-xs text-foreground/30">
          {expanded ? "tap ✕ to reverse" : "tap the card"}
        </AppText>
      </View>

      <View style={styles.pickerRow}>
        <ProtoPicker
          items={TOP_VARIANTS.map((v) => v.name)}
          index={topIndex}
          onChange={setTopIndex}
          onReplay={() => setReplayKey((k) => k + 1)}
        />
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
        <Pressable
          style={styles.toggle}
          onPress={() => setRestIndex((i) => (i + 1) % REST_TOPS.length)}
        >
          <Text style={styles.toggleLabel}>top: {REST_TOPS[restIndex]}</Text>
        </Pressable>
        <Pressable style={styles.toggle} onPress={() => setHeader((v) => !v)}>
          <Text style={styles.toggleLabel}>header: {header ? "on" : "off"}</Text>
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
  pickerRow: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
  },
  toggleRow: {
    position: "absolute",
    bottom: 72,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
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
