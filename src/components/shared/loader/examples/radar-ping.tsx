import React, { FC } from "react";
import { View } from "react-native";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: scale + opacity + borderWidth (transform + multiple numeric). */
const PING_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 1, borderWidth: 3, transform: [{ scale: 0.4 }] },
  80: { opacity: 0, borderWidth: 0.5, transform: [{ scale: 1.6 }] },
  100: { opacity: 0, borderWidth: 0.5, transform: [{ scale: 1.6 }] },
};

export const RadarPing: FC = () => {
  return (
    <Loader
      duration={1500}
      className="items-center justify-center"
      style={{ width: 48, height: 48 }}
    >
      <Loader.KeyframeView
        keyframes={PING_KEYFRAMES}
        className="size-10 rounded-full border-cyan-500"
      />
      <View className="absolute size-2 rounded-full bg-cyan-500" />
    </Loader>
  );
};
