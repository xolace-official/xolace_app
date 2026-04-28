import React, { FC } from "react";
import Loader from "../index";
import { LoaderKeyframes } from "../types";

const BOUNCE_AMPLITUDE = 12;

const DOT_COLORS = ["#0ea5e9", "#0c4a6e"];

/** Staggered keyframes: bounce peaks at 30%/60%, 50%/80%, 70%/100% of progress. */
const DOT_1_KEYFRAMES: LoaderKeyframes = {
  0: { backgroundColor: DOT_COLORS[0], transform: [{ translateY: 0 }] },
  30: { backgroundColor: DOT_COLORS[1], transform: [{ translateY: -BOUNCE_AMPLITUDE }] },
  60: { backgroundColor: DOT_COLORS[0], transform: [{ translateY: 0 }] },
};

const DOT_2_KEYFRAMES: LoaderKeyframes = {
  20: { backgroundColor: DOT_COLORS[0], transform: [{ translateY: 0 }] },
  50: { backgroundColor: DOT_COLORS[1], transform: [{ translateY: -BOUNCE_AMPLITUDE }] },
  80: { backgroundColor: DOT_COLORS[0], transform: [{ translateY: 0 }] },
};

const DOT_3_KEYFRAMES: LoaderKeyframes = {
  40: { backgroundColor: DOT_COLORS[0], transform: [{ translateY: 0 }] },
  70: { backgroundColor: DOT_COLORS[1], transform: [{ translateY: -BOUNCE_AMPLITUDE }] },
  100: { backgroundColor: DOT_COLORS[0], transform: [{ translateY: 0 }] },
};

const DOT_CLASS_NAME = "size-2.5 rounded-full";

export const BouncingDots: FC = () => {
  return (
    <Loader className="flex-row items-center justify-center gap-1" duration={1200}>
      <Loader.KeyframeView keyframes={DOT_1_KEYFRAMES} className={DOT_CLASS_NAME} />
      <Loader.KeyframeView keyframes={DOT_2_KEYFRAMES} className={DOT_CLASS_NAME} />
      <Loader.KeyframeView keyframes={DOT_3_KEYFRAMES} className={DOT_CLASS_NAME} />
    </Loader>
  );
};
