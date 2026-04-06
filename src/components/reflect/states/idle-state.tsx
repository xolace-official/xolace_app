import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { Separator, TagGroup, cn } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/reflect/pill-button";
import { TimelineIcon } from "@/src/components/reflect/timeline-icon";
import type { UserVariant, ReflectionAction } from "@/src/interfaces/reflection";
import { playTypingBegin, playTextureSelect, playHomeEntrance } from "@/src/lib/haptics";

const TEXTURE_WORDS = [
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
  selectedTextures: string[];
  dispatch: React.Dispatch<ReflectionAction>;
  onTap: () => void;
  onScaffoldSubmit: () => void;
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
  selectedTextures,
  dispatch,
  onTap,
  onScaffoldSubmit,
}: Props) => {
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
        <AppText className={cn("text-sm italic leading-6 text-foreground/40", variant.kind === "returning" && "text-warning")}>
          {encouragementText(variant)}
        </AppText>

        <AppText className="mt-4 text-4xl font-semibold text-foreground">
          What&apos;s here right now... what are you feeling?
        </AppText>
      </View>

      {/* Tap to type zone — takes up available space */}
      <Separator className="mb-0" />

      <Pressable
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel="Tap to begin writing"
        accessibilityHint="Opens the editor to start typing"
        className="flex-1 pt-4"
      >
        <AppText className="text-base text-foreground/30">
          Tap to begin writing...
        </AppText>
      </Pressable>

      {/* Scaffold section */}
      <View className="border-t border-foreground/5 pt-5 pb-8">
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

      <View className="absolute bottom-20 right-6">
        <TimelineIcon />
      </View>
    </View>
  );
};
