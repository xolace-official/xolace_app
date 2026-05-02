import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

import { useAppStore } from '@/src/store/store';
import { playGentlePresence } from '@/src/lib/haptics';
import { AppText } from '@/src/components/shared/app-text';
import { EmberOrb } from '@/src/features/onboarding/components/ember-orb';
import { StepReveal } from '@/src/features/onboarding/components/step-reveal';
import { FRAME_STEPS, STEP_BASE_DELAY, STEP_INTERVAL } from '@/src/features/onboarding/frame-steps';

export const FrameScreen = () => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const router = useRouter();
  const posthog = usePostHog();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1700);
    const t2 = setTimeout(() => setPhase(2), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handlePress = () => {
    playGentlePresence();
    posthog.capture('onboarding_completed');
    setIntroSeen(true);
    router.replace('/(auth)/auth');
  };

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Orb — capped height so it never crowds the content below */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        style={{
          height: Math.min(height * 0.42, 320),
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
        }}
      >
        <EmberOrb phase={phase} />
      </Animated.View>

      {/* Steps + CTA — scrollable so the button is always reachable */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ gap: 8, paddingTop: 16 }}>
          {FRAME_STEPS.map((step, i) => (
            <StepReveal key={step.id} step={step} index={i} />
          ))}
        </View>

        {/* Disclaimer */}
        <Animated.View
          entering={FadeIn.delay(STEP_BASE_DELAY + FRAME_STEPS.length * STEP_INTERVAL - 200).duration(600)}
        >
          <AppText
            style={{
              color: 'rgba(217, 171, 111, 0.5)',
              lineHeight: 18,
            }}
            className='text-xs mb-5'
          >
            Xolace isn&apos;t a substitute for professional mental health care. If you&apos;re in crisis, please contact a professional.
          </AppText>
        </Animated.View>

        {/* CTA */}
        <Animated.View
          entering={FadeInDown.delay(STEP_BASE_DELAY + FRAME_STEPS.length * STEP_INTERVAL).duration(800).springify().damping(15)}
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
      </ScrollView>
    </View>
  );
};
