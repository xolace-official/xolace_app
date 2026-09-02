/**
 * The intake offer screen (T4, issue #235) — step 4 of intake, fired once at
 * session 0, right after Q11.
 *
 * Strictly an offer, not a checkout: there is no price on this screen and no
 * package to select. "I'm ready" pushes the real paywall (`(intake)/plans`),
 * which is where pricing, the period picker and the store call live. Splitting
 * the two keeps the first-run pitch from opening on a number.
 *
 * Deliberately NOT wired into `src/features/purchases/plus-offer-policy.ts`:
 * declining here is not a proactive-offer dismissal and must never spend the
 * dismissal budget. Do not connect them.
 */
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { usePostHog, useFeatureFlag } from 'posthog-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';
import { IntakeBlank, IntakeScreen } from '@/src/features/intake/questionnaire/intake-screen';
import { trackStepViewed } from '@/src/features/intake/analytics';
import { intentLine } from '@/src/features/intake/paywall/intent-line';
import {
  InsightsOfferCard,
  LimitsOfferCard,
  XolacersOfferCard,
} from '@/src/features/intake/paywall/offer-cards';
import { VoiceOfferCard } from '@/src/features/intake/paywall/voice-offer-card';
import { useIntakeComplete } from '@/src/features/intake/use-intake-complete';
import { usePlusEntitlement } from '@/src/features/purchases/use-plus-entitlement';
import { playSoftPress } from '@/src/lib/haptics';
import { useEffectiveReducedMotion } from '@/src/lib/motion/use-effective-reduced-motion';
import { useAppStore } from '@/src/store/store';

/** The A/B: the Q2 line on (treatment) vs off (control). */
export const INTAKE_PERSONALIZED_LINE_FLAG = 'intake-paywall-personalized-line';

const GAP = 14;
const EDGE = 20;

export default function IntakeOffer() {
  const router = useRouter();
  const posthog = usePostHog();
  const completeIntake = useIntakeComplete();
  const answers = useAppStore((s) => s.intakeAnswers);
  const { width, height } = useWindowDimensions();
  const reduced = useEffectiveReducedMotion();
  const { isPlus } = usePlusEntitlement();
  const skipping = useRef(false);

  // Treatment is the enabled arm; an unresolved flag falls back to control, so
  // a slow flag load can never show a half-personalized screen.
  const arm = useFeatureFlag(INTAKE_PERSONALIZED_LINE_FLAG);
  const personalized = arm === true || arm === 'test';
  const line = intentLine(answers, personalized);

  // The peek on the right is what says "there is more" — the deck has no dots.
  const cardWidth = Math.min(width - EDGE * 2 - 44, 320);
  // Tuned to the fullest card (Insights) and clamped so a short device gives
  // the deck the room it has rather than pushing the CTA off-screen.
  const deckHeight = Math.min(430, height * 0.54);

  // Session 0 by construction: intake runs once, before any session exists.
  const track = (event: string) =>
    posthog.capture(event, {
      surface: 'intake',
      session_count: 0,
      personalized,
      arm: personalized ? 'treatment' : 'control',
    });

  useEffect(() => {
    if (isPlus) return; // already entitled at mount — nothing was shown
    // Its own event, not `paywall_opened`: on the other three surfaces that
    // event means "saw pricing", and there is no price on this screen. The
    // pricing impression fires from `(intake)/plans`, so intake's opened →
    // purchased rate stays comparable to the rest. This is the A/B impression
    // — it is where the personalized line is or isn't shown.
    track('intake_offer_opened');
    // The last step of the funnel's paged flow (T7 §2.3) — this deck is what
    // `step_key: "paywall"` means, not the pricing screen behind it.
    trackStepViewed(posthog, 'paywall');
    // Once on mount — this is the impression, not a re-render signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    track('paywall_dismissed');
    void completeIntake('dismissed_paywall');
  };

  /*
   * A current subscriber must never be pitched (T4, #235). The questionnaire's
   * skip branch reads `isPlus`, which is false until both entitlement sources
   * answer — so a subscriber whose SDK was still loading gets pushed here
   * anyway. Finish intake the moment it resolves, and hold a blank frame
   * meanwhile so the deck is never *shown* to them.
   *
   * Focus-scoped: a purchase completing on `(intake)/plans` also flips `isPlus`,
   * and this screen is still mounted underneath it.
   */
  useFocusEffect(
    useCallback(() => {
      if (!isPlus || skipping.current) return;
      skipping.current = true;
      void completeIntake('skipped_paywall');
    }, [isPlus, completeIntake])
  );

  if (isPlus) return <IntakeBlank />;

  return (
    <IntakeScreen>
      <View className="flex-1 gap-4 pt-2">
        {/* The headline carries the top of the screen deliberately: it is the
            only thing above the deck, and at this size it seats the cards low
            enough that the deck reads as one row rather than as the page. */}
        <View className="gap-2 px-5 pt-1">
          {line ? (
            <Animated.View entering={reduced ? undefined : FadeIn.duration(320)}>
              <AppText className="text-[16px] leading-[23px] text-foreground/45 font-[Poppins-Regular]">
                {line}
              </AppText>
            </Animated.View>
          ) : null}
          <AppText className="text-[34px] leading-[41px] text-foreground font-[Poppins-SemiBold]">
            Xolace+ is where it goes further.
          </AppText>
          <AppText className="text-[15px] leading-[21px] text-foreground/50 font-[Poppins-Regular]">
            Free for your first 7 days.
          </AppText>
        </View>

        {/* The deck is explicitly sized rather than left to fill the column:
            stretched to the full height the lighter cards open a hole under
            their title, and a horizontal ScrollView that sizes to its own
            content collapses to nothing. */}
        <View className="flex-1 justify-center">
        <ScrollView
          horizontal
          style={{ height: deckHeight }}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + GAP}
          snapToAlignment="start"
          contentContainerStyle={{
            paddingHorizontal: EDGE,
            gap: GAP,
            alignItems: 'stretch',
            paddingVertical: 4,
          }}
        >
          <VoiceOfferCard width={cardWidth} />
          <XolacersOfferCard width={cardWidth} />
          <InsightsOfferCard width={cardWidth} />
          <LimitsOfferCard width={cardWidth} />
        </ScrollView>
        </View>

        <View className="gap-3 px-5 pt-1">
          <Button
            onPress={() => {
              playSoftPress();
              router.push('/(intake)/plans');
            }}
          >
            <Button.Label>I&apos;m ready</Button.Label>
          </Button>
          {/* A recessive text link, not a button: dismissing is allowed, but it
              is not the thing being offered. */}
          <AppText
            accessibilityRole="button"
            onPress={handleDismiss}
            className="py-1 text-center text-[14px] text-foreground/40 font-[Poppins-Regular]"
          >
            Not now
          </AppText>
        </View>
      </View>
    </IntakeScreen>
  );
}
