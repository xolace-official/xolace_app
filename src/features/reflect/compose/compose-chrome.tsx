import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { PressableFeedback, Separator, useThemeColor } from "heroui-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { QuietReturnHeader } from "@/src/features/reflect/components/quiet-return-header";
import type { QuietReturnTier } from "@/src/features/reflect/quiet-return-copy";
import type { UserVariant } from "@/src/features/reflect/types";
import { playSoftPress } from "@/src/lib/haptics";

const QUOTE_ICON_NAME = { ios: "sparkles", android: "auto_awesome" } as const;

type Props = {
  variant: UserVariant;
  isNight: boolean;
  activeQuietReturn: QuietReturnTier | null;
  eventPrompt: string | null;
  eventLabel: string | null;
  spaceName?: string;
};

/**
 * What sits above the card: who the user is here, and the one other way in.
 *
 * It informs without competing — the prompt itself moved onto the card (#256),
 * so nothing up here speaks for the space.
 */
export const ComposeChrome = ({
  variant,
  isNight,
  activeQuietReturn,
  eventPrompt,
  eventLabel,
  spaceName,
}: Props) => {
  const router = useRouter();
  const accentColor = useThemeColor("accent") as string;
  const todayQuotes = useQuery(api.dailyQuotes.getToday);
  const hasQuote = !!(todayQuotes?.session ?? todayQuotes?.curated);

  return (
    <>
      <QuietReturnHeader
        variant={variant}
        isNight={isNight}
        activeQuietReturn={activeQuietReturn}
        eventPrompt={eventPrompt}
        eventLabel={eventLabel}
        spaceName={spaceName}
        className="pt-0 pb-3"
      />

      {hasQuote && (
        <PressableFeedback
          onPress={() => {
            playSoftPress();
            router.push("/(protected)/quotes");
          }}
          accessibilityLabel="Open today's reflection"
          hitSlop={8}
          className="items-center pb-3"
        >
          <View className="flex-row items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5">
            <SymbolView name={QUOTE_ICON_NAME} size={11} tintColor={accentColor} />
            <AppText className="text-xs font-medium text-accent/80">
              A word for today
            </AppText>
          </View>
        </PressableFeedback>
      )}

      <Separator className="mb-0" />
    </>
  );
};
