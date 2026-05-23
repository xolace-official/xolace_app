import { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
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

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL_FADE = { opacity: 0 };
const EASE_ANIMATE_FADE = { opacity: 1 };
const EASE_HEADER_TRANSITION = { type: 'timing' as const, duration: 900, delay: 400, easing: EASING };
const EASE_INITIAL_SLIDE = { opacity: 0, translateY: 20 };
const EASE_ANIMATE_SLIDE = { opacity: 1, translateY: 0 };
const EASE_CTA_TRANSITION = {
  opacity: { type: 'timing' as const, duration: 400, delay: 1000, easing: EASING },
  transform: { type: 'spring' as const, damping: 28, stiffness: 120, mass: 1, delay: 1000 },
};
const getCtaStyle = ({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.65 : 1 });

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

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const headerStyle = { paddingTop: insets.top + 28, paddingHorizontal: 32, zIndex: 10 };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const bottomBarStyle = { position: 'absolute' as const, bottom: 0, left: 0, right: 0, paddingHorizontal: 36, paddingBottom: insets.bottom + 28, alignItems: 'center' as const, gap: 20, zIndex: 10 };

  return (
    <View className="flex-1 bg-background">
      <DuskDriftBackdrop />

      <PreviewCarousel slides={FRAME_STEPS} />

      <EaseView
        initialAnimate={EASE_INITIAL_FADE}
        animate={EASE_ANIMATE_FADE}
        transition={EASE_HEADER_TRANSITION}
        style={headerStyle}
      >
        <AppText
          className="text-foreground/85 text-[22px] leading-9"
          style={styles.fontMedium}
        >
          Here&apos;s{'\n'}
          <AppText
            className="text-accent text-[22px] leading-9"
            style={styles.fontMedium}
          >
            what happens.
          </AppText>
        </AppText>
      </EaseView>

      <View style={bottomBarStyle}>
        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_CTA_TRANSITION}
        >
          <Pressable
            onPress={handlePress}
            className="border border-accent/30 rounded-full px-9 py-3.5"
            style={getCtaStyle}
          >
            <AppText
              className="text-accent/80 text-[15px]"
              style={styles.letterSpacing}
            >
              That makes sense
            </AppText>
          </Pressable>
        </EaseView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fontMedium: { fontFamily: 'Poppins-Medium' },
  letterSpacing: { letterSpacing: 0.5 },
});
