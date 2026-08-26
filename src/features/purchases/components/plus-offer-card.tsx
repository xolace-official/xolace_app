import { useEffect, useRef } from "react";
import { View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { usePostHog } from "posthog-react-native";
import { AppText } from "@/src/components/shared/app-text";
import {
  plusOfferCopy,
  PLUS_OFFER_DECLINE_LABEL,
} from "@/src/features/purchases/plus-offer-copy";
import type {
  PlusOfferMoment,
  PlusOfferVariant,
} from "@/src/features/purchases/plus-offer-policy";
import { playSoftPress } from "@/src/lib/haptics";
import { useAppStore } from "@/src/store/store";

type Props = {
  moment: PlusOfferMoment;
  variant?: PlusOfferVariant;
  /**
   * A true line about this user's own week, from data the Understanding already
   * holds. Omit it when there isn't one — a fabricated observation is the one
   * thing this card must never print.
   */
  observation?: string;
  onOpen: () => void;
  onDismiss?: () => void;
};

/**
 * The one card every proactive Plus moment renders: `[observation?] [value]
 * [CTA] [I'm good]`.
 *
 * Shared rather than per-moment so the two things that are not a call site's
 * business stay uniform — the decline is always present, always literally
 * "I'm good," always the same visual weight as the CTA, and dismissing always
 * spends the 7-day cooldown. Zone comes from the moment: `raw` moments get no
 * fire imagery, because there the campfire is supposed to show up as
 * specificity instead.
 *
 * This is the product's voice standing next to the fire, never the mirror's.
 */
export const PlusOfferCard = ({
  moment,
  variant = "default",
  observation,
  onOpen,
  onDismiss,
}: Props) => {
  const posthog = usePostHog();
  const accentColor = useThemeColor("accent") as string;
  const recordDismissal = useAppStore((s) => s.recordPlusOfferDismissal);
  const copy = plusOfferCopy(moment, variant);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    posthog.capture("plus_offer_shown", { moment, variant });
  }, [posthog, moment, variant]);

  const handleDismiss = () => {
    playSoftPress();
    posthog.capture("plus_offer_dismissed", { moment, variant });
    recordDismissal(moment);
    onDismiss?.();
  };

  return (
    <View className="w-full overflow-hidden rounded-3xl border border-accent/25 bg-accent/[0.05] p-5">
      {/* One image, warm zone only (#221 rule 4). */}
      {copy.zone === "warm" && (
        <View className="size-9 items-center justify-center rounded-xl bg-accent/12 mb-4">
          <SymbolView
            name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }}
            size={16}
            tintColor={accentColor}
          />
        </View>
      )}

      {observation ? (
        <AppText className="font-serif text-lg italic text-foreground/70 leading-6 mb-2">
          {observation}
        </AppText>
      ) : null}

      {copy.lead ? (
        <AppText className="font-serif text-xl text-foreground leading-7 mb-1.5">
          {copy.lead}
        </AppText>
      ) : null}

      <AppText className="text-sm font-light text-foreground/60 leading-5">
        {copy.value}
      </AppText>

      {/* Equal weight, side by side: saying no is as easy as saying yes. */}
      <View className="flex-row items-center gap-2 mt-5">
        <PressableFeedback
          onPress={() => {
            playSoftPress();
            onOpen();
          }}
          accessibilityRole="button"
          accessibilityLabel={copy.cta}
          className="flex-1 items-center justify-center rounded-full border border-accent/40 bg-accent/10 px-4 py-3"
        >
          <AppText className="text-sm font-medium text-accent">{copy.cta}</AppText>
        </PressableFeedback>
        <PressableFeedback
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel={PLUS_OFFER_DECLINE_LABEL}
          className="flex-1 items-center justify-center rounded-full border border-foreground/15 px-4 py-3"
        >
          <AppText className="text-sm font-medium text-foreground/70">
            {PLUS_OFFER_DECLINE_LABEL}
          </AppText>
        </PressableFeedback>
      </View>
    </View>
  );
};
