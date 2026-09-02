/**
 * Three of the four offers on the intake deck, each drawn as the thing itself
 * rather than as an illustration of it — miniatures of the surfaces they
 * unlock. The fourth, the voice card, is interactive and lives in
 * `voice-offer-card.tsx`.
 *
 * Four is the cap. A fifth card is a fifth thing to weigh at the exact moment
 * the user is deciding whether any of it is for them.
 */
import { View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { OFFER_MASCOT, OfferCard, OfferMock, OfferPill } from '@/src/features/intake/paywall/offer-card';
import { cn } from '@/src/lib/utils';


/** Card 2 — Xolacers. Two bubbles is the product; anything more is decoration. */
export function XolacersOfferCard({ width }: { width: number }) {
  return (
    <OfferCard tag="Xolacers" title="Talk to someone who gets it" tint="gentle" width={width} mascot={OFFER_MASCOT.xolacers}>
      <OfferMock>
        <View className="self-start rounded-2xl rounded-bl-md bg-offer-ink/10 px-3.5 py-2.5">
          <AppText className="text-[14px] leading-[19px] text-offer-ink font-[Poppins-Regular]">
            Sunday nights are the worst.
          </AppText>
        </View>
        <View className="self-end rounded-2xl rounded-br-md bg-offer-ink/[0.18] px-3.5 py-2.5">
          <AppText className="text-[14px] leading-[19px] text-offer-ink font-[Poppins-Regular]">
            Same. Mine start around 6.
          </AppText>
        </View>
        <View className="self-start rounded-2xl rounded-bl-md bg-offer-ink/10 px-3.5 py-2.5">
          <AppText className="text-[14px] leading-[19px] text-offer-ink font-[Poppins-Regular]">
            How do you get through it?
          </AppText>
        </View>
        <View className="self-end rounded-2xl rounded-br-md bg-offer-ink/[0.18] px-3.5 py-2.5">
          <AppText className="text-[14px] leading-[19px] text-offer-ink font-[Poppins-Regular]">
            Honestly? Saying it out loud.
          </AppText>
        </View>
        {/* Someone is still there — the one thing a static mock can say about
            a live conversation. */}
        <View className="self-start flex-row gap-1.5 rounded-2xl rounded-bl-md bg-offer-ink/10 px-3.5 py-3.5">
          <View className="h-1.5 w-1.5 rounded-full bg-offer-ink/40" />
          <View className="h-1.5 w-1.5 rounded-full bg-offer-ink/40" />
          <View className="h-1.5 w-1.5 rounded-full bg-offer-ink/40" />
        </View>
      </OfferMock>
      <AppText className="text-[13px] leading-[18px] text-offer-ink/70 font-[Poppins-Regular]">
        Matched on what you&apos;re carrying. No names, no profiles.
      </AppText>
    </OfferCard>
  );
}

/**
 * Card 3 — insights. Two panels because Plus ships two of them: the week's
 * intensity history and the words/language map (`TeaserFeature` in
 * use-insight-gate.ts). One panel would sell insights as a word cloud.
 */
const WEEK = [
  { day: 'M', level: 'h-2.5 opacity-30' },
  { day: 'T', level: 'h-5 opacity-55' },
  { day: 'W', level: 'h-4 opacity-45' },
  { day: 'T', level: 'h-8 opacity-95' },
  { day: 'F', level: 'h-6 opacity-70' },
  { day: 'S', level: 'h-3 opacity-35' },
  { day: 'S', level: 'h-7 opacity-85' },
];

export function InsightsOfferCard({ width }: { width: number }) {
  return (
    <OfferCard tag="Insights" title="See what keeps coming back" tint="poetic" width={width} mascot={OFFER_MASCOT.insights}>
      <OfferMock>
        <AppText className="text-[12px] uppercase tracking-widest text-offer-ink/50 font-[Poppins-Medium]">
          This week
        </AppText>
        {/* Seven days, one block each — how heavy the day ran. Blocks, not a
            plotted line: this is a week, not a trend. */}
        <View className="flex-row items-end justify-between pt-0.5">
          {WEEK.map((d, i) => (
            <View key={`${d.day}-${i}`} className="items-center gap-1.5">
              <View className={cn('w-6 rounded-md bg-offer-ink', d.level)} />
              <AppText className="text-[11px] text-offer-ink/50 font-[Poppins-Medium]">
                {d.day}
              </AppText>
            </View>
          ))}
        </View>
        <AppText className="pt-1 text-[13px] leading-[18px] text-offer-ink/70 font-[Poppins-Regular]">
          Thursdays run heaviest — four weeks straight.
        </AppText>
      </OfferMock>

      <OfferMock>
        <AppText className="text-[15px] leading-[21px] text-offer-ink font-[Poppins-Medium]">
          Work came up in 7 of your last 9 reflections.
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          <OfferPill>Work</OfferPill>
          <OfferPill>Sunday</OfferPill>
          <OfferPill>Tired</OfferPill>
        </View>
      </OfferMock>
      <AppText className="text-[13px] leading-[18px] text-offer-ink/70 font-[Poppins-Regular]">
        And more the longer you keep going.
      </AppText>
    </OfferCard>
  );
}

/**
 * The rest of Plus in one table — the caps it lifts, and the two things it
 * swaps from generic to yours (quotes and mirror tone). The `free` column is
 * struck through, so every row has to read as a real before/after.
 */
const CAPS = [
  { label: 'Reflections', free: '3 a day', plus: 'No cap' },
  { label: 'Voice vents', free: '1 a day', plus: 'No cap' },
  { label: 'Timeline', free: '30 days', plus: 'All of it' },
  { label: 'Daily quotes', free: 'Generic', plus: 'Your words' },
  { label: 'Mirror tone', free: 'Auto', plus: 'You pick' },
];

/** Card 4 — the ceiling, lifted. Shows the actual numbers it lifts. */
export function LimitsOfferCard({ width }: { width: number }) {
  return (
    <OfferCard tag="Everything else" title="And the ceiling comes off" tint="direct" width={width} mascot={OFFER_MASCOT.limits}>
      <OfferMock className="gap-0 py-1">
        <View className="flex-row items-center pt-1.5 pb-0.5">
          <View className="flex-1" />
          <AppText className="text-[11px] uppercase tracking-wider text-offer-ink/45 font-[Poppins-Medium]">
            Free
          </AppText>
          <AppText className="w-[98px] pl-2 text-[11px] uppercase tracking-wider text-offer-ink/70 font-[Poppins-Medium]">
            Plus
          </AppText>
        </View>
        {CAPS.map((row) => (
          <View key={row.label} className="flex-row items-center py-3">
            <AppText className="flex-1 text-[14px] text-offer-ink/70 font-[Poppins-Regular]">
              {row.label}
            </AppText>
            <AppText className="text-[14px] text-offer-ink/40 line-through font-[Poppins-Regular]">
              {row.free}
            </AppText>
            <AppText className="w-[98px] pl-2 text-[14px] text-offer-ink font-[Poppins-SemiBold]">
              {row.plus}
            </AppText>
          </View>
        ))}
      </OfferMock>
      <AppText className="text-[13px] leading-[18px] text-offer-ink/70 font-[Poppins-Regular]">
        Nothing is taken away — the lid just comes off.
      </AppText>
    </OfferCard>
  );
}
