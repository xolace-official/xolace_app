import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useThemeColor } from 'heroui-native';

type Props = {
  size?: number;
  playing?: boolean;
};

export const SpeakerIcon: React.FC<Props> = ({ size = 20, playing = false }) => {
  const accent = useThemeColor('accent');

  if (playing) {
    // Speaker with sound waves
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M11 5L6 9H2v6h4l5 4V5z"
          fill={accent}
        />
        <Path
          d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"
          stroke={accent}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // Speaker without sound waves (ready but not playing)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2v6h4l5 4V5z"
        fill={accent}
        opacity={0.5}
      />
    </Svg>
  );
};
