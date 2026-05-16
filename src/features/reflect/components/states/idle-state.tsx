import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { Separator, TagGroup } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";
import { IdleMenu } from "@/src/features/idle-menu/menu";
import { MicButton } from "@/src/features/reflect/components/mic-button";
import { QuietReturnHeader } from "@/src/features/reflect/components/quiet-return-header";
import type { UserVariant, ReflectionAction } from "@/src/features/reflect/types";
import { playTypingBegin, playTextureSelect, playHomeEntrance } from "@/src/lib/haptics";
import { useSessionMode } from "@/src/context/session-mode-context";
import { NIGHT_TEXTURE_WORDS } from "@/src/features/reflect/night-copy";
import type { QuietReturnTier } from "@/src/features/reflect/quiet-return-copy";

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
      if (isSelected !== shouldBeSelected) handleToggle(word);
    }
  };

  const hasSelections = selectedTextures.length > 0;
  const [buttonVisible, setButtonVisible] = useState(hasSelections);
  const [buttonMounted, setButtonMounted] = useState(hasSelections);

  useEffect(() => {
    if (hasSelections) {
      setButtonMounted(true);
      setButtonVisible(true);
    } else {
      setButtonVisible(false);
    }
  }, [hasSelections]);

  return (
    <View className="flex-1 px-6">
      <QuietReturnHeader
        variant={variant}
        isNight={isNight}
        activeQuietReturn={activeQuietReturn}
        spaceName={spaceName}
      />

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
            Tap to begin writing or speaking...
          </AppText>
        </Pressable>
        <View className="absolute right-2 top-2">
          <MicButton size="md" isRecording={isRecording} onPress={onVoiceTap} />
        </View>
      </View>

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
                      className={isSelected ? "text-accent" : "text-foreground/80"}
                    >
                      {word}
                    </TagGroup.ItemLabel>
                  </>
                )}
              </TagGroup.Item>
            ))}
          </TagGroup.List>
        </TagGroup>

        {buttonMounted && (
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: buttonVisible ? 1 : 0, translateY: buttonVisible ? 0 : 20 }}
            transition={buttonVisible
              ? { type: 'timing', duration: 300, easing: [0.455, 0.03, 0.515, 0.955] }
              : { type: 'timing', duration: 200, easing: [0.455, 0.03, 0.515, 0.955] }
            }
            onTransitionEnd={({ finished }) => {
              if (finished && !buttonVisible) setButtonMounted(false);
            }}
            className="mt-5"
          >
            <PillButton label="Let it out" onPress={onScaffoldSubmit} />
          </EaseView>
        )}
      </View>

      <IdleMenu />
    </View>
  );
};
