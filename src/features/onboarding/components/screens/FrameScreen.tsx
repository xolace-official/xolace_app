import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

import { useAppStore } from '@/src/store/store';
import { playGentlePresence } from '@/src/lib/haptics';
import { AppText } from '@/src/components/shared/app-text';
import { EmberOrb } from '@/src/features/onboarding/components/ember-orb';
import { StepReveal } from '@/src/features/onboarding/components/step-reveal';
import { FRAME_STEPS, STEP_BASE_DELAY, STEP_INTERVAL } from '@/src/features/onboarding/frame-steps';

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL_FADE = { opacity: 0 };
const EASE_ANIMATE_FADE = { opacity: 1 };
const EASE_ORB_TRANSITION = { type: 'timing' as const, duration: 1000, easing: EASING };
const EASE_INITIAL_SLIDE = { opacity: 0, translateY: 20 };
const EASE_ANIMATE_SLIDE = { opacity: 1, translateY: 0 };

// Ember amber color — onboarding-specific, predates theme system
const EMBER_50 = 'rgba(217, 171, 111, 0.5)';
const EMBER_30 = 'rgba(217, 171, 111, 0.3)';
const EMBER_80 = 'rgba(217, 171, 111, 0.8)';

const DISCLAIMER_DELAY = STEP_BASE_DELAY + FRAME_STEPS.length * STEP_INTERVAL - 200;
const EASE_DISCLAIMER_TRANSITION = { type: 'timing' as const, duration: 600, delay: DISCLAIMER_DELAY, easing: EASING };

const CTA_DELAY = STEP_BASE_DELAY + FRAME_STEPS.length * STEP_INTERVAL;
const EASE_CTA_TRANSITION = {
  opacity: { type: 'timing' as const, duration: 400, delay: CTA_DELAY, easing: EASING },
  transform: { type: 'spring' as const, damping: 15, stiffness: 120, mass: 1, delay: CTA_DELAY },
};

const getCtaStyle = ({ pressed }: { pressed: boolean }) => ({
  alignSelf: 'flex-start' as const,
  borderWidth: 1,
  borderColor: EMBER_30,
  borderRadius: 100,
  paddingVertical: 14,
  paddingHorizontal: 32,
  opacity: pressed ? 0.7 : 1,
});

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

  const orbContainerStyle = { height: Math.min(height * 0.42, 320), alignItems: 'center' as const, justifyContent: 'center' as const, paddingTop: insets.top };
  const scrollContentStyle = { flexGrow: 1, justifyContent: 'space-between' as const, paddingHorizontal: 32, paddingBottom: insets.bottom + 24 };
  const disclaimerStyle = { color: EMBER_50, lineHeight: 18 };
  const ctaTextStyle = { color: EMBER_80, letterSpacing: 0.5 };

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Orb — capped height so it never crowds the content below */}
      <EaseView
        initialAnimate={EASE_INITIAL_FADE}
        animate={EASE_ANIMATE_FADE}
        transition={EASE_ORB_TRANSITION}
        style={orbContainerStyle}
      >
        <EmberOrb phase={phase} />
      </EaseView>

      {/* Steps + CTA — scrollable so the button is always reachable */}
      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.stepsContainer}>
          {FRAME_STEPS.map((step, i) => (
            <StepReveal key={step.id} step={step} index={i} />
          ))}
        </View>

        {/* Disclaimer */}
        <EaseView
          initialAnimate={EASE_INITIAL_FADE}
          animate={EASE_ANIMATE_FADE}
          transition={EASE_DISCLAIMER_TRANSITION}
        >
          <AppText
            style={disclaimerStyle}
            className='text-xs mb-5'
          >
            Xolace isn&apos;t a substitute for professional mental health care. If you&apos;re in crisis, please contact a professional.
          </AppText>
        </EaseView>

        {/* CTA */}
        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_CTA_TRANSITION}
        >
          <Pressable
            onPress={handlePress}
            style={getCtaStyle}
          >
            <AppText
              className="text-[15px]"
              style={ctaTextStyle}
            >
              That makes sense
            </AppText>
          </Pressable>
        </EaseView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollFlex: { flex: 1 },
  stepsContainer: { gap: 8, paddingTop: 16 },
});
