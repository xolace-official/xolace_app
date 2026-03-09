import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import type { FrameStep } from '@/constants/frame-steps';

type Props = {
  step: FrameStep;
  index: number;
};

export const StepReveal = ({ step, index }: Props) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(800 + index * 900)
        .duration(800)
        .springify()
        .damping(20)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        paddingVertical: 10,
      }}
    >
      {/* Amber dot */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(217, 171, 111, 0.6)',
          marginTop: 7,
        }}
      />

      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          className="text-[16px]"
          style={{
            fontFamily: 'Poppins-Medium',
            color: 'rgba(217, 171, 111, 0.85)',
          }}
        >
          {step.action}
        </AppText>
        <AppText
          className="text-[14px] text-white/40"
          style={{ fontWeight: '300' }}
        >
          {step.detail}
        </AppText>
      </View>
    </Animated.View>
  );
};
