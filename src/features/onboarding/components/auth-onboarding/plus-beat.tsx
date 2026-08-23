/**
 * The Xolace+ beat — the deck's fifth bespoke composition, and the only one
 * with a job outside the story: it has to sell, in a product that deliberately
 * refuses to put a paywall in front of anything.
 *
 *     ◇ XOLACE+
 *     the line
 *     the aside
 *
 *     ┌───────────────────────────────┐
 *     │ ▁▃▂▅▃▂▄▁▃▅▂▃▄▂ │ ▄▂▅▃▂▄▃▅    │  ← the gate, drawn
 *     │  kept by Xolace+  30 days free │
 *     └───────────────────────────────┘
 *     ◈ mirror voice  ◈ patterns  ◈ themes
 *     YEARLY STARTS WITH 7 DAYS FREE
 *
 * WHY A DEMONSTRATION AND NOT A PITCH. No hard paywall means the user will
 * never be stopped and told what they are missing — so the only honest place
 * to show the shape of the offer is here, once, before they have anything to
 * lose. `EmberLedger` does that literally: the free window lit, the past dark,
 * then the past relighting. Nobody has to be told what was lost; they watched
 * it come back.
 *
 * WHY THE FREE SIDE IS NAMED FIRST. "Your last 30 days stay free, always"
 * leads because the fear this slide actually has to clear is not price, it is
 * "is this whole thing a trial". Answer that in the aside and the ledger reads
 * as an offer instead of a threat.
 *
 * WHY NO FIGURE. Mirror, Vent and Xolacers all put the character on the axis;
 * this beat is the only one about the product rather than a night, and adding
 * the mascot would make the pitch look like another scene of the story. The
 * artifact is the subject. The sky is already at full dawn here (`SkyArc`) —
 * that is this beat's warmth, and it does not need a second source.
 */
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import type { StoryBeat } from '@/src/features/onboarding/story-beats';
import { useDeckColor } from './deck-color';
import { EmberLedger } from './ember-ledger';

/**
 * What Plus adds beyond the history the ledger already shows. Three chips, not
 * a feature list: the paywall itself carries all seven. Each one names a thing
 * the user can picture, never a category ("personalization", "insights").
 */
const EXTRAS = [
  { id: 'voice', label: 'Mirror voice', symbol: { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' } },
  { id: 'patterns', label: 'Word patterns', symbol: { ios: 'chart.xyaxis.line', android: 'insights', web: 'insights' } },
  { id: 'themes', label: 'Themes & avatars', symbol: { ios: 'paintpalette', android: 'palette', web: 'palette' } },
] as const;

/** Matches the cover, Mirror, Vent and Xolacers so all five share a cadence. */
const STEP = 95;
const DUR = 520;

export const PlusBeat = ({ beat }: { beat: StoryBeat }) => {
  const ember = useDeckColor('ember');
  const reduced = useReducedMotion();

  const enter = (index: number) =>
    reduced ? undefined : FadeInDown.delay(index * STEP).duration(DUR);

  return (
    <View className="flex-1 justify-center px-9 pb-10">
      <Animated.View entering={enter(0)} className="flex-row items-center gap-2.5 mb-6">
        <SymbolView name={beat.symbol} size={15} tintColor={ember} type="hierarchical" />
        <AppText className="text-ember/75 text-[10.5px] uppercase" style={{ letterSpacing: 2.2 }}>
          {beat.label}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <AppText
          className="text-foreground/95 text-[32px] leading-[45px]"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {beat.beat}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <AppText className="text-foreground/42 text-[14px] leading-6 mt-5 pr-4">
          {beat.aside}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(3)} className="mt-7">
        <EmberLedger />
      </Animated.View>

      <Animated.View entering={enter(4)} className="flex-row flex-wrap gap-2 mt-4">
        {EXTRAS.map((extra) => (
          <View
            key={extra.id}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{ borderColor: `${ember}2e` }}
          >
            <SymbolView name={extra.symbol} size={12} tintColor={ember} type="hierarchical" />
            <AppText className="text-foreground/70 text-[11.5px]">{extra.label}</AppText>
          </View>
        ))}
      </Animated.View>

      {beat.tag ? (
        <Animated.View entering={enter(5)}>
          <AppText
            className="text-ember/75 text-[10.5px] uppercase mt-5"
            style={{ letterSpacing: 2 }}
          >
            {beat.tag}
          </AppText>
        </Animated.View>
      ) : null}
    </View>
  );
};
