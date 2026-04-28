import React, { FC } from "react";
import { View } from "react-native";
import { Easing } from "react-native-reanimated";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

const LINE_COUNT = 12;
const SPIN_EASING = Easing.steps(LINE_COUNT);

/** Opacity per line index — fades from dim (0th) to bright (10th), then slightly less (11th). */
const LINE_OPACITIES = [0.08, 0.17, 0.25, 0.33, 0.42, 0.5, 0.58, 0.66, 0.75, 0.83, 1, 0.92];

/** Tests: rotate transform with stepped easing (iOS-style activity indicator). */
const SPIN_KEYFRAMES: LoaderKeyframes = {
  0: { transform: [{ rotate: "0deg" }] },
  1: { transform: [{ rotate: "360deg" }] },
};

export const RotatingLines: FC = () => {
  return (
    <Loader duration={750} easing={SPIN_EASING}>
      <Loader.KeyframeView
        keyframes={SPIN_KEYFRAMES}
        className="size-8 items-center justify-center"
      >
        {Array.from({ length: LINE_COUNT }, (_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 3,
              height: 9,
              borderRadius: 1.5,
              backgroundColor: "#a3a3a3",
              opacity: LINE_OPACITIES[i],
              transform: [{ rotate: `${i * 30}deg` }, { translateY: -10 }],
            }}
          />
        ))}
      </Loader.KeyframeView>
    </Loader>
  );
};
