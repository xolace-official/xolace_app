import React, { FC } from "react";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: scaleX + scaleY + translateY (squash-and-stretch bounce). */
const SQUISH_KEYFRAMES: LoaderKeyframes = {
  0: { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
  30: { transform: [{ translateY: -16 }, { scaleX: 0.9 }, { scaleY: 1.15 }] },
  60: { transform: [{ translateY: 0 }, { scaleX: 1.3 }, { scaleY: 0.7 }] },
  75: { transform: [{ translateY: -4 }, { scaleX: 0.9 }, { scaleY: 1.05 }] },
  90: { transform: [{ translateY: 0 }, { scaleX: 1.1 }, { scaleY: 0.95 }] },
  100: { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
};

export const Squish: FC = () => {
  return (
    <Loader duration={1200}>
      <Loader.KeyframeView
        keyframes={SQUISH_KEYFRAMES}
        className="size-6 rounded-lg bg-orange-500"
        style={{ borderCurve: "continuous" }}
      />
    </Loader>
  );
};
