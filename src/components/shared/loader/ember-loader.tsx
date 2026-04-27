import React from "react";
import { View } from "react-native";
import { Easing } from "react-native-reanimated";
import { useThemeColor } from "heroui-native";
import Loader from "./index";
import type { LoaderKeyframes } from "./types";

// Only animate numeric properties — backgroundColor is set via style using useThemeColor
const HALO_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 0.08, transform: [{ scale: 0.92 }] },
  100: { opacity: 0.22, transform: [{ scale: 1.12 }] },
};

const CORE_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 0.45, transform: [{ scale: 0.93 }] },
  100: { opacity: 0.75, transform: [{ scale: 1 }] },
};

const INNER_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 0.65, transform: [{ scale: 0.88 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
};

/**
 * Full-screen loading state shown while Convex auth resolves.
 * Breathing ember orb using the current theme's accent color.
 */
export const EmberLoader = () => {
  const accentColor = useThemeColor("accent");

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Loader
        duration={2400}
        reverse
        easing={Easing.inOut(Easing.ease)}
        style={{ alignItems: "center", justifyContent: "center", width: 96, height: 96 }}
      >
        {/* Outer halo */}
        <Loader.KeyframeView
          keyframes={HALO_KEYFRAMES}
          style={{
            position: "absolute",
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: accentColor,
          }}
        />
        {/* Mid glow */}
        <Loader.KeyframeView
          keyframes={CORE_KEYFRAMES}
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: accentColor,
          }}
        />
        {/* Inner core */}
        <Loader.KeyframeView
          keyframes={INNER_KEYFRAMES}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: accentColor,
          }}
        />
      </Loader>
    </View>
  );
};
