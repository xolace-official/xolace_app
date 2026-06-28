import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useCSSVariable } from "uniwind";
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
  eventPrompt?: string | null;
  eventLabel?: string | null;
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
  eventPrompt,
  eventLabel,
  spaceName,
  className,
}: Props) => {
  const [eventColor] = useCSSVariable(["--color-event"]);

  const headline = isNight
    ? NIGHT_HEADLINE
    : activeQuietReturn
      ? QUIET_RETURN_PROMPTS[activeQuietReturn]
      : eventPrompt ?? "What’s here right now... what are you feeling?";

  const showEventPrompt = !isNight && !activeQuietReturn && !!eventPrompt;
  const isLongPrompt = !!activeQuietReturn || showEventPrompt;

  const encouragement = isNight
    ? NIGHT_ENCOURAGEMENT
    : activeQuietReturn
      ? null
      : encouragementText(variant);

  const showStreakCalendar =
    variant.kind === "active" && !isNight && !activeQuietReturn;

  const eventPill = showEventPrompt ? (
    <View className="shrink flex-row items-center gap-1.5 rounded-full bg-event/15 px-3 py-1">
      <SymbolView
        name={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
        size={11}
        tintColor={String(eventColor)}
      />
      <AppText className="shrink text-xs font-semibold text-event" numberOfLines={1}>
        {eventLabel ?? "This month"}
      </AppText>
    </View>
  ) : null;

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
          {eventPill}
        </View>
      ) : encouragement ? (
        <View className="flex-row items-start justify-between gap-3">
          <AppText
            className={cn(
              "flex-1 text-sm italic leading-6 text-foreground/40",
              variant.kind === "returning" && "text-warning",
            )}
          >
            {encouragement}
          </AppText>
          {eventPill}
        </View>
      ) : eventPill ? (
        <View className="flex-row justify-end">{eventPill}</View>
      ) : null}

      <AppText
        className={cn(
          "font-semibold text-foreground",
          isLongPrompt ? "text-xl leading-9" : "text-4xl",
          (encouragement || showStreakCalendar || showEventPrompt) && "mt-4",
        )}
      >
        {headline}
      </AppText>
    </View>
  );
};
