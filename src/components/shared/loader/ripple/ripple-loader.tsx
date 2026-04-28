import React from "react";
import { View } from "react-native";
import { Easing } from "react-native-reanimated";
import { useThemeColor } from "heroui-native";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

const RING_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 0.75, transform: [{ scale: 0.25 }] },
  100: { opacity: 0, transform: [{ scale: 1.5 }] },
};

const DELAYS = [0, 550, 1100];

/** Three concentric rings that expand outward like ripples, staggered 550ms apart. */
export const RippleLoader = () => {
  const accentColor = useThemeColor("accent");

  return (
    <View style={{ width: 80, height: 80 }}>
      {DELAYS.map((delay) => (
        <Loader
          key={delay}
          duration={1800}
          initialDelay={delay}
          easing={Easing.out(Easing.ease)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 80,
            height: 80,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader.KeyframeView
            keyframes={RING_KEYFRAMES}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 1.5,
              borderColor: accentColor,
              backgroundColor: "transparent",
            }}
          />
        </Loader>
      ))}
    </View>
  );
};
