import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';
import { STEP_BASE_DELAY, STEP_DURATION, STEP_INTERVAL } from '@/src/constants/frame-steps';
import type { FrameStep } from '@/src/constants/frame-steps';

type Props = {
  step: FrameStep;
  index: number;
};

export const StepReveal = ({ step, index }: Props) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(STEP_BASE_DELAY + index * STEP_INTERVAL)
        .duration(STEP_DURATION)
        .springify()
        .damping(15)}
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
