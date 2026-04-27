import React, { FC } from "react";
import { View } from "react-native";
import Loader from "../index";
import type { LoaderKeyframes } from "../types";

const MAX_BAR_HEIGHT = 28;
const SOURCE_MAX_HEIGHT = 80;

/** Scales a source height value (0–80) to a pixel height (0–MAX_BAR_HEIGHT). */
const scaleHeight = (value: number): number => (value / SOURCE_MAX_HEIGHT) * MAX_BAR_HEIGHT;

/** Builds evenly-spaced keyframes from a list of height values (mirroring SVG animate). */
const buildBarKeyframes = (values: number[]): LoaderKeyframes => {
  const lastIndex = values.length - 1;
  const step = 100 / lastIndex;
  const keyframes: LoaderKeyframes = {};
  for (let i = 0; i <= lastIndex; i++) {
    const key = i === lastIndex ? 100 : Math.round(i * step * 100) / 100;
    keyframes[key] = { height: scaleHeight(values[i]) };
  }
  return keyframes;
};

/** Tests: height numeric property with multiple independent durations (audio equalizer). */
const BAR_1_KEYFRAMES = buildBarKeyframes([
  20, 45, 57, 80, 64, 32, 66, 45, 64, 23, 66, 13, 64, 56, 34, 34, 2, 23, 76, 79, 20,
]);
const BAR_2_KEYFRAMES = buildBarKeyframes([80, 55, 33, 5, 75, 23, 73, 33, 12, 14, 60, 80]);
const BAR_3_KEYFRAMES = buildBarKeyframes([50, 34, 78, 23, 56, 23, 34, 76, 80, 54, 21, 50]);
const BAR_4_KEYFRAMES = buildBarKeyframes([30, 45, 13, 80, 56, 72, 45, 76, 34, 23, 67, 30]);

type AudioBarProps = {
  keyframes: LoaderKeyframes;
  duration: number;
};

const AudioBar: FC<AudioBarProps> = ({ keyframes, duration }) => {
  return (
    <Loader duration={duration}>
      <Loader.KeyframeView keyframes={keyframes} className="w-1.5 rounded-sm bg-emerald-500" />
    </Loader>
  );
};

export const AudioBars: FC = () => {
  return (
    <View className="flex-row items-end gap-1" style={{ height: MAX_BAR_HEIGHT }}>
      <AudioBar keyframes={BAR_1_KEYFRAMES} duration={4300} />
      <AudioBar keyframes={BAR_2_KEYFRAMES} duration={2000} />
      <AudioBar keyframes={BAR_3_KEYFRAMES} duration={1400} />
      <AudioBar keyframes={BAR_4_KEYFRAMES} duration={2000} />
    </View>
  );
};
