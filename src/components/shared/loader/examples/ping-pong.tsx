import React, { FC } from "react";
import { Easing } from "react-native-reanimated";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

const PING_PONG_EASING = Easing.inOut(Easing.ease);

/** Tests: translateX + translateY with parabolic arc and reverse (ping-pong ball). */
const PING_PONG_KEYFRAMES: LoaderKeyframes = {
  0: { opacity: 1, transform: [{ translateX: -14 }, { translateY: 2 }, { scale: 1 }] },
  50: { opacity: 0.75, transform: [{ translateX: 0 }, { translateY: -12 }, { scale: 0.9 }] },
  100: { opacity: 0.25, transform: [{ translateX: 14 }, { translateY: 4 }, { scale: 0.75 }] },
};

export const PingPong: FC = () => {
  return (
    <Loader
      duration={500}
      reverse
      easing={PING_PONG_EASING}
      className="size-10 items-center justify-center"
    >
      <Loader.KeyframeView
        keyframes={PING_PONG_KEYFRAMES}
        className="size-3 rounded-full bg-white"
      />
    </Loader>
  );
};
