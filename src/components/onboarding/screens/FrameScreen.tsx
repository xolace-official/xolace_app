import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
// import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/shared/app-text';
import { EmberOrb } from '@/components/onboarding/ember-orb';
import { StepReveal } from '@/components/onboarding/step-reveal';
import { FRAME_STEPS } from '@/constants/frame-steps';

export const FrameScreen = () => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const insets = useSafeAreaInsets();
//   const router = useRouter();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1700);
    const t2 = setTimeout(() => setPhase(2), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: navigate to auth screen
  };

  return (
    <View
      className="flex-1 bg-neutral-950"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* Orb — top portion */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        style={{
          flex: 4,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
        }}
      >
        <EmberOrb phase={phase} />
      </Animated.View>

      {/* Steps + CTA — bottom portion */}
      <View
        style={{
          flex: 5,
          justifyContent: 'space-between',
          paddingHorizontal: 32,
        }}
      >
        <View style={{ gap: 8, paddingTop: 16 }}>
          {FRAME_STEPS.map((step, i) => (
            <StepReveal key={step.id} step={step} index={i} />
          ))}
        </View>

        {/* CTA */}
        <Animated.View
          entering={FadeInDown.delay(3200).duration(800).springify().damping(20)}
          style={{ paddingBottom: 24 }}
        >
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              borderWidth: 1,
              borderColor: 'rgba(217, 171, 111, 0.3)',
              borderRadius: 100,
              paddingVertical: 14,
              paddingHorizontal: 32,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText
              className="text-[15px]"
              style={{
                color: 'rgba(217, 171, 111, 0.8)',
                letterSpacing: 0.5,
              }}
            >
              That makes sense
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};
