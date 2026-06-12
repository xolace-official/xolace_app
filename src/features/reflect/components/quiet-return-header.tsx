import { View } from "react-native";
import { cn } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { StreakCalendar } from "@/src/features/reflect/components/streak-calendar";
import type { UserVariant } from "@/src/features/reflect/types";
import {
  NIGHT_ENCOURAGEMENT,
  NIGHT_HEADLINE,
} from "@/src/features/reflect/night-copy";
import {
  QUIET_RETURN_PROMPTS,
  type QuietReturnTier,
} from "@/src/features/reflect/quiet-return-copy";

type Props = {
  variant: UserVariant;
  isNight: boolean;
  activeQuietReturn: QuietReturnTier | null;
  spaceName?: string;
  className?: string;
};

function encouragementText(variant: UserVariant): string | null {
  switch (variant.kind) {
    case "first-time":
      return "You don't need to know what to say.";
    case "returning":
      return "It's been a little while.\nNo pressure. I'm here.";
    case "active":
      // Active users get the streak calendar widget instead of text
      return null;
  }
}

export const QuietReturnHeader = ({
  variant,
  isNight,
  activeQuietReturn,
  spaceName,
  className,
}: Props) => {
  const headline = isNight
    ? NIGHT_HEADLINE
    : activeQuietReturn
      ? QUIET_RETURN_PROMPTS[activeQuietReturn]
      : "What’s here right now... what are you feeling?";

  const encouragement = isNight
    ? NIGHT_ENCOURAGEMENT
    : activeQuietReturn
      ? null
      : encouragementText(variant);

  const showStreakCalendar =
    variant.kind === "active" && !isNight && !activeQuietReturn;

  return (
    <View className={cn('pt-10 pb-4', className)}>
      {showStreakCalendar ? (
        <View className="flex-row items-center gap-3">
          <StreakCalendar currentStreak={variant.dayCount} />
          {!!spaceName && (
            <View className="rounded-full bg-accent/15 px-3 py-1">
              <AppText className="text-xs font-semibold text-accent">
                {spaceName}
              </AppText>
            </View>
          )}
        </View>
      ) : encouragement ? (
        <AppText
          className={cn(
            "text-sm italic leading-6 text-foreground/40",
            variant.kind === "returning" && "text-warning",
          )}
        >
          {encouragement}
        </AppText>
      ) : null}

      <AppText
        className={cn(
          "font-semibold text-foreground",
          activeQuietReturn ? "text-2xl leading-9" : "text-4xl",
          (encouragement || showStreakCalendar) && "mt-4",
        )}
      >
        {headline}
      </AppText>
    </View>
  );
};
