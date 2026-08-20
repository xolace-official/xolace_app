import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import {
  Button,
  Chip,
  LinkButton,
  PressableFeedback,
  useThemeColor,
} from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import type { EntryType } from "@/src/features/reflect/types";
import type { Id } from "@/convex/_generated/dataModel";
import type { ClaimStrength } from "@/convex/ai/routing";
import {
  playMirrorArrival,
  playAffirmativePress,
} from "@/src/lib/haptics";
import { useMirrorAudio } from "@/src/features/reflect/hooks/use-mirror-audio";
import { ToneTipBanner } from "@/src/features/reflect/components/tone-tip-banner";
import type { MirrorTone } from "@/src/features/settings/components/mirror-tone-picker-dialog";
import { removeEmDash } from "@/src/features/quotes/utils/text-utils";

type Props = {
  mirror: string;
  selectedTextures: string[];
  entryType: EntryType;
  sessionId: Id<"sessions"> | null;
  toneUsed: MirrorTone | null;
  /** Derived server-side; "reaching"/"holding" means this mirror named a gap. */
  claimStrength: ClaimStrength | null;
  /** Refinement turns are exhausted — the row collapses to "That's it". */
  atCap: boolean;
  onThatsIt: () => void;
  onNotQuite: () => void;
  onSayMore: () => void;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL_FADE = { opacity: 0 };
const EASE_ANIMATE_FADE = { opacity: 1 };
const EASE_INITIAL_SLIDE = { opacity: 0, translateY: 20 };
const EASE_ANIMATE_SLIDE = { opacity: 1, translateY: 0 };
const EASE_TEXTURE_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  easing: EASING,
};
const EASE_LABEL_TRANSITION = {
  type: "timing" as const,
  duration: 600,
  easing: EASING,
};
// The 200/400/600 stagger runs top-down over the action row's hierarchy:
// That's it, then Say more, then Not quite. At the cap only the first renders,
// at the same delay as any other mirror — the wall is a fact of that mirror,
// not an event done to the user, so nothing animates out.
const EASE_THATSIT_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  delay: 200,
  easing: EASING,
};
const EASE_SAYMORE_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  delay: 400,
  easing: EASING,
};
const EASE_NOTQUITE_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  delay: 600,
  easing: EASING,
};
const AUDIO_ANIMATION = {
  scale: { ignoreScaleCoefficient: true, value: 0.85 },
};
const SPEAKER_PLAYING = {
  ios: "speaker.wave.2.fill",
  android: "volume_up",
  web: "volume_up",
} as const;
const SPEAKER_MUTED = {
  ios: "speaker.fill",
  android: "volume_off",
  web: "volume_off",
} as const;
const A11Y_SELECTED = { selected: true };
const A11Y_UNSELECTED = { selected: false };

export const MirrorState = ({
  mirror,
  selectedTextures,
  entryType,
  sessionId,
  toneUsed,
  claimStrength,
  atCap,
  onThatsIt,
  onNotQuite,
  onSayMore,
}: Props) => {
  const { isReady, isPlaying, toggle } = useMirrorAudio(sessionId);
  const accent = useThemeColor("accent");
  // The mirror named a gap in the input, so more input is the move that helps.
  const reached = claimStrength === "reaching" || claimStrength === "holding";
  const showToneBadge = toneUsed != null && toneUsed !== "adaptive";
  const toneLabel = toneUsed ? toneUsed.charAt(0).toUpperCase() + toneUsed.slice(1) : "";

  const TONE_BADGE: Partial<Record<string, { text: string; border: string }>> =
    {
      poetic: { text: "text-tone-poetic", border: "border-tone-poetic/40" },
      gentle: { text: "text-tone-gentle", border: "border-tone-gentle/40" },
      direct: { text: "text-tone-direct", border: "border-tone-direct/40" },
      witnessed: {
        text: "text-tone-witnessed",
        border: "border-tone-witnessed/40",
      },
    };
  const badgeStyle = (toneUsed ? TONE_BADGE[toneUsed] : undefined) ?? {
    text: "text-foreground/40",
    border: "border-foreground/20",
  };

  // No audio cleanup here: useAudioPlayer releases the native player on unmount,
  // which stops playback. Pausing it ourselves races that release and crashes
  // (see ba00535 "fix timeline crash").
  useEffect(() => {
    playMirrorArrival();
  }, []);

  const showTextures =
    selectedTextures.length > 0 &&
    (entryType === "scaffold" || entryType === "hybrid");

  const speakerName = isPlaying ? SPEAKER_PLAYING : SPEAKER_MUTED;

  return (
    <View className="flex-1 justify-center px-6">
      {/* Banner floats above content — absolute so it doesn't shift the mirror */}
      <View style={styles.bannerContainer}>
        <ToneTipBanner />
      </View>

      {/* Texture pills from scaffold */}
      {showTextures && (
        <EaseView
          initialAnimate={EASE_INITIAL_FADE}
          animate={EASE_ANIMATE_FADE}
          transition={EASE_TEXTURE_TRANSITION}
          className="mb-5 flex-row flex-wrap gap-1.5"
        >
          {selectedTextures.map((word) => (
            <Chip
              key={word}
              size="sm"
              variant="primary"
              color="accent"
              animation="disable-all"
            >
              <Chip.Label>{word}</Chip.Label>
            </Chip>
          ))}
        </EaseView>
      )}

      <EaseView
        initialAnimate={EASE_INITIAL_FADE}
        animate={EASE_ANIMATE_FADE}
        transition={EASE_LABEL_TRANSITION}
        className="mb-3 flex-row items-center gap-3"
      >
        <AppText className="text-xs uppercase tracking-widest text-accent">
          The Mirror
        </AppText>
        {isReady && (
          <PressableFeedback
            onPress={() => {
              toggle();
            }}
            animation={AUDIO_ANIMATION}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              isPlaying ? "Pause mirror audio" : "Play mirror audio"
            }
            accessibilityHint="Toggles playback of the mirror response"
            accessibilityState={isPlaying ? A11Y_SELECTED : A11Y_UNSELECTED}
          >
            <SymbolView name={speakerName} size={16} tintColor={accent} />
          </PressableFeedback>
        )}
      </EaseView>

      {showToneBadge && (
        <View className="mb-3 flex-row">
          <View
            className={`rounded-full border px-2.5 py-0.5 ${badgeStyle.border}`}
          >
            <AppText className={`text-xs ${badgeStyle.text}`}>
              {toneLabel}
            </AppText>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.mirrorScroll}
        showsVerticalScrollIndicator={false}
        className="border-l-2 border-accent/40 pl-4"
      >
        <AppText
          className="text-xl italic leading-8 text-foreground"
          selectable
        >
          {removeEmDash(mirror)}
        </AppText>
      </ScrollView>

      <View className="mt-14 gap-3">
        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_THATSIT_TRANSITION}
        >
          <Button
            onPress={() => {
              playAffirmativePress();
              onThatsIt();
            }}
            variant="primary"
            size="lg"
            className="w-full"
            accessibilityRole="button"
            accessibilityLabel="That's it"
          >
            <Button.Label className="font-semibold">
              That&apos;s it
            </Button.Label>
          </Button>
        </EaseView>

        {/* Never rendered at the cap: "Say more" there is an affordance whose
            only outcome is rejection. */}
        {!atCap && (
          <>
            <EaseView
              initialAnimate={EASE_INITIAL_SLIDE}
              animate={EASE_ANIMATE_SLIDE}
              transition={EASE_SAYMORE_TRANSITION}
            >
              <View>
                <PressableFeedback
                  onPress={onSayMore}
                  className="h-14 w-full flex-row items-center justify-center rounded-4xl border border-accent/60 px-5"
                  accessibilityRole="button"
                  accessibilityLabel="Say more"
                  accessibilityHint={
                    reached
                      ? "Recommended: add more so the mirror has something to work with"
                      : undefined
                  }
                >
                  <AppText className="text-lg font-medium text-accent">
                    Say more
                  </AppText>
                </PressableFeedback>
                {/* Sits ON the border, masking the line beneath it with the
                    ancestor's own token so it reads as part of the border.
                    Assumes the row is on --background (see doc §6). */}
                {reached && (
                  <View
                    pointerEvents="none"
                    className="absolute -top-2 right-6 rounded-full bg-background px-1.5"
                  >
                    <AppText className="text-[10px] uppercase tracking-widest text-accent">
                      Recommended
                    </AppText>
                  </View>
                )}
              </View>
            </EaseView>

            <EaseView
              initialAnimate={EASE_INITIAL_SLIDE}
              animate={EASE_ANIMATE_SLIDE}
              transition={EASE_NOTQUITE_TRANSITION}
            >
              <LinkButton onPress={onNotQuite} size="md" className="self-center">
                <LinkButton.Label className="text-foreground/55">
                  Not quite
                </LinkButton.Label>
              </LinkButton>
            </EaseView>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: "absolute",
    top: 8,
    left: 24,
    right: 24,
    zIndex: 1,
  },
  mirrorScroll: { flexGrow: 0, maxHeight: "60%" },
});
