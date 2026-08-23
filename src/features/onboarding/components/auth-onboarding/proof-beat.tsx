/**
 * The proof beat — the deck's sixth bespoke composition, and the only one whose
 * subject is other people rather than the reader or the product.
 *
 *     ◇ THIS WEEK
 *     the line
 *
 *        ·     ·       ·        ·      ·        ← one ember per person
 *     ·      ·      ·       ·       ·
 *        ◉                                      ← one of them speaks
 *        │
 *        │  "the review"
 *        │  Ama · here since March
 *
 *     22 embers, lit this week.
 *     Counted from real sessions. Never a number we made up.
 *
 * WHY THE CARD IS GONE. This beat used to hold up a bordered well with a number
 * inside it (`ProofWell`). It was the only card in a cardless deck, and it made
 * the strongest claim in the whole tale — you are not alone — read like a stat
 * badge. The field replaces it with the same fact in a form you can count, and
 * the beat rejoins the deck's grammar: words on the dark, light behind them.
 *
 * THE RULE IS THE ARGUMENT. A vertical hairline rises out of one ember and
 * becomes the quote's left rule. That single line is what makes the review
 * evidence instead of marketing: it is not a testimonial pinned to the slide,
 * it is one of the lights on this screen saying what being here was like. The
 * quote must always hang off the field. Never float it free.
 *
 * WHY ONLY ONE VOICE. Two quotes would be a wall of praise, and a wall of
 * praise is the tonal opposite of a product about not performing. One person,
 * one sentence, and the rest stay quiet lights — which is also what the app
 * actually does with them.
 */
import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import type { StoryBeat } from '@/src/features/onboarding/story-beats';
import { useDeckColor } from './deck-color';
import { EmberField, VOICED } from './ember-field';

/**
 * `count` renders literally as embers, so it inherits Discovery's shipped rule
 * unchanged: real matches only, and below a floor of three there is no number
 * and no crowd to draw. The warm line runs alone in that case.
 *
 * ponytail: hardcoded until the real query lands — do not let the below-floor
 * branch ship as a fabricated field of embers.
 */
// TODO(#200): real weekly cohort count.
const COUNT = 22;

/**
 * A real App Store review, quoted rather than written.
 *
 * WHOLE, AND VERBATIM. Title and body exactly as RosieeeBD wrote them, every
 * sentence, no ellipsis and no tightening. An excerpt is a claim about what
 * someone meant; the whole thing is just what they said, and this beat's only
 * argument is that everything on it is checkable.
 *
 * IT EARNS ITS LENGTH BECAUSE IT IS AN ARC, NOT A COMPLIMENT. Afraid of being
 * laughed at, then not knowing where to start, then finding she didn't need
 * many words. That is the Mirror's entire job described by someone who had
 * never heard us describe it, in the order a stranger reading this slide is
 * living it. Cut to one sentence it becomes a testimonial; kept whole it is
 * the only place in the deck where the product is explained by a user.
 *
 * The layout answers to this, not the reverse — the field above it is sized
 * to whatever is left once the review has the room it needs.
 *
 * THE SOURCE IS NAMED ON PURPOSE. "App Store, May 2026" is checkable, and on a
 * slide whose caption promises we never made a number up, an unattributed
 * quote would undo the sentence next to it.
 */
const REVIEW = {
  title: 'Slowly becoming my comfort app',
  quote:
    'I’ve always hated opening up to someone because I feel like I’d be laughed at or ignored. I also always assume I wouldn’t know where to start from if I’m to open up to someone. Just a few days on Xolace and I’ve realized that I don’t really need a lot of words to express myself.',
  author: 'RosieeeBD',
  source: 'App Store, May 2026',
};

/** Matches every other beat's cadence. */
const STEP = 95;
const DUR = 520;

/** The field's share of the screen. Below ~150 the depth bands collapse into
 *  one texture; above ~240 the quote starts pushing the footer off. */
/**
 * A BAND, NOT A SKY. The field was half the slide when it carried a single
 * quoted sentence; the whole review needs that height more than the scatter
 * does. Squeezed flatter the embers actually read better — they sit closer to
 * a horizon and further from wallpaper — so the review took the space from the
 * one element that improved by giving it up.
 */
const FIELD_MIN = 118;
const FIELD_MAX = 168;
/** Horizontal padding, doubled — px-9 on both sides. */
const GUTTER = 36 * 2;
/** Gap between the last ember and the top of the quote. */
const DROP = 18;

export const ProofBeat = ({ beat }: { beat: StoryBeat }) => {
  const ember = useDeckColor('ember');
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const fieldW = width - GUTTER;
  // Proportional, not fixed: this is the tallest beat in the deck and a short
  // phone has to fit the quote and the caption under it without clipping.
  const fieldH = Math.min(FIELD_MAX, Math.max(FIELD_MIN, height * 0.17));

  // Where the speaking ember actually landed, in points — the rule and the
  // quote both hang off this, so the tether stays registered at every size.
  const voicedX = VOICED.x * fieldW;
  const voicedY = VOICED.y * fieldH;

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

      {/* Field and quote share one positioning context so the rule can start
          inside the field and end inside the quote. Splitting them would mean
          measuring, and this deck does not get to depend on onLayout — it
          mounts all six slides at once. */}
      <View className="mt-6">
        <EmberField count={COUNT} color={ember} width={fieldW} height={fieldH} />

        {/* The rule. Starts at the ember's own centre and runs the whole way
            down the quote, so there is one continuous line from the light to
            the words. Faded at the top by sitting under the halo. */}
        <Animated.View
          entering={reduced ? undefined : FadeInDown.delay(1600).duration(700)}
          pointerEvents="none"
          className="absolute w-px rounded-full bottom-0"
          style={{
            left: voicedX,
            top: voicedY,
            backgroundColor: `${ember}4d`,
          }}
        />

        <Animated.View
          entering={reduced ? undefined : FadeInDown.delay(1700).duration(700)}
          style={{ paddingLeft: voicedX + 14, marginTop: DROP }}
          className="gap-1.5"
        >
          {/* The review's own title, kept as a title. It is the only place on
              this slide where someone says what Xolace became for them, and it
              is three words long — quoting it costs a line and buys the whole
              payoff the chosen sentence deliberately leaves out. */}
          <AppText className="text-foreground/90 text-[14px] leading-5 font-poppins-medium">
            {REVIEW.title}
          </AppText>

          {/* Set a step smaller than the deck's other body copy. Three
              sentences at 14px would run eleven lines and start reading as
              terms and conditions; at 12.5 it reads as what it is — someone
              typing more than they meant to. */}
          <AppText className="text-foreground/70 text-[12.5px] leading-[19px]">
            {`“${REVIEW.quote}”`}
          </AppText>

          <AppText className="text-foreground/38 text-[11.5px] mt-0.5">
            {`${REVIEW.author} · ${REVIEW.source}`}
          </AppText>
        </Animated.View>
      </View>

      {/* The count arrives last and reads as a caption on a picture you have
          already looked at — the opposite order to a stat card, where the
          number arrives first and the visual decorates it. */}
      <Animated.View entering={enter(6)} className="mt-7">
        <AppText className="text-foreground/70 text-[14px] leading-6">
          {/* PEOPLE, not "embers". The field above is already made of embers,
              so counting them in embers left the unit doing two jobs at once
              and a stranger could read it as 22 fires, 22 visits, or 22
              anything. The picture supplies the metaphor; the sentence has the
              one job of saying plainly what the lights are. */}
          <AppText className="font-poppins-medium" style={{ color: ember }}>{`${COUNT} people`}</AppText>
          {/* Closes the headline rather than restating it. The field already
              shows people sitting apart; the sentence is what turns that
              picture from a lonely one into the beat's actual claim. */}
          {' sat by the fire this week — each one alone, none of them the only one.'}
        </AppText>
        <AppText className="text-foreground/38 text-[12px] leading-5 mt-1.5 pr-4">
          {beat.aside}
        </AppText>
      </Animated.View>
    </View>
  );
};
