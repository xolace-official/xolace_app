import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { Presets } from 'react-native-pulsar';

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

  useEffect(() => {
    Presets.feather();
  }, []);

  const handlePress = () => {
    playGentlePresence();
    posthog?.capture('onboarding_completed');
    setIntroSeen(true);
    router.replace('/(auth)/auth');
  };

  return (
    <View className="flex-1 bg-background">
      <DuskDriftBackdrop />

      <PreviewCarousel slides={FRAME_STEPS} />

      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 900, delay: 400, easing: [0.455, 0.03, 0.515, 0.955] }}
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
      </EaseView>

      <View
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
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            opacity: { type: 'timing', duration: 400, delay: 1000, easing: [0.455, 0.03, 0.515, 0.955] },
            transform: { type: 'spring', damping: 28, stiffness: 120, mass: 1, delay: 1000 },
          }}
        >
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
        </EaseView>
      </View>
    </View>
  );
};
