import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedReaction,
  useSharedValue,
  FadeInDown,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/shared/app-text';
import { playGentlePresence, playOnboardingEntrance } from '@/src/lib/haptics';
import { MoodMarquee } from '@/src/features/onboarding/components/mood-marquee';
import { MoodBg } from '@/src/features/onboarding/components/mood-bg';
import { getCardWidth } from '@/src/features/onboarding/components/mood-card';
import { useDebounce } from '@/src/hooks/use-debounce';
import { MOODS } from '@/src/features/onboarding/moods';

export const PromiseScreen = () => {
  const hasPlayedEntrance = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedIndex = useDebounce(activeIndex, 400);
  const router = useRouter();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollOffsetX = useSharedValue(0);
  const cardWidth = getCardWidth(width);
  const allItemsWidth = MOODS.length * cardWidth;

  useEffect(() => {
    if (!hasPlayedEntrance.current) {
      hasPlayedEntrance.current = true;
      playOnboardingEntrance();
    }
  }, []);

  useAnimatedReaction(
    () => scrollOffsetX.value,
    (current) => {
      const normalized = ((current % allItemsWidth) + allItemsWidth) % allItemsWidth;
      const shift = width / 2;
      const idx = Math.abs(Math.floor((normalized + shift) / cardWidth));

      if (idx === MOODS.length) {
        scheduleOnRN(setActiveIndex, 0);
      } else if (idx >= 0 && idx < MOODS.length) {
        scheduleOnRN(setActiveIndex, idx);
      }
    }
  );

  const handlePress = () => {
    playGentlePresence();
    router.push('/frame');
  };

  return (
    <View
      className="flex-1 bg-neutral-950"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* Ambient gradient background that shifts with active mood */}
      <MoodBg mood={MOODS[debouncedIndex]} />

      {/* Marquee — top portion */}
      <View style={{ flex: 5, paddingTop: insets.top + 40 }}>
        <MoodMarquee moods={MOODS} scrollOffsetX={scrollOffsetX} />
      </View>

      {/* Promise content — bottom portion */}
      <View style={{ flex: 4, justifyContent: 'space-between', paddingHorizontal: 32 }}>
        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify().damping(20)}
          style={{ gap: 20, paddingTop: 32 }}
        >
          <AppText
            className="text-white/90 text-[22px] leading-9"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            This is a space{'\n'}to be honest.
          </AppText>
          <AppText
            className="text-white/50 text-[15px] leading-7 mb-2"
            style={{ fontWeight: '300' }}
          >
            What you share here is private.{'\n'}
            No one sees it. No one judges it.{'\n'}
            It&apos;s yours.
          </AppText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(800).springify().damping(20)}
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
              I&apos;d like that
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};
