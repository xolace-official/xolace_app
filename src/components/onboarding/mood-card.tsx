import React, { memo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/shared/app-text';

const CARD_WIDTH_RATIO = 0.55;

export function getCardWidth(screenWidth: number) {
  return screenWidth * CARD_WIDTH_RATIO;
}

export interface MoodItem {
  id: number;
  word: string;
  colors: [string, string, string];
}

type Props = {
  item: MoodItem;
  index: number;
  scrollOffsetX: SharedValue<number>;
  allItemsWidth: number;
  cardWidth: number;
  screenWidth: number;
};

const MoodCardComponent = ({
  item,
  index,
  scrollOffsetX,
  allItemsWidth,
  cardWidth,
  screenWidth,
}: Props) => {
  const shift = (allItemsWidth - screenWidth) / 2;
  const initialLeft = index * cardWidth - shift;

  const animatedStyle = useAnimatedStyle(() => {
    const normalizedOffset =
      ((scrollOffsetX.value % allItemsWidth) + allItemsWidth) % allItemsWidth;
    const left = ((initialLeft - normalizedOffset) % allItemsWidth) + shift;

    const rotation = interpolate(
      left,
      [0, screenWidth - cardWidth],
      [-0.4, 0.4]
    );
    const translateY = interpolate(
      left,
      [0, (screenWidth - cardWidth) / 2, screenWidth - cardWidth],
      [2, -1, 2]
    );
    const scale = interpolate(
      left,
      [0, (screenWidth - cardWidth) / 2, screenWidth - cardWidth],
      [0.95, 1, 0.95]
    );
    const opacity = interpolate(
      left,
      [-cardWidth, 0, (screenWidth - cardWidth) / 2, screenWidth - cardWidth, screenWidth],
      [0.3, 0.7, 1, 0.7, 0.3]
    );

    return {
      left,
      opacity,
      transform: [
        { rotateZ: `${rotation}deg` },
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          height: '100%',
          width: cardWidth,
          padding: 6,
          transformOrigin: 'bottom',
        },
      ]}
    >
      <View
        style={{ flex: 1, borderRadius: 24, overflow: 'hidden', borderCurve: 'continuous' }}
      >
        <LinearGradient
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', padding: 24 }}
        >
          <AppText
            className="text-white/70 text-lg font-medium"
            style={{ letterSpacing: 1 }}
          >
            {item.word}
          </AppText>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export const MoodCard = memo(MoodCardComponent);
