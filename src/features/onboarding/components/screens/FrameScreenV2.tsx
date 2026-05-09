import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

import { useAppStore } from '@/src/store/store';
import { playGentlePresence } from '@/src/lib/haptics';
import { AppText } from '@/src/components/shared/app-text';
import { DuskDriftBackdrop } from '@/src/features/onboarding/components/dusk-drift-backdrop';
import { PreviewCarousel } from '@/src/features/onboarding/components/preview-carousel';
import { FRAME_STEPS } from '@/src/features/onboarding/frame-steps';

export const FrameScreenV2 = () => {
  const insets = useSafeAreaInsets();
  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const router = useRouter();
  const posthog = usePostHog();

  const handlePress = () => {
    playGentlePresence();
    posthog.capture('onboarding_completed');
    setIntroSeen(true);
    router.replace('/(auth)/auth');
  };

  return (
    <View className="flex-1 bg-background">
      <DuskDriftBackdrop />

      <PreviewCarousel slides={FRAME_STEPS} />

      <Animated.View
        entering={FadeIn.delay(400).duration(900)}
        style={{ paddingTop: insets.top + 28, paddingHorizontal: 32, zIndex: 10 }}
      >
        <AppText
          className="text-foreground/85 text-[22px] leading-9"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          Here&apos;s{'\n'}
          <AppText
            className="text-accent text-[22px] leading-9"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            what happens.
          </AppText>
        </AppText>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(700).duration(900)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 36,
          paddingBottom: insets.bottom + 28,
          alignItems: 'center',
          gap: 20,
          zIndex: 10,
        }}
      >
        <AppText className="text-accent/40 text-xs text-center leading-4.5">
          Not a substitute for professional mental health care.{'\n'}
          If you&apos;re in crisis, please reach out to a professional.
        </AppText>

        <Animated.View entering={FadeInDown.delay(1000).duration(600).springify().damping(28)}>
          <Pressable
            onPress={handlePress}
            className="border border-accent/30 rounded-full px-9 py-3.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <AppText
              className="text-accent/80 text-[15px]"
              style={{ letterSpacing: 0.5 }}
            >
              That makes sense
            </AppText>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
};
