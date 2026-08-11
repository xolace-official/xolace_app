import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import {
  PressableFeedback,
  Separator,
  TagGroup,
  useThemeColor,
} from "heroui-native";
import { useNavigation, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";
import { IdleMenu } from "@/src/features/idle-menu/menu";
import { MicButton } from "@/src/features/reflect/components/mic-button";
import { QuietReturnHeader } from "@/src/features/reflect/components/quiet-return-header";
import { TextureSetTabs } from "@/src/features/reflect/components/texture-set-tabs";
import type {
  UserVariant,
  ReflectionAction,
} from "@/src/features/reflect/types";
import {
  playTypingBegin,
  playTextureSelect,
  playHomeEntrance,
  playSoftPress,
} from "@/src/lib/haptics";
import { useSessionMode } from "@/src/context/session-mode-context";
import { NIGHT_TEXTURE_WORDS } from "@/src/features/reflect/night-copy";
import type { QuietReturnTier } from "@/src/features/reflect/quiet-return-copy";
import {
  TEXTURE_SETS,
  resolveTextureSetId,
  type TextureSetId,
} from "@/src/features/reflect/texture-sets";
import { useAppStore } from "@/src/store/store";
import { posthog } from "@/src/config/posthog";
import { useReflectTour } from "@/src/features/reflect/hooks/use-reflect-tour";
import { TOUR_STEPS } from "@/src/features/reflect/tour-copy";
import { Tour } from "@/src/components/ui/tour";

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
const WORDS_FADE_OUT = { type: "timing" as const, duration: 150 };
const WORDS_FADE_IN = { type: "timing" as const, duration: 200 };

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
  const router = useRouter();
  const accentColor = useThemeColor("accent") as string;
  const insets = useSafeAreaInsets();
  const rawHeaderHeight = useHeaderHeight();

  const storedSetId = useAppStore((s) => s.textureSetId);
  const setTextureSetId = useAppStore((s) => s.setTextureSetId);
  const safeSetId = resolveTextureSetId(storedSetId);

  const pendingEventPrompt = useAppStore((s) => s.pendingEventPrompt);
  // Read the clock once at mount (lazy init keeps the call out of the render
  // body so React Compiler can still optimize this component). The prompt has a
  // multi-day expiry, so mount-time accuracy is sufficient.
  const [now] = useState(() => Date.now());
  const eventPromptActive =
    !!pendingEventPrompt && pendingEventPrompt.expiresAt > now;
  const activeEventPrompt = eventPromptActive ? pendingEventPrompt.text : null;
  const activeEventLabel = eventPromptActive
    ? (pendingEventPrompt.label ?? null)
    : null;

  const [wordsVisible, setWordsVisible] = useState(true);
  const [pendingSetId, setPendingSetId] = useState<TextureSetId>(safeSetId);
  const [resolvedSetId, setResolvedSetId] = useState<TextureSetId>(safeSetId);

  // Freeze the last known header height so it doesn't jump during transitions.
  // Adjusting state during render (not in an effect) is the supported pattern
  // for retaining a value seen on a previous render.
  const [stableHeaderHeight, setStableHeaderHeight] = useState(0);
  if (rawHeaderHeight > 0 && rawHeaderHeight !== stableHeaderHeight) {
    setStableHeaderHeight(rawHeaderHeight);
  }
  const headerExtraPadding = Math.max(0, stableHeaderHeight - insets.top);

  const todayQuotes = useQuery(api.dailyQuotes.getToday);
  const hasQuote = !!(todayQuotes?.session ?? todayQuotes?.curated);

  const TEXTURE_WORDS: readonly string[] = isNight
    ? NIGHT_TEXTURE_WORDS
    : (TEXTURE_SETS[resolvedSetId] ?? TEXTURE_SETS.flat);

  const activeQuietReturn = !isNight ? quietReturn : null;
  const hasPlayedEntrance = useRef(false);

  const selectedTextureKeys = new Set(selectedTextures);
  const containerStyle = { paddingTop: headerExtraPadding };
  const wordsFadeAnimate = { opacity: wordsVisible ? 1 : 0 };

  const { isActive: tourActive, finish, skip, trackStep } = useReflectTour();
  const setReflectTourSeen = useAppStore((s) => s.setReflectTourSeen);
  const navigation = useNavigation();

  // Dismiss tour if user navigates away (e.g. Help button in transparent header)
  useEffect(() => {
    const unsub = navigation.addListener("blur", () => {
      if (tourActive) skip();
    });
    return unsub;
  }, [navigation, tourActive, skip]);

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

  const handleSetChange = (id: TextureSetId) => {
    if (id === resolvedSetId) return;
    dispatch({ type: "CLEAR_TEXTURES" });
    setTextureSetId(id);
    setPendingSetId(id);
    setWordsVisible(false);
    playSoftPress();
    posthog.capture("texture_set_changed", { from: resolvedSetId, to: id });
  };

  const hasSelections = selectedTextures.length > 0;
  // Mount the button when selections appear and keep it mounted until its exit
  // animation finishes (onTransitionEnd). Visibility is derived directly from
  // hasSelections, so no effect-driven state sync is needed.
  const [buttonMounted, setButtonMounted] = useState(hasSelections);
  if (hasSelections && !buttonMounted) {
    setButtonMounted(true);
  }

  return (
    <Tour
      open={tourActive}
      onFinish={finish}
      onSkip={skip}
      onStepChange={trackStep}
    >
      <View className="flex-1 px-6" style={containerStyle}>
        <View className="pt-4 pb-4">
          <QuietReturnHeader
            variant={variant}
            isNight={isNight}
            activeQuietReturn={activeQuietReturn}
            eventPrompt={activeEventPrompt}
            eventLabel={activeEventLabel}
            spaceName={spaceName}
            className="pt-0 pb-0"
          />
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
            <Tour.Step
              order={1}
              title={TOUR_STEPS[1].title}
              description={TOUR_STEPS[1].description}
              className="self-start"
            >
              <AppText className="text-base text-foreground/30">
                Tap to begin writing or speaking...
              </AppText>
            </Tour.Step>
          </Pressable>

          <View className="absolute right-2 top-2">
            <Tour.Step
              order={2}
              title={TOUR_STEPS[2].title}
              description={TOUR_STEPS[2].description}
              shape="circle"
            >
              <MicButton
                size="md"
                isRecording={isRecording}
                onPress={onVoiceTap}
              />
            </Tour.Step>
          </View>
        </View>

        <View className="border-t border-foreground/5 pt-6 pb-8">
          <AppText className="mb-3 text-xs text-foreground/30">
            Or just tap what feels close:
          </AppText>

          {!isNight && (
            <Tour.Step
              order={4}
              title={TOUR_STEPS[4].title}
              description={TOUR_STEPS[4].description}
            >
              <TextureSetTabs
                activeSet={resolvedSetId}
                onSelect={handleSetChange}
                disabled={!wordsVisible}
              />
            </Tour.Step>
          )}

          <Tour.Step
            order={3}
            title={TOUR_STEPS[3].title}
            description={TOUR_STEPS[3].description}
          >
            <EaseView
              animate={wordsFadeAnimate}
              transition={wordsVisible ? WORDS_FADE_IN : WORDS_FADE_OUT}
              onTransitionEnd={({ finished }) => {
                if (finished && !wordsVisible) {
                  setResolvedSetId(pendingSetId);
                  setWordsVisible(true);
                }
              }}
            >
              <TagGroup
                key={resolvedSetId}
                selectionMode="multiple"
                size="sm"
                variant="surface"
                selectedKeys={selectedTextureKeys}
                onSelectionChange={handleSelectionChange}
                animation="disable-all"
              >
                <TagGroup.List className="flex-row flex-wrap gap-2 pr-14">
                  {TEXTURE_WORDS.map((word) => (
                    <TagGroup.Item
                      key={word}
                      id={word}
                      className="min-w-18 justify-center"
                    >
                      {({ isSelected }) => (
                        <TagGroup.ItemLabel
                          className={
                            isSelected ? "text-accent" : "text-foreground/80"
                          }
                        >
                          {word}
                        </TagGroup.ItemLabel>
                      )}
                    </TagGroup.Item>
                  ))}
                </TagGroup.List>
              </TagGroup>
            </EaseView>
          </Tour.Step>

          {buttonMounted && (
            <EaseView
              initialAnimate={BUTTON_INITIAL_ANIMATE}
              animate={
                hasSelections ? BUTTON_VISIBLE_ANIMATE : BUTTON_HIDDEN_ANIMATE
              }
              transition={
                hasSelections ? BUTTON_TRANSITION_IN : BUTTON_TRANSITION_OUT
              }
              onTransitionEnd={({ finished }) => {
                if (finished && !hasSelections) setButtonMounted(false);
              }}
              className="mt-5"
            >
              <PillButton label="Let it out" onPress={onScaffoldSubmit} />
            </EaseView>
          )}
        </View>

        <IdleMenu />

        {/* DEV ONLY — tap to restart tour for testing */}
        {__DEV__ && !tourActive && (
          <PressableFeedback
            onPress={() => setReflectTourSeen(false)}
            className="absolute bottom-5 right-4 p-3"
            hitSlop={8}
          >
            <AppText className="text-xs text-foreground/25">↺ tour</AppText>
          </PressableFeedback>
        )}
      </View>
    </Tour>
  );
};
