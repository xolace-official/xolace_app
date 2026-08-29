import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { FounderCard } from "./founder-card";
import { FOUNDER_MARQUEE_CARDS, type FounderMarqueeCard } from "./marquee-data";

// PROTOTYPE — throwaway. Horizontal auto-drift + pan-to-nudge belt. Same mechanic
// as the repo's MoodMarquee (useFrameCallback + per-item modulo positioning).

const AUTO_SPEED = 16; // px/s
const ROTATIONS = [-4, 3, -2, 4, -3, 2, 0, -5];

type Props = {
  cardWidth: number;
  cardHeight: number;
  /** Width of the visible track. */
  viewport: number;
  cards?: FounderMarqueeCard[];
};

export const FounderMarquee = ({
  cardWidth,
  cardHeight,
  viewport,
  cards = FOUNDER_MARQUEE_CARDS,
}: Props) => {
  "use no memo";
  const offset = useSharedValue(0);
  const speed = useSharedValue(AUTO_SPEED);

  const gap = cardWidth * 0.82; // overlap, like biscuit-camera's -ml-4
  const total = cards.length * gap;

  useFrameCallback((frame) => {
    const dt = (frame?.timeSincePreviousFrame ?? 0) / 1000;
    offset.set(offset.get() + speed.get() * dt);
  });

  const pan = Gesture.Pan()
    .onBegin(() => speed.set(0))
    .onChange((e) => offset.set(offset.get() - e.changeX))
    .onFinalize((e) => {
      speed.set(-e.velocityX);
      speed.set(withTiming(AUTO_SPEED, { duration: 1100, easing: Easing.out(Easing.quad) }));
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }}>
        {cards.map((card, index) => (
          <BeltCard
            key={card.id}
            card={card}
            index={index}
            gap={gap}
            total={total}
            viewport={viewport}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            offset={offset}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

type BeltCardProps = {
  card: FounderMarqueeCard;
  index: number;
  gap: number;
  total: number;
  viewport: number;
  cardWidth: number;
  cardHeight: number;
  offset: SharedValue<number>;
};

const BeltCard = ({ card, index, gap, total, viewport, cardWidth, cardHeight, offset }: BeltCardProps) => {
  const initial = index * gap;

  const style = useAnimatedStyle(() => {
    const norm = ((offset.get() % total) + total) % total;
    let pos = (((initial - norm) % total) + total) % total; // [0, total)
    if (pos > viewport) pos -= total; // recycle far cards to the near side → continuous belt
    const scale = interpolate(
      pos,
      [-cardWidth, (viewport - cardWidth) / 2, viewport],
      [0.86, 1, 0.86],
      "clamp",
    );
    return {
      position: "absolute",
      left: pos,
      top: 0,
      opacity: interpolate(pos, [-cardWidth, 0, viewport - cardWidth, viewport], [0.2, 1, 1, 0.2], "clamp"),
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={style}>
      <FounderCard
        card={card}
        width={cardWidth}
        height={cardHeight}
        rotationDeg={ROTATIONS[index % ROTATIONS.length]}
      />
    </Animated.View>
  );
};
