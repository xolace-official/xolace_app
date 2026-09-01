import { useState } from "react";
import { View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { TagGroup } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";
import { TextureSetTabs } from "@/src/features/reflect/components/texture-set-tabs";
import { Tour } from "@/src/components/ui/tour";
import { TOUR_STEPS } from "@/src/features/reflect/tour-copy";
import { NIGHT_TEXTURE_WORDS } from "@/src/features/reflect/night-copy";
import {
  TEXTURE_SETS,
  resolveTextureSetId,
  type TextureSetId,
} from "@/src/features/reflect/texture-sets";
import type { ReflectionAction } from "@/src/features/reflect/types";
import { playSoftPress, playTextureSelect } from "@/src/lib/haptics";
import { posthog } from "@/src/config/posthog";
import { useAppStore } from "@/src/store/store";

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
  isNight: boolean;
  selectedTextures: string[];
  dispatch: React.Dispatch<ReflectionAction>;
  onScaffoldSubmit: () => void;
};

/**
 * The easier way in: tap the words that fit instead of writing.
 *
 * Lifted out of the old idle screen unchanged (#256) — the compose screen
 * translates and fades it as the card expands, and its redesign is a separate
 * pass.
 */
export const TextureBand = ({
  isNight,
  selectedTextures,
  dispatch,
  onScaffoldSubmit,
}: Props) => {
  const storedSetId = useAppStore((s) => s.textureSetId);
  const setTextureSetId = useAppStore((s) => s.setTextureSetId);
  const safeSetId = resolveTextureSetId(storedSetId);

  const [wordsVisible, setWordsVisible] = useState(true);
  const [pendingSetId, setPendingSetId] = useState<TextureSetId>(safeSetId);
  const [resolvedSetId, setResolvedSetId] = useState<TextureSetId>(safeSetId);

  const TEXTURE_WORDS: readonly string[] = isNight
    ? NIGHT_TEXTURE_WORDS
    : (TEXTURE_SETS[resolvedSetId] ?? TEXTURE_SETS.flat);

  const selectedTextureKeys = new Set(selectedTextures);
  const wordsFadeAnimate = { opacity: wordsVisible ? 1 : 0 };

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
    <View className="border-t border-foreground/5 px-6 pt-6 pb-8">
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
          animate={hasSelections ? BUTTON_VISIBLE_ANIMATE : BUTTON_HIDDEN_ANIMATE}
          transition={hasSelections ? BUTTON_TRANSITION_IN : BUTTON_TRANSITION_OUT}
          onTransitionEnd={({ finished }) => {
            if (finished && !hasSelections) setButtonMounted(false);
          }}
          className="mt-5"
        >
          <PillButton label="Let it out" onPress={onScaffoldSubmit} />
        </EaseView>
      )}
    </View>
  );
};
