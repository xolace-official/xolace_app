import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { Separator, TagGroup, cn } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";
import { TimelineIcon } from "@/src/features/reflect/components/timeline-icon";
import { MicButton } from "@/src/features/reflect/components/mic-button";
import type { UserVariant, ReflectionAction } from "@/src/features/reflect/types";
import { playTypingBegin, playTextureSelect, playHomeEntrance } from "@/src/lib/haptics";
import { useSessionMode } from "@/src/context/session-mode-context";
import {
  NIGHT_ENCOURAGEMENT,
  NIGHT_HEADLINE,
  NIGHT_TEXTURE_WORDS,
} from "@/src/features/reflect/night-copy";
import {
  QUIET_RETURN_PROMPTS,
  type QuietReturnTier,
} from "@/src/features/reflect/quiet-return-copy";

const DAY_TEXTURE_WORDS = [
  "heavy",
  "tight",
  "foggy",
  "buzzing",
  "empty",
  "scattered",
  "numb",
  "raw",
];

type Props = {
  variant: UserVariant;
  quietReturn: QuietReturnTier | null;
  selectedTextures: string[];
  dispatch: React.Dispatch<ReflectionAction>;
  onTap: () => void;
  onScaffoldSubmit: () => void;
  onVoiceTap: () => void;
  isRecording: boolean;
  spaceName?: string;
};

const encouragementText = (variant: UserVariant): string => {
  switch (variant.kind) {
    case "first-time":
      return "You don't need to know what to say.";
    case "returning":
      return "It's been a little while.\nNo pressure. I'm here.";
    case "active":
      return `Day ${variant.dayCount}`;
  }
};

export const IdleState = ({
  variant,
  quietReturn,
  selectedTextures,
  dispatch,
  onTap,
  onScaffoldSubmit,
  onVoiceTap,
  isRecording,
  spaceName,
}: Props) => {
  const { isNight } = useSessionMode();
  const TEXTURE_WORDS: readonly string[] = isNight
    ? NIGHT_TEXTURE_WORDS
    : DAY_TEXTURE_WORDS;

  const activeQuietReturn = !isNight ? quietReturn : null;
  const headline = isNight
    ? NIGHT_HEADLINE
    : activeQuietReturn
      // TODO(space-name-greeting): "Your space, [Name], is still here" for quiet-return tier
      ? QUIET_RETURN_PROMPTS[activeQuietReturn]
      : "What\u2019s here right now... what are you feeling?";
  const encouragement = isNight
    ? NIGHT_ENCOURAGEMENT
    : activeQuietReturn
      ? null
      : encouragementText(variant);

  const isSpaceNameActive =
    variant.kind === "active" && !!spaceName && !isNight && !activeQuietReturn;

  const hasPlayedEntrance = useRef(false);

  useEffect(() => {
    if (!hasPlayedEntrance.current) {
      hasPlayedEntrance.current = true;
      playHomeEntrance();
    }
  }, []);

  const handleTap = () => {
    playTypingBegin();
    onTap();
  };

  const handleToggle = (word: string) => {
    playTextureSelect();
    dispatch({ type: "TOGGLE_TEXTURE", word });
  };

  const handleSelectionChange = (keys: Set<string | number>) => {
    const next = new Set(keys);
    for (const word of TEXTURE_WORDS) {
      const isSelected = selectedTextures.includes(word);
      const shouldBeSelected = next.has(word);

      if (isSelected !== shouldBeSelected) {
        handleToggle(word);
      }
    }
  };

  const hasSelections = selectedTextures.length > 0;

  return (
    <View className="flex-1 px-6">
      {/* Top section */}
      <View className="pt-10 pb-4">
        {isSpaceNameActive ? (
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-accent/15 px-3 py-1">
              <AppText className="text-xs font-semibold text-accent">
                {spaceName}
              </AppText>
            </View>
            <AppText className="text-sm text-foreground/40">{encouragement}</AppText>
          </View>
        ) : encouragement ? (
          <AppText className={cn(
            "text-sm italic leading-6 text-foreground/40",
            variant.kind === "returning" && "text-warning",
          )}>
            {encouragement}
          </AppText>
        ) : null}

        <AppText
          className={cn(
            "font-semibold text-foreground",
            activeQuietReturn ? "text-2xl leading-9" : "text-4xl",
            encouragement && "mt-4",
          )}
        >
          {headline}
        </AppText>
      </View>

      {/* Tap to type zone — takes up available space */}
      <Separator className="mb-0" />

      <View className="flex-1 pt-4">
          <Pressable
            onPress={handleTap}
            accessibilityRole="button"
            accessibilityLabel="Tap to begin writing"
            accessibilityHint="Opens the editor to start typing"
            className="flex-1"
          >
            <AppText className="text-base text-foreground/30">
              Tap to begin writing...
            </AppText>
        </Pressable>
        <View className="absolute right-2 top-1">
          <MicButton size="md" isRecording={isRecording} onPress={onVoiceTap} />
        </View>
      </View>

      {/* Scaffold section */}
      <View className="border-t border-foreground/5 pt-6 pb-8">
        <AppText className="mb-3 text-xs text-foreground/30">
          Or just tap what feels close:
        </AppText>

        <TagGroup
          selectionMode="multiple"
          size="sm"
          variant="surface"
          selectedKeys={new Set(selectedTextures)}
          onSelectionChange={handleSelectionChange}
          animation="disable-all"
        >
          <TagGroup.List className="flex-row flex-wrap gap-2">
            {TEXTURE_WORDS.map((word) => (
              <TagGroup.Item key={word} id={word}>
                {({ isSelected }) => (
                  <>
                    <TagGroup.ItemLabel
                      className={
                        isSelected ? "text-accent" : "text-foreground/80"
                      }
                    >
                      {word}
                    </TagGroup.ItemLabel>
                  </>
                )}
              </TagGroup.Item>
            ))}
          </TagGroup.List>
        </TagGroup>

        {/* "Let it out" emerges after first selection */}
        {hasSelections && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mt-5"
          >
            <PillButton label="Let it out" onPress={onScaffoldSubmit} />
          </Animated.View>
        )}
      </View>

      <View className="absolute bottom-22 right-6">
        <TimelineIcon />
      </View>
    </View>
  );
};
