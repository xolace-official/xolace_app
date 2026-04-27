import React, { FC } from "react";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: scale + opacity (numeric properties + transform). */
const PULSE_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 0.3, transform: [{ scale: 0.6 }] },
  50: { opacity: 1, transform: [{ scale: 1.2 }] },
  100: { opacity: 0.3, transform: [{ scale: 0.6 }] },
};

export const PulseDot: FC = () => {
  return (
    <Loader duration={1000} reverse>
      <Loader.KeyframeView
        keyframes={PULSE_KEYFRAMES}
        className="size-6 rounded-full bg-rose-500"
      />
    </Loader>
  );
};
