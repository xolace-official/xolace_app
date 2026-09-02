/**
 * The card shell for the intake offer deck — one saturated panel per offer.
 *
 * Every card is the same three-part stack (tag → title → the thing itself), so
 * the deck reads as one set rather than four posters. Colour is the only
 * variable, and it comes from the four `--tone-*` hues the app already owns.
 *
 * Text sits on `--offer-ink`, not `--foreground`: the panel is a light surface
 * in both schemes, so the foreground token would invert to white on dark and
 * disappear.
 */
import type { ReactNode } from 'react';
import { View, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';

/** One Flux pose per card, bleeding off the top-right corner. */
export const OFFER_MASCOT = {
  voices: require('@/assets/images/flux/flux-whisper.png'),
  xolacers: require('@/assets/images/flux/jump-love-bgremove.png'),
  insights: require('@/assets/images/flux/plus-mascot.png'),
  limits: require('@/assets/images/flux/flux-campfire.png'),
} as const;

export type OfferTint = 'poetic' | 'gentle' | 'direct' | 'witnessed';

const TINT: Record<OfferTint, string> = {
  poetic: 'bg-tone-poetic',
  gentle: 'bg-tone-gentle',
  direct: 'bg-tone-direct',
  witnessed: 'bg-tone-witnessed',
};

interface OfferCardProps {
  tag: string;
  title: string;
  tint: OfferTint;
  width: number;
  mascot: ImageSourcePropType;
  /** The mock — what the feature actually looks like, not a decoration. */
  children: ReactNode;
}

/**
 * The tag chip is a different hue from the card it sits on — that jump is what
 * makes it read as a label rather than as more card. Amber everywhere except
 * the amber card, which takes rose.
 */
const CHIP: Record<OfferTint, string> = {
  poetic: TINT.witnessed,
  gentle: TINT.witnessed,
  direct: TINT.witnessed,
  witnessed: TINT.gentle,
};

export function OfferCard({ tag, title, tint, width, mascot, children }: OfferCardProps) {
  // Flux sits in the top-right and the title wraps beside him, so the corner
  // never reads as an empty margin. Sized off the card, not the screen — the
  // deck is the only thing that changes width.
  const mascotSize = width * 0.54;

  return (
    <View
      className={cn('overflow-hidden rounded-[28px] p-5 gap-3.5', TINT[tint])}
      style={{ width }}
    >
      <Image
        source={mascot}
        style={{
          position: 'absolute',
          // Positive top on purpose: Flux's flame tip is the top of every pose,
          // and a negative offset clips it against the card's own overflow.
          top: 6,
          right: -14,
          width: mascotSize,
          height: mascotSize,
        }}
        contentFit="contain"
        transition={0}
      />
      <OfferPill className={CHIP[tint]}>{tag}</OfferPill>
      <AppText
        style={{ paddingRight: mascotSize * 0.6 }}
        className="text-[25px] leading-[30px] text-offer-ink font-[Poppins-SemiBold]"
      >
        {title}
      </AppText>
      {/* Bottom-anchored. The deck stretches every card to the tallest one, so
          the slack has to go somewhere; pooled under the title it reads as air
          around the headline, split above and below it reads as a hole. */}
      <View className="flex-1 justify-end gap-2.5">{children}</View>
    </View>
  );
}

/** The small label above the title, and the same chip used inside the mocks. */
export function OfferPill({ children, className }: { children: string; className?: string }) {
  return (
    <View className={cn('self-start rounded-full px-3 py-1.5 bg-offer-ink/[0.12]', className)}>
      <AppText className="text-[12px] text-offer-ink font-[Poppins-Medium]">{children}</AppText>
    </View>
  );
}

/** A panel inside a card — the mock's own surface, one step lighter. */
export function OfferMock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn('rounded-2xl bg-offer-ink/10 p-3.5 gap-2.5', className)}>{children}</View>
  );
}
