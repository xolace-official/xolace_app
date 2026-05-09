import { StyleSheet, View } from 'react-native';
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
  withTiming,
} from 'react-native-reanimated';
import { useThemeColor } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';

const PATHS = [
  { title: 'Sit with this',        detail: 'A quiet space to breathe' },
  { title: "You're not alone",     detail: 'See what others have shared' },
  { title: 'I just needed to say it', detail: 'Return to the beginning' },
];

// Timeline (ms)
const DWELL   = 900;   // how long each hover lingers
const SETTLE  = 2000;  // how long the chosen option holds
const FADE_MS = 350;
const PAUSE   = 300;
const CYCLE   = DWELL * 3 + SETTLE + FADE_MS + PAUSE; // ~6150ms

const pct = (ms: number) => ms / CYCLE;

const T = {
  h0On:    pct(50),
  h0Off:   pct(50 + DWELL),
  h1On:    pct(50 + DWELL + 80),
  h1Off:   pct(50 + DWELL * 2 + 80),
  h2On:    pct(50 + DWELL * 2 + 160),
  settle:  pct(50 + DWELL * 3 + 160),
  fadeOut: pct(50 + DWELL * 3 + 160 + SETTLE),
};

type PathOptionProps = {
  title: string;
  detail: string;
  highlight: SharedValue<number>;
  settled: SharedValue<number>;
  accent: string;
};

const PathOption = ({ title, detail, highlight, settled, accent }: PathOptionProps) => {
  const rRow = useAnimatedStyle(() => ({
    opacity: interpolate(highlight.value, [0, 1], [0.38, 1], Extrapolation.CLAMP),
  }));

  // Accent bar on the left — scales in when highlighted, brightens when settled
  const rBar = useAnimatedStyle(() => {
    const h = highlight.value;
    const s = settled.value;
    return {
      width: interpolate(h, [0, 1], [0, 2.5], Extrapolation.CLAMP),
      opacity: interpolate(s, [0, 1], [0.5, 1], Extrapolation.CLAMP),
      backgroundColor: accent,
    };
  });

  // Subtle accent bg behind the row when settled
  const rBg = useAnimatedStyle(() => ({
    opacity: interpolate(settled.value, [0, 1], [0, 0.07], Extrapolation.CLAMP),
    backgroundColor: accent,
  }));

  return (
    <Animated.View style={[styles.row, rRow]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.rowBg, rBg]} />
      <Animated.View style={[styles.bar, rBar]} />
      <View style={styles.text}>
        <AppText className="text-foreground text-[11px]">{title}</AppText>
        <AppText className="text-foreground/30 text-[9px] mt-0.5">{detail}</AppText>
      </View>
    </Animated.View>
  );
};

type Props = { isActive: SharedValue<boolean> };

export const PathsPreview = ({ isActive }: Props) => {
  const accent = useThemeColor('accent');
  const progress = useSharedValue(0);

  const h0 = useSharedValue(0);
  const h1 = useSharedValue(0);
  const h2 = useSharedValue(0);
  const s0 = useSharedValue(0); // always 0 — never animated
  const s1 = useSharedValue(0); // always 0 — never animated
  const settled = useSharedValue(0); // option 2 only

  const fade = (sv: SharedValue<number>, to: number, ms = 180) => {
    'worklet';
    sv.value = withTiming(to, { duration: ms, easing: Easing.inOut(Easing.quad) });
  };

  useAnimatedReaction(
    () => isActive.value,
    (active, prev) => {
      if (active && !prev) {
        h0.value = 0; h1.value = 0; h2.value = 0; settled.value = 0; s0.value = 0; s1.value = 0;
        progress.value = 0;
        progress.value = withRepeat(
          withTiming(1, { duration: CYCLE, easing: Easing.linear }),
          -1,
          false,
        );
      } else if (!active) {
        cancelAnimation(progress);
        h0.value = 0; h1.value = 0; h2.value = 0; settled.value = 0; s0.value = 0; s1.value = 0;
        progress.value = 0;
      }
    },
  );

  useAnimatedReaction(
    () => progress.value,
    (p, prev) => {
      if (prev !== null && p < prev) return; // loop reset

      if (prev !== null && prev < T.h0On    && p >= T.h0On)    fade(h0, 1);
      if (prev !== null && prev < T.h0Off   && p >= T.h0Off)   fade(h0, 0, 150);
      if (prev !== null && prev < T.h1On    && p >= T.h1On)    fade(h1, 1);
      if (prev !== null && prev < T.h1Off   && p >= T.h1Off)   fade(h1, 0, 150);
      if (prev !== null && prev < T.h2On    && p >= T.h2On)    fade(h2, 1);
      if (prev !== null && prev < T.settle  && p >= T.settle)  fade(settled, 1, 400);
      if (prev !== null && prev < T.fadeOut && p >= T.fadeOut) {
        fade(h2, 0, FADE_MS);
        fade(settled, 0, FADE_MS);
      }
    },
  );

  return (
    <View className="flex-1 px-4 py-5 justify-center gap-1">
      <View className="gap-1 mb-3">
        <AppText className="text-foreground text-[11px]">
          Where would you like to go?
        </AppText>
        <AppText className="text-foreground/30 text-[9px]">
          Take a moment — there&apos;s no rush.
        </AppText>
      </View>

      <PathOption title={PATHS[0].title} detail={PATHS[0].detail} highlight={h0} settled={s0} accent={accent} />
      <PathOption title={PATHS[1].title} detail={PATHS[1].detail} highlight={h1} settled={s1} accent={accent} />
      <PathOption title={PATHS[2].title} detail={PATHS[2].detail} highlight={h2} settled={settled} accent={accent} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  rowBg: { borderRadius: 8 },
  bar: { height: 28, borderRadius: 2 },
  text: { flex: 1 },
});
