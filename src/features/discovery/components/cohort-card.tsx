import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from 'convex/react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { useEffectiveReducedMotion } from '@/src/lib/motion/use-effective-reduced-motion';
import { FluxStage, MOUTH_Y } from './flux-stage';

const FLUX_W = 53;
const FLUX_H = 104;
/** Drops his feet below the bubble's baseline so he stands, not floats. */
const FLUX_TOP = 8;
const TAIL = 12;

const WORD_MS = 62;
/** Held after a comma or full stop. Without it, 62ms/word reads as a ticker. */
const BREATH_MS = 200;
/** Lead-in before he starts talking, and the pause between the two beats. */
const OPENING_MS = 260;
const BEAT_MS = 620;

const styles = StyleSheet.create({
  bubble: { borderCurve: 'continuous' },
  // The tail is the bubble's own corner, rotated 45° and tucked behind its left
  // edge — so it inherits the fill and border without a second color. Its top
  // is his mouth, which sits lower than instinct says: his head is most of him.
  tail: {
    position: 'absolute',
    left: -5,
    top: FLUX_TOP + FLUX_H * MOUTH_Y - TAIL / 2,
    width: TAIL,
    height: TAIL,
    transform: [{ rotate: '45deg' }],
  },
  flux: { marginTop: FLUX_TOP },
});

/* ---------------------------------------------------------------- helpers */

/** Cumulative start time per word, with a beat held at punctuation. */
function wordOffsets(words: string[]) {
  let t = 0;
  return words.map((w) => {
    const at = t;
    t += WORD_MS + (/[,.]$/.test(w) ? BREATH_MS : 0);
    return at;
  });
}

const spokenMs = (text: string) => {
  const o = wordOffsets(text.split(' '));
  return o[o.length - 1] + WORD_MS;
};

/** Reveals a sentence word by word — Flux is speaking it, not printing it. */
function useSpokenWords(text: string, delay: number, reduced: boolean) {
  const words = text.split(' ');
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timers = wordOffsets(words).map((at, i) =>
      setTimeout(() => setShown(i + 1), delay + at),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, reduced]);

  return { words, shown: reduced ? words.length : shown };
}

/** The count ticks up as he says it, so the number feels arrived-at. */
function useCountUp(target: number, delay: number, reduced: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timers = Array.from({ length: target }, (_, i) =>
      setTimeout(() => setN(i + 1), delay + i * 55),
    );
    return () => timers.forEach(clearTimeout);
  }, [target, delay, reduced]);
  return reduced ? target : n;
}

/** Bubbles arrive from the tail, not by fading in place. */
function useBubbleIn(delay: number, reduced: boolean) {
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      p.set(1);
      return;
    }
    p.set(withDelay(delay, withSpring(1, { damping: 14, stiffness: 160 })));
  }, [delay, reduced, p]);

  return useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scale: 0.9 + p.get() * 0.1 }, { translateX: (1 - p.get()) * -10 }],
  }));
}

/* ------------------------------------------------------------------- card */

/**
 * Once a week, a real number of other campers who carried what the viewer last
 * carried. Flux says it — this is the app speaking to you, not a stat readout —
 * which is why it's a speech bubble and not a metric tile.
 *
 * He delivers it in two beats: the fact, then a pause, then "You are not
 * alone." The pause is the whole point; said in one breath it's a statistic.
 *
 * Deliberately inert: no onPress, no destination. It's a moment of "you are not
 * alone," not an entry point to a feed that doesn't exist.
 *
 * Renders nothing until there's something honest to say (see convex/cohort.ts).
 */
export function CohortCard() {
  const card = useQuery(api.cohort.getWeeklyCohortCard);
  const reduced = useEffectiveReducedMotion();

  const isCount = card?.status === 'count';
  const fact =
    !card || card.status === 'hidden'
      ? ''
      : card.status === 'count'
        ? `campers sat with ${card.emotion} by the fire this week.`
        : `Others have sat with ${card.emotion} by this fire too.`;
  const closer = 'You are not alone.';

  const secondDelay = OPENING_MS + spokenMs(fact) + BEAT_MS;
  const bubble1 = useBubbleIn(0, reduced);
  const bubble2 = useBubbleIn(secondDelay, reduced);
  const { words, shown } = useSpokenWords(fact, OPENING_MS, reduced);
  const n = useCountUp(card?.status === 'count' ? card.count : 0, OPENING_MS - 60, reduced);

  if (!card || card.status === 'hidden') return null;

  return (
    <View
      className="flex-row gap-1"
      accessibilityRole="text"
      accessibilityLabel={`${isCount ? `${card.count} ` : ''}${fact} ${closer}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.flux}>
        <FluxStage w={FLUX_W} h={FLUX_H} reduced={reduced} />
      </View>

      <View className="flex-1 gap-2">
        <Animated.View style={bubble1}>
          <View className="rounded-3xl border border-border/60 bg-surface" style={styles.bubble}>
            <View className="border-b border-l border-border/60 bg-surface" style={styles.tail} />
            <AppText className="px-4 py-4 text-[15px] leading-6 text-foreground">
              {isCount && <AppText className="font-semibold text-ember">{n} </AppText>}
              {words.slice(0, shown).join(' ')}
            </AppText>
          </View>
        </Animated.View>

        {/* No tail on the closer — one from here would cross the bubble above.
         * It reads as an aside, which is what the pause set it up to be. */}
        <Animated.View style={bubble2} className="self-start">
          <View
            className="rounded-3xl border border-border/60 bg-surface px-4 py-2.5"
            style={styles.bubble}
          >
            <AppText className="text-[14px] leading-5 text-muted">{closer}</AppText>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
