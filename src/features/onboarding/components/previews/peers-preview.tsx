import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

const CYCLE = 5200;
const CARD_START_Y = 90;
const SPRING = { damping: 20, stiffness: 180, mass: 0.9 };

const T = {
  card1In: 0.015,
  tap1: 0.2,
  card2In: 0.32,
  tap2: 0.52,
  slideOut: 0.7,
};

const PRESS_SEQ = [
  withTiming(0.5, { duration: 100 }),
  withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
] as const;

const ResonatedBadge = ({
  press,
  accent,
}: {
  press: SharedValue<number>;
  accent: string;
}) => {
  const rStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          press.value,
          [0, 0.5, 1],
          [1, 0.86, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      press.value,
      [0, 0.2, 0.5, 1],
      [1, 0.6, 1, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const badgeStyle = [
    styles.badge,
    { borderColor: accent + "4D", backgroundColor: accent + "1A" },
    rStyle,
  ];

  const badgeTextStyle = [styles.badgeText, { color: accent }];

  return (
    <Animated.View style={badgeStyle}>
      <AppText style={badgeTextStyle}>♥ 12 resonated</AppText>
    </Animated.View>
  );
};

const ResonanceTapButton = ({
  press,
  accent,
}: {
  press: SharedValue<number>;
  accent: string;
}) => {
  const rContainer = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          press.value,
          [0, 0.5, 1],
          [1, 0.86, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const rUnselected = useAnimatedStyle(() => ({
    opacity: interpolate(
      press.value,
      [0, 0.4, 0.55, 1],
      [1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const rSelected = useAnimatedStyle(() => ({
    opacity: interpolate(
      press.value,
      [0, 0.4, 0.55, 1],
      [0, 0, 1, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const selectedBadgeStyle = [
    styles.badge,
    styles.badgeSelected,
    { borderColor: accent + "4D", backgroundColor: accent + "1A" },
    rSelected,
  ];

  const tapContainerStyle = [styles.tapContainer, rContainer];
  const unselectedBadgeStyle = [styles.badge, styles.badgeUnselected, rUnselected];
  const selectedTextStyle = [styles.badgeText, { color: accent }];

  return (
    <Animated.View style={tapContainerStyle}>
      <Animated.View style={unselectedBadgeStyle}>
        <AppText className="text-foreground" style={styles.badgeUnselectedText}>
          ♡ This resonates
        </AppText>
      </Animated.View>
      <Animated.View style={selectedBadgeStyle}>
        <AppText style={selectedTextStyle}>♥ resonated</AppText>
      </Animated.View>
    </Animated.View>
  );
};

type Props = { isActive: SharedValue<boolean> };

export const PeersPreview = ({ isActive }: Props) => {
  const accent = useThemeColor("accent");

  const card1Y = useSharedValue(CARD_START_Y);
  const card2Y = useSharedValue(CARD_START_Y);
  const press1 = useSharedValue(0);
  const press2 = useSharedValue(0);
  const progress = useSharedValue(0);

  useAnimatedReaction(
    () => isActive.value,
    (active, prev) => {
      if (active && !prev) {
        card1Y.value = CARD_START_Y;
        card2Y.value = CARD_START_Y;
        press1.value = 0;
        press2.value = 0;
        progress.value = 0;
        progress.value = withRepeat(
          withTiming(1, { duration: CYCLE, easing: Easing.linear }),
          -1,
          false,
        );
      } else if (!active) {
        cancelAnimation(progress);
        cancelAnimation(card1Y);
        cancelAnimation(card2Y);
        card1Y.value = CARD_START_Y;
        card2Y.value = CARD_START_Y;
        press1.value = 0;
        press2.value = 0;
        progress.value = 0;
      }
    },
  );

  useAnimatedReaction(
    () => progress.value,
    (p, prev) => {
      if (prev !== null && p < prev) return;

      if (prev !== null && prev < T.card1In && p >= T.card1In) {
        card1Y.value = withSpring(0, SPRING);
      }
      if (prev !== null && prev < T.tap1 && p >= T.tap1) {
        press1.value = 0;
        press1.value = withSequence(...PRESS_SEQ);
      }
      if (prev !== null && prev < T.card2In && p >= T.card2In) {
        card2Y.value = CARD_START_Y;
        card2Y.value = withSpring(0, SPRING);
      }
      if (prev !== null && prev < T.tap2 && p >= T.tap2) {
        press2.value = 0;
        press2.value = withSequence(...PRESS_SEQ);
      }
      if (prev !== null && prev < T.slideOut && p >= T.slideOut) {
        const out = { duration: 300, easing: Easing.in(Easing.cubic) };
        press2.value = 0;
        card1Y.value = withTiming(CARD_START_Y, out);
        card2Y.value = withTiming(CARD_START_Y, out);
      }
    },
  );

  const rCard1 = useAnimatedStyle(() => ({
    transform: [{ translateY: card1Y.value }],
  }));
  const rCard2 = useAnimatedStyle(() => ({
    transform: [{ translateY: card2Y.value }],
  }));

  return (
    <View className="flex-1 px-3.5 py-5 justify-center gap-2.5 overflow-hidden">
      <AppText className="text-foreground/45 text-[9px] mb-1">
        Others have felt this too
      </AppText>

      <Animated.View
        className="bg-overlay border border-foreground/10 rounded-2xl px-3 py-3 gap-2"
        style={rCard1}
      >
        <AppText className="text-foreground italic text-[10px] leading-3.75">
          I keep waiting for the day to start, but I&apos;m already in it.
        </AppText>
        <View style={styles.badgeRow}>
          <ResonatedBadge press={press1} accent={accent} />
        </View>
      </Animated.View>

      <Animated.View
        className="bg-overlay border border-foreground/10 rounded-2xl px-3 py-3 gap-2"
        style={rCard2}
      >
        <AppText className="text-foreground italic text-[10px] leading-3.75">
          Tired before anything happened. Bracing for nothing in particular.
        </AppText>
        <View style={styles.badgeRow}>
          <ResonanceTapButton press={press2} accent={accent} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeRow: { alignSelf: "flex-end" },
  tapContainer: { position: "relative" },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeUnselected: { opacity: 0.35 },
  badgeSelected: { position: "absolute", top: 0, right: 0 },
  badgeText: { fontSize: 8 },
  badgeUnselectedText: { fontSize: 8 },
});
