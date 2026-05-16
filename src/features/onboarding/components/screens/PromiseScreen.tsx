import { useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/shared/app-text';
import { playGentlePresence, playOnboardingEntrance } from '@/src/lib/haptics';
import { MoodMarquee } from '@/src/features/onboarding/components/mood-marquee';
import { DuskDriftBackdrop } from '@/src/features/onboarding/components/dusk-drift-backdrop';
import { MOODS } from '@/src/features/onboarding/moods';

export const PromiseScreen = () => {
  const hasPlayedEntrance = useRef(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollOffsetX = useSharedValue(0);

  useEffect(() => {
    if (!hasPlayedEntrance.current) {
      hasPlayedEntrance.current = true;
      playOnboardingEntrance();
    }
  }, []);

  const handlePress = () => {
    playGentlePresence();
    router.push('/frame');
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: insets.bottom }}
    >
      <DuskDriftBackdrop />

      {/* Marquee — top portion */}
      <View style={{ flex: 5, paddingTop: insets.top + 40 }}>
        <MoodMarquee moods={MOODS} scrollOffsetX={scrollOffsetX} />
      </View>

      {/* Promise content — bottom portion */}
      <View style={{ flex: 4, justifyContent: 'space-between', paddingHorizontal: 32 }}>
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            opacity: { type: 'timing', duration: 400, delay: 300, easing: [0.455, 0.03, 0.515, 0.955] },
            transform: { type: 'spring', damping: 20, stiffness: 120, mass: 1, delay: 300 },
          }}
          style={{ gap: 20, paddingTop: 32 }}
        >
          <AppText
            className="text-foreground/90 text-[22px] leading-9"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            This is a space{'\n'}to be honest.
          </AppText>
          <AppText
            className="text-foreground/50 text-[15px] leading-7 mb-2"
            style={{ fontWeight: '300' }}
          >
            What you share here is private.{'\n'}
            No one sees it. No one judges it.{'\n'}
            It&apos;s yours.
          </AppText>
        </EaseView>

        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            opacity: { type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] },
            transform: { type: 'spring', damping: 20, stiffness: 120, mass: 1, delay: 600 },
          }}
          style={{ paddingBottom: 24 }}
        >
          <Pressable
            onPress={handlePress}
            className="border border-accent/30 rounded-full"
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingVertical: 14,
              paddingHorizontal: 32,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText
              className="text-accent/80 text-[15px]"
              style={{ letterSpacing: 0.5 }}
            >
              I&apos;d like that
            </AppText>
          </Pressable>
        </EaseView>
      </View>
    </View>
  );
};
