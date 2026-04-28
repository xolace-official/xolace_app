import React, { FC } from "react";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

/** Tests: borderRadius + rotate + backgroundColor (numeric + transform + color). */
const MORPH_KEYFRAMES: LoaderKeyframes = {
  0: { borderRadius: 4, backgroundColor: "#ef4444", transform: [{ rotate: "0deg" }] },
  50: { borderRadius: 20, backgroundColor: "#22c55e", transform: [{ rotate: "180deg" }] },
  100: { borderRadius: 4, backgroundColor: "#ef4444", transform: [{ rotate: "360deg" }] },
};

export const MorphSquare: FC = () => {
  return (
    <Loader duration={2000}>
      <Loader.KeyframeView keyframes={MORPH_KEYFRAMES} className="size-8" />
    </Loader>
  );
};
