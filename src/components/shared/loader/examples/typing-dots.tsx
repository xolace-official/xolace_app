import React, { FC } from "react";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: opacity + scale with staggered keyframe positions. */
const DOT_1_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 0.2, transform: [{ scale: 0.5 }] },
  20: { opacity: 1, transform: [{ scale: 1 }] },
  40: { opacity: 0.2, transform: [{ scale: 0.5 }] },
};

const DOT_2_KEYFRAMES: LoaderKeyframes = {
  20: { opacity: 0.2, transform: [{ scale: 0.5 }] },
  40: { opacity: 1, transform: [{ scale: 1 }] },
  60: { opacity: 0.2, transform: [{ scale: 0.5 }] },
};

const DOT_3_KEYFRAMES: LoaderKeyframes = {
  40: { opacity: 0.2, transform: [{ scale: 0.5 }] },
  60: { opacity: 1, transform: [{ scale: 1 }] },
  80: { opacity: 0.2, transform: [{ scale: 0.5 }] },
};

export const TypingDots: FC = () => {
  return (
    <Loader className="flex-row items-center justify-center gap-1.5" duration={1400}>
      <Loader.KeyframeView
        keyframes={DOT_1_KEYFRAMES}
        className="size-2.5 rounded-full bg-zinc-300"
      />
      <Loader.KeyframeView
        keyframes={DOT_2_KEYFRAMES}
        className="size-2.5 rounded-full bg-zinc-300"
      />
      <Loader.KeyframeView
        keyframes={DOT_3_KEYFRAMES}
        className="size-2.5 rounded-full bg-zinc-300"
      />
    </Loader>
  );
};
