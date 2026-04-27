import React, { FC } from "react";
import { Easing } from "react-native-reanimated";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

const BREATHING_EASING = Easing.bezier(0.45, 0, 0.55, 1);

/** Tests: width + height + borderRadius + opacity (numeric properties) with custom easing. */
const BREATHING_KEYFRAMES: LoaderKeyframes = {
  0: { width: 20, height: 20, borderRadius: 4, opacity: 0.4 },
  50: { width: 36, height: 36, borderRadius: 18, opacity: 1 },
  100: { width: 20, height: 20, borderRadius: 4, opacity: 0.4 },
};

export const BreathingBox: FC = () => {
  return (
    <Loader duration={2500} easing={BREATHING_EASING}>
      <Loader.KeyframeView keyframes={BREATHING_KEYFRAMES} className="bg-emerald-500" />
    </Loader>
  );
};
