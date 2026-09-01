import { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useEffectiveReducedMotion } from '@/src/lib/motion/use-effective-reduced-motion';

import { FounderCard } from './founder-card';
import { FOUNDER_MARQUEE_CARDS } from './marquee-data';

// Horizontal auto-drift belt with pan-to-nudge — the same mechanic as the
// onboarding MoodMarquee (useFrameCallback + per-item modulo positioning), but
// the cards are Skia-clipped silhouettes rather than plain rounded rects. The
// two belts are deliberately not shared: MoodMarquee centres its track and hands
// its offset up for background parallax, which this band has no use for.
//
// Motion budget: drift is the whole point of the band, so reduced motion stops
// the drift rather than the screen — the belt still pans by hand.

const AUTO_SPEED = 16; // px/s
const CARD_WIDTH = 150;
const CARD_HEIGHT = 200;
const CARD_STRIDE = CARD_WIDTH * 0.82; // deliberate overlap, so the band reads as a stack
const BELT_WIDTH = FOUNDER_MARQUEE_CARDS.length * CARD_STRIDE;
const ROTATIONS = [-4, 3, -2, 4, -3];

type Props = {
  /** Width of the visible track. */
  viewport: number;
};

const FounderMarqueeComponent = ({ viewport }: Props) => {
  'use no memo';
  const reducedMotion = useEffectiveReducedMotion();
  const restSpeed = reducedMotion ? 0 : AUTO_SPEED;
  const offset = useSharedValue(0);
  const speed = useSharedValue(restSpeed);

  useFrameCallback((frame) => {
    const dt = (frame?.timeSincePreviousFrame ?? 0) / 1000;
    offset.set(offset.get() + speed.get() * dt);
  });

  const pan = Gesture.Pan()
    .onBegin(() => speed.set(0))
    .onChange((e) => offset.set(offset.get() - e.changeX))
    .onFinalize((e) => {
      speed.set(-e.velocityX);
      speed.set(withTiming(restSpeed, { duration: 1100, easing: Easing.out(Easing.quad) }));
    });

  return (
    <GestureDetector gesture={pan}>
      <View className="flex-1">
        {FOUNDER_MARQUEE_CARDS.map((card, index) => (
          <BeltCard key={card.id} index={index} viewport={viewport} offset={offset} />
        ))}
      </View>
    </GestureDetector>
  );
};

export const FounderMarquee = memo(FounderMarqueeComponent);

type BeltCardProps = {
  index: number;
  viewport: number;
  offset: SharedValue<number>;
};

const BeltCard = ({ index, viewport, offset }: BeltCardProps) => {
  const card = FOUNDER_MARQUEE_CARDS[index];
  const restingLeft = index * CARD_STRIDE;

  const style = useAnimatedStyle(() => {
    const drift = ((offset.get() % BELT_WIDTH) + BELT_WIDTH) % BELT_WIDTH;
    let left = (((restingLeft - drift) % BELT_WIDTH) + BELT_WIDTH) % BELT_WIDTH; // [0, BELT_WIDTH)
    if (left > viewport) left -= BELT_WIDTH; // recycle far cards to the near side → continuous belt
    return {
      position: 'absolute' as const,
      left,
      top: 0,
      opacity: interpolate(
        left,
        [-CARD_WIDTH, 0, viewport - CARD_WIDTH, viewport],
        [0.2, 1, 1, 0.2],
        'clamp'
      ),
      transform: [
        {
          scale: interpolate(
            left,
            [-CARD_WIDTH, (viewport - CARD_WIDTH) / 2, viewport],
            [0.86, 1, 0.86],
            'clamp'
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={style}>
      <FounderCard
        card={card}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rotationDeg={ROTATIONS[index % ROTATIONS.length]}
      />
    </Animated.View>
  );
};
