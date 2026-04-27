import React, { FC } from "react";
import { View, Text } from "react-native";
import { BouncingDots } from "./bouncing-dots";
import { PulseDot } from "./pulse-dot";
import { Spinner } from "./spinner";
import { AudioBars } from "./audio-bars";
import { BreathingBox } from "./breathing-box";
import { TypingDots } from "./typing-dots";
import { PingPong } from "./ping-pong";
import { WaveBar } from "./wave-bar";
import { MorphSquare } from "./morph-square";
import { RotatingLines } from "./rotating-lines";
import { RadarPing } from "./radar-ping";
import { Squish } from "./squish";

type LoaderCellProps = {
  label: string;
  children: React.ReactNode;
};

const LoaderCell: FC<LoaderCellProps> = ({ label, children }) => {
  return (
    <View className="flex-1 items-center justify-center gap-2 py-3">
      <View className="size-12 items-center justify-center">{children}</View>
      <Text className="text-xs text-zinc-400">{label}</Text>
    </View>
  );
};

export const LoaderDemo: FC = () => {
  return (
    <>
      {/* Row 1 */}
      <View className="flex-row">
        <LoaderCell label="Dots">
          <BouncingDots />
        </LoaderCell>
        <LoaderCell label="Pulse">
          <PulseDot />
        </LoaderCell>
        <LoaderCell label="Spin">
          <Spinner />
        </LoaderCell>
        <LoaderCell label="Audio">
          <AudioBars />
        </LoaderCell>
      </View>

      {/* Row 2 */}
      <View className="flex-row">
        <LoaderCell label="Breathe">
          <BreathingBox />
        </LoaderCell>
        <LoaderCell label="Typing">
          <TypingDots />
        </LoaderCell>
        <LoaderCell label="Squish">
          <Squish />
        </LoaderCell>
        <LoaderCell label="Ping Pong">
          <PingPong />
        </LoaderCell>
      </View>

      {/* Row 3 */}
      <View className="flex-row">
        <LoaderCell label="Wave">
          <WaveBar />
        </LoaderCell>
        <LoaderCell label="Morph">
          <MorphSquare />
        </LoaderCell>
        <LoaderCell label="Lines">
          <RotatingLines />
        </LoaderCell>
        <LoaderCell label="Radar">
          <RadarPing />
        </LoaderCell>
      </View>
    </>
  );
};
