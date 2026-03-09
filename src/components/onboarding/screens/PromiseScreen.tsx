import React, { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedReaction,
  useSharedValue,
  FadeInDown,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/shared/app-text';
import { MoodMarquee } from '@/components/onboarding/mood-marquee';
import { MoodBg } from '@/components/onboarding/mood-bg';
import { getCardWidth } from '@/components/onboarding/mood-card';
import { useDebounce } from '@/hooks/use-debounce';
import { MOODS } from '@/constants/moods';

export const PromiseScreen = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedIndex = useDebounce(activeIndex, 400);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollOffsetX = useSharedValue(0);
  const cardWidth = getCardWidth(width);
  const allItemsWidth = MOODS.length * cardWidth;

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
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: navigate to next onboarding screen
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
            className="text-white/50 text-[15px] leading-7"
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
