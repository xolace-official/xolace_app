import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { MoodItem } from '@/components/onboarding/mood-card';

type Props = {
  mood: MoodItem;
};

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Full-screen blurred gradient background that shifts with the active mood card.
 * Uses the mood's gradient colors with heavy opacity to create a warm ambient glow.
 */
const MoodBgComponent = ({ mood }: Props) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <AnimatedGradient
        key={mood.id}
        entering={FadeIn.duration(600)}
        exiting={FadeOut.duration(600)}
        colors={[
          mood.colors[0] + '40', // 25% opacity
          mood.colors[1] + '30', // 19% opacity
          mood.colors[2] + '20', // 12% opacity
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Dark warm overlay for depth */}
      <View
        style={StyleSheet.absoluteFill}
        className="bg-neutral-900/60"
      />
    </View>
  );
};

export const MoodBg = memo(MoodBgComponent);
