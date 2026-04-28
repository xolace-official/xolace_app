import React, { FC } from "react";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: height + scaleY (numeric + transform) with staggered bars. */
const BAR_1_KEYFRAMES: LoaderKeyframes = {
  0: { height: 8 },
  20: { height: 28 },
  40: { height: 8 },
};

const BAR_2_KEYFRAMES: LoaderKeyframes = {
  10: { height: 8 },
  30: { height: 28 },
  50: { height: 8 },
};

const BAR_3_KEYFRAMES: LoaderKeyframes = {
  20: { height: 8 },
  40: { height: 28 },
  60: { height: 8 },
};

const BAR_4_KEYFRAMES: LoaderKeyframes = {
  30: { height: 8 },
  50: { height: 28 },
  70: { height: 8 },
};

const BAR_5_KEYFRAMES: LoaderKeyframes = {
  40: { height: 8 },
  60: { height: 28 },
  80: { height: 8 },
};

const barClassName = "w-1.5 rounded-full bg-teal-500";

export const WaveBar: FC = () => {
  return (
    <Loader className="flex-row items-center justify-center gap-0.5" duration={1200}>
      <Loader.KeyframeView keyframes={BAR_1_KEYFRAMES} className={barClassName} />
      <Loader.KeyframeView keyframes={BAR_2_KEYFRAMES} className={barClassName} />
      <Loader.KeyframeView keyframes={BAR_3_KEYFRAMES} className={barClassName} />
      <Loader.KeyframeView keyframes={BAR_4_KEYFRAMES} className={barClassName} />
      <Loader.KeyframeView keyframes={BAR_5_KEYFRAMES} className={barClassName} />
    </Loader>
  );
};
