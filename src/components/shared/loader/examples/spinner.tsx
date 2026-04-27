import React, { FC } from "react";
import { View } from "react-native";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: rotate transform. */
const SPIN_KEYFRAMES: LoaderKeyframes = {
  0: { transform: [{ rotate: "0deg" }] },
  1: { transform: [{ rotate: "360deg" }] },
};

export const Spinner: FC = () => {
  return (
    <Loader duration={800}>
      <View className="size-7 rounded-full border-3 border-sky-500/10" />
      <Loader.KeyframeView
        keyframes={SPIN_KEYFRAMES}
        className="absolute size-7 rounded-full border-3 border-transparent border-t-sky-500 border-r-sky-500"
      />
    </Loader>
  );
};
