import React, { memo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import {
  Easing,
  SharedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { MoodCard, MoodItem, getCardWidth } from '@/components/onboarding/mood-card';

/** Slow, contemplative scroll — like thoughts drifting */
const AUTO_SCROLL_SPEED = 18;

type Props = {
  moods: MoodItem[];
  scrollOffsetX: SharedValue<number>;
};

const MoodMarqueeComponent = ({ moods, scrollOffsetX }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = getCardWidth(screenWidth);
  const scrollSpeed = useSharedValue(AUTO_SCROLL_SPEED);
  const allItemsWidth = moods.length * cardWidth;

  useFrameCallback((frameInfo) => {
    const dt = (frameInfo?.timeSincePreviousFrame ?? 0) / 1000;
    scrollOffsetX.value += scrollSpeed.value * dt;
  });

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scrollSpeed.value = 0;
    })
    .onChange((e) => {
      scrollOffsetX.value -= e.changeX;
    })
    .onFinalize((e) => {
      scrollSpeed.value = -e.velocityX;
      scrollSpeed.value = withTiming(AUTO_SCROLL_SPEED, {
        duration: 1200,
        easing: Easing.out(Easing.quad),
      });
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ height: '100%', flexDirection: 'row' }}>
        {moods.map((mood, index) => (
          <MoodCard
            key={mood.id}
            item={mood}
            index={index}
            scrollOffsetX={scrollOffsetX}
            allItemsWidth={allItemsWidth}
            cardWidth={cardWidth}
            screenWidth={screenWidth}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

export const MoodMarquee = memo(MoodMarqueeComponent);
