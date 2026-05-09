import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

import { useAppStore } from '@/src/store/store';
import { playGentlePresence } from '@/src/lib/haptics';
import { AppText } from '@/src/components/shared/app-text';
import { EmberCarousel } from '@/src/features/onboarding/components/ember-carousel';
import { EMBER_SLIDES } from '@/src/features/onboarding/ember-slides';

// One full carousel loop = 4 slides × 3200ms
const CTA_DELAY_MS = 3200 * 4 + 200;

export const FrameScreenV2 = () => {
  const [ctaVisible, setCtaVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const router = useRouter();
  const posthog = usePostHog();

  const glowScale = useSharedValue(1);

  useEffect(() => {
    glowScale.value = withRepeat(
      withTiming(1.22, { duration: 5200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    const t = setTimeout(() => setCtaVisible(true), CTA_DELAY_MS);
    return () => clearTimeout(t);
  }, [glowScale]);

  const rGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const handlePress = () => {
    playGentlePresence();
    posthog.capture('onboarding_completed');
    setIntroSeen(true);
    router.replace('/(auth)/auth');
  };

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Breathing ember glow — campfire warmth behind the arc */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          },
          rGlowStyle,
        ]}
      >
        <View
          style={{
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: 'rgba(130,60,8,0.07)',
            boxShadow: '0 0 160px 80px rgba(170,80,8,0.07)',
          }}
        />
      </Animated.View>

      {/* Principle cards orbiting in a semicircle */}
      <EmberCarousel slides={EMBER_SLIDES} />

      {/* Bottom: disclaimer + CTA, fade in gently */}
      <Animated.View
        entering={FadeIn.delay(1200).duration(1000)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 36,
          paddingBottom: insets.bottom + 28,
          alignItems: 'center',
          gap: 24,
        }}
      >
        <AppText
          style={{
            color: 'rgba(217,171,111,0.35)',
            fontSize: 11,
            lineHeight: 17,
            textAlign: 'center',
          }}
        >
          Not a substitute for professional mental health care.{'\n'}
          If you&apos;re in crisis, please reach out to a professional.
        </AppText>

        {ctaVisible && (
          <Animated.View entering={FadeInDown.duration(900).springify().damping(14)}>
            <Pressable
              onPress={handlePress}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: 'rgba(217,171,111,0.28)',
                borderRadius: 100,
                paddingVertical: 14,
                paddingHorizontal: 36,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <AppText
                style={{
                  color: 'rgba(217,171,111,0.82)',
                  fontSize: 15,
                  letterSpacing: 0.5,
                }}
              >
                That makes sense
              </AppText>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};
