import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import {
  PressableFeedback,
  Separator,
  TagGroup,
  useThemeColor,
} from "heroui-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";
import { IdleMenu } from "@/src/features/idle-menu/menu";
import { MicButton } from "@/src/features/reflect/components/mic-button";
import { QuietReturnHeader } from "@/src/features/reflect/components/quiet-return-header";
import type {
  UserVariant,
  ReflectionAction,
} from "@/src/features/reflect/types";
import {
  playTypingBegin,
  playTextureSelect,
  playHomeEntrance,
} from "@/src/lib/haptics";
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

const HELP_ICON_NAME = {
  ios: "lifepreserver",
  android: "sos",
  web: "sos",
} as const;
const QUOTE_ICON_NAME = { ios: "sparkles", android: "auto_awesome" } as const;
const BUTTON_INITIAL_ANIMATE = { opacity: 0, translateY: 20 } as const;
const BUTTON_VISIBLE_ANIMATE = { opacity: 1, translateY: 0 } as const;
const BUTTON_HIDDEN_ANIMATE = { opacity: 0, translateY: 20 } as const;
const BUTTON_EASING: [number, number, number, number] = [
  0.455, 0.03, 0.515, 0.955,
];
const BUTTON_TRANSITION_IN = {
  type: "timing" as const,
  duration: 300,
  easing: BUTTON_EASING,
};
const BUTTON_TRANSITION_OUT = {
  type: "timing" as const,
  duration: 200,
  easing: BUTTON_EASING,
};

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
  onCrisisTap: () => void;
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
  onCrisisTap,
}: Props) => {
  const { isNight } = useSessionMode();
  const router = useRouter();
  const warningColor = useThemeColor("warning") as string;
  const accentColor = useThemeColor("accent") as string;

  const todayQuotes = useQuery(api.dailyQuotes.getToday);
  const hasQuote = !!(todayQuotes?.session ?? todayQuotes?.curated);
  const TEXTURE_WORDS: readonly string[] = isNight
    ? NIGHT_TEXTURE_WORDS
    : DAY_TEXTURE_WORDS;

  const activeQuietReturn = !isNight ? quietReturn : null;
  const hasPlayedEntrance = useRef(false);

  const selectedTextureKeys = useMemo(
    () => new Set(selectedTextures),
    [selectedTextures],
  );

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
      <View className="flex-row items-start justify-between pt-5 pb-4">
        <QuietReturnHeader
          variant={variant}
          isNight={isNight}
          activeQuietReturn={activeQuietReturn}
          spaceName={spaceName}
          className="flex-1 pt-0 pb-0"
        />
        <PressableFeedback
          onPress={onCrisisTap}
          accessibilityLabel="Open crisis resources"
          hitSlop={8}
        >
          <View className="bg-warning/10 border border-warning/20 rounded-full px-3 py-1.5 flex-row items-center gap-1.5">
            <SymbolView
              name={HELP_ICON_NAME}
              size={16}
              tintColor={warningColor}
            />
            <AppText className="text-xs text-warning">Help</AppText>
          </View>
        </PressableFeedback>
      </View>

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
            <SymbolView
              name={QUOTE_ICON_NAME}
              size={11}
              tintColor={accentColor}
            />
            <AppText className="text-xs font-medium text-accent/80">
              A word for today
            </AppText>
          </View>
        </PressableFeedback>
      )}

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
          selectedKeys={selectedTextureKeys}
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

        {buttonMounted && (
          <EaseView
            initialAnimate={BUTTON_INITIAL_ANIMATE}
            animate={
              buttonVisible ? BUTTON_VISIBLE_ANIMATE : BUTTON_HIDDEN_ANIMATE
            }
            transition={
              buttonVisible ? BUTTON_TRANSITION_IN : BUTTON_TRANSITION_OUT
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
