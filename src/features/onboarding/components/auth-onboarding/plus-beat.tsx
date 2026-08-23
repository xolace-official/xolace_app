/**
 * The Xolace+ beat — the deck's fifth bespoke composition, and the only one
 * with a job outside the story: it has to sell, in a product that deliberately
 * refuses to put a paywall in front of anything.
 *
 *     ◇ XOLACE+
 *     the line
 *     the aside
 *
 *        ·  ●   ·        ●              ← dots, then the line through them
 *     ●        ●     ●        ·   ●
 *
 *     ALSO WITH PLUS
 *     ◈ full history  ◈ themes & avatars  ◈ more drafts
 *
 *     Saying it stays free. …
 *
 * IT SELLS ONE IDEA, NOT A FEATURE LIST. Everything Plus contains beyond the
 * insight — themes, avatars, the longer history, the extra drafts — is an
 * add-on, and add-ons live in pills where they belong: visible, checkable,
 * and clearly not the argument. The argument is the single thing a person
 * cannot do for themselves, which is see their own pattern from inside it.
 *
 * WHY THE HEADLINE IS ABOUT THEM AND NOT ABOUT US. "You can't see your own
 * pattern from inside it" is a fact about being a person, true before Xolace
 * existed and true for a reader who never pays. Leading with what Plus *has*
 * asks a stranger to want a feature; leading with what they cannot do makes
 * the feature the answer to a question they already recognise. Nothing on
 * this slide says "unlock", "upgrade" or "premium".
 *
 * THE CLOSING PROMISE IS THE POSITIONING, NOT A DISCLAIMER. No hard paywall
 * is a real product decision and it is worth more than any feature bullet, so
 * it gets the last word and it gets the REASON attached: saying the thing is
 * always free, because a person who needs to get something out should never
 * meet a wall — and what money buys is only the looking back. That sentence
 * is also the honest boundary of what is gated (insights), which is why it can
 * be made at all. Verified against the shipped gates: the Mirror and Vent are
 * free, one bridge draft a day is free, the insight teasers are what's locked.
 *
 * WHY NO FIGURE. Mirror, Vent and Xolacers all put the character on the axis;
 * this beat is the only one about the product rather than a moment, and adding
 * the mascot would make the pitch look like another scene of the story.
 */
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import type { StoryBeat } from '@/src/features/onboarding/story-beats';
import { useDeckColor } from './deck-color';
import { PatternLine } from './pattern-line';

/**
 * The add-ons. Deliberately three short nouns and no verbs: a pill that
 * explains itself starts competing with the headline, and these are meant to
 * be scanned and believed, not read. Each is a gate that actually exists
 * today — no daily-limit pill until that one is built.
 */
const EXTRAS = [
  { id: 'history', label: 'Full history', symbol: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' } },
  { id: 'look', label: 'Themes & avatars', symbol: { ios: 'paintpalette', android: 'palette', web: 'palette' } },
  { id: 'drafts', label: 'More drafts a day', symbol: { ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' } },
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
        <AppText className="text-ember/75 text-[10.5px] uppercase tracking-[2.2px]">
          {beat.label}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <AppText className="text-foreground/95 text-[32px] leading-[45px] font-poppins-medium">
          {beat.beat}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <AppText className="text-foreground/42 text-[14px] leading-6 mt-5 pr-4">
          {beat.aside}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(3)} className="mt-4">
        <PatternLine />
      </Animated.View>

      <Animated.View entering={enter(4)} className="mt-2">
        <AppText className="text-foreground/30 text-[9.5px] uppercase mb-2.5 tracking-[1.8px]">
          Also with Plus
        </AppText>
        <View className="flex-row flex-wrap gap-2">
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
        </View>
      </Animated.View>

      {beat.tag ? (
        <Animated.View entering={enter(5)} className="mt-6 flex-row gap-3">
          {/* A rule rather than another uppercase footnote. The other beats'
              tags are asides to the story; this is the product speaking in its
              own voice about how it treats people, and it should not look like
              small print. */}
          <View className="w-[2px] rounded-full" style={{ backgroundColor: `${ember}59` }} />
          <AppText className="flex-1 text-foreground/60 text-[12.5px] leading-5">{beat.tag}</AppText>
        </Animated.View>
      ) : null}
    </View>
  );
};
