import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { usePostHog } from "posthog-react-native";
import { AppText } from "@/src/components/shared/app-text";
import {
  plusOfferCopy,
  PLUS_OFFER_DECLINE_LABEL,
} from "@/src/features/purchases/plus-offer-copy";
import {
  plusOfferSurfaceForMoment,
  type PlusOfferMoment,
  type PlusOfferVariant,
} from "@/src/features/purchases/plus-offer-policy";
import { playSoftPress } from "@/src/lib/haptics";
import { useAppStore } from "@/src/store/store";

const BG = require("@/assets/images/flux/plus-postcard-bg.png");
const ABS_FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };
/** The scene's own night, not a theme color — the art is dark in every theme. */
const NIGHT = "#0b0716";

type Props = {
  moment: PlusOfferMoment;
  variant?: PlusOfferVariant;
  /**
   * A true line about this user's own week, from data the Understanding already
   * holds. Omit it when there isn't one — a fabricated observation is the one
   * thing this card must never print.
   */
  observation?: string;
  /**
   * The session this offer belongs to. Recorded on mount so the one-per-session
   * cap is spent by an appearance, not by a decision.
   */
  sessionId?: string | null;
  onOpen: () => void;
  onDismiss?: () => void;
};

/**
 * Value line with "Xolace+" in accent. Text is explicitly `text-white` — the
 * card art is always dark, so it must not follow the theme foreground, which is
 * what makes it vanish in light mode. AppText defaults to `text-foreground`, so
 * any bare nested <AppText> would re-inherit it; keep this flat.
 */
const PlusValue = ({ text, accent }: { text: string; accent: string }) => {
  const [before, after] = text.split("Xolace+");
  return (
    <AppText className="text-[13px] font-light leading-5 text-white">
      {before}
      <AppText className="font-semibold" style={{ color: accent }}>
        Xolace+
      </AppText>
      {after ?? ""}
    </AppText>
  );
};

/**
 * The one card every proactive Plus moment renders: a fixed 16:10 night-scene
 * postcard with the copy on a scrim pinned to the bottom, over the mascot's
 * lower body — sky, head and telescope stay in the clear upper zone.
 *
 * Shared rather than per-moment so the two things that are not a call site's
 * business stay uniform — the decline is always present, always literally
 * "I'm good," and dismissing always spends the 7-day cooldown.
 *
 * This is the product's voice standing next to the fire, never the mirror's.
 */
export const PlusOfferCard = ({
  moment,
  variant = "default",
  observation,
  sessionId = null,
  onOpen,
  onDismiss,
}: Props) => {
  const posthog = usePostHog();
  const accentColor = useThemeColor("accent") as string;
  const recordDismissal = useAppStore((s) => s.recordPlusOfferDismissal);
  const recordShown = useAppStore((s) => s.recordPlusOfferShown);
  const copy = plusOfferCopy(moment, variant);
  const shownRef = useRef(false);
  // The card takes itself off screen. A decline that leaves the ask sitting
  // there is a second ask, and every call site forgetting to hide it is the
  // same bug three times.
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    posthog.capture("plus_offer_shown", { moment, variant });
    recordShown(sessionId);
  }, [posthog, moment, variant, recordShown, sessionId]);

  const handleDismiss = () => {
    playSoftPress();
    setDeclined(true);
    posthog.capture("plus_offer_dismissed", { moment, variant });
    recordDismissal(plusOfferSurfaceForMoment(moment));
    onDismiss?.();
  };

  if (declined) return null;

  return (
    <View
      className="w-full overflow-hidden rounded-3xl"
      style={{
        aspectRatio: 16 / 10,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <Image source={BG} style={ABS_FILL} contentFit="cover" contentPosition="left" />
      {/* Positioned in `style`, not `className`: uniwind's `bottom-0` on a
          LinearGradient leaves the scrim stuck at the top. */}
      <LinearGradient
        colors={[`${NIGHT}00`, `${NIGHT}e0`, NIGHT]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 18,
          paddingTop: 30,
          paddingBottom: 16,
        }}
      >
        {observation ? (
          // Capped: the scrim grows upward, and an unbounded observation would
          // climb over the mascot's head.
          <AppText
            numberOfLines={2}
            className="mb-1.5 font-serif text-[15px] italic leading-5 text-white/70"
          >
            {observation}
          </AppText>
        ) : null}

        {copy.lead ? (
          <AppText className="mb-1.5 font-serif text-[17px] leading-6 text-white">
            {copy.lead}
          </AppText>
        ) : null}

        <PlusValue text={copy.value} accent={accentColor} />

        <View className="mt-4 flex-row items-center gap-4">
          <PressableFeedback
            onPress={() => {
              playSoftPress();
              onOpen();
            }}
            accessibilityRole="button"
            accessibilityLabel={copy.cta}
            className="rounded-full px-4 py-2.5"
            style={{ backgroundColor: accentColor }}
          >
            <AppText className="text-[13px] font-semibold text-background">
              {copy.cta}
            </AppText>
          </PressableFeedback>
          <PressableFeedback
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={PLUS_OFFER_DECLINE_LABEL}
            hitSlop={8}
          >
            <AppText className="text-[13px] text-white/55">
              {PLUS_OFFER_DECLINE_LABEL}
            </AppText>
          </PressableFeedback>
        </View>
      </LinearGradient>
    </View>
  );
};
