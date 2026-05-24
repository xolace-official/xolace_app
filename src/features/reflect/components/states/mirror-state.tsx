import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import {
  Chip,
  LinkButton,
  PressableFeedback,
  useThemeColor,
} from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import type { EntryType } from "@/src/features/reflect/types";
import type { Id } from "@/convex/_generated/dataModel";
import {
  playMirrorArrival,
  playAffirmativePress,
} from "@/src/lib/haptics";
import { useMirrorAudio } from "@/src/features/reflect/hooks/use-mirror-audio";
import { useSettings } from "@/src/features/settings/hooks/use-settings";
import { ToneTipBanner } from "@/src/features/reflect/components/tone-tip-banner";
import { removeEmDash } from "@/src/features/quotes/utils/text-utils";

type Props = {
  mirror: string;
  selectedTextures: string[];
  entryType: EntryType;
  sessionId: Id<"sessions"> | null;
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
const EASE_THATSIT_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  delay: 200,
  easing: EASING,
};
const EASE_NOTQUITE_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  delay: 400,
  easing: EASING,
};
const EASE_SAYMORE_TRANSITION = {
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
  onThatsIt,
  onNotQuite,
  onSayMore,
}: Props) => {
  const { isReady, isPlaying, toggle, stop } = useMirrorAudio(sessionId);
  const accent = useThemeColor("accent");
  const { mirrorTone } = useSettings();
  const showToneBadge = mirrorTone !== "adaptive";
  const toneLabel = mirrorTone.charAt(0).toUpperCase() + mirrorTone.slice(1);

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
  const badgeStyle = TONE_BADGE[mirrorTone] ?? {
    text: "text-foreground/40",
    border: "border-foreground/20",
  };

  useEffect(() => {
    playMirrorArrival();
    return () => {
      stop();
    };
  }, [stop]);

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

      <View className="mt-14 gap-6">
        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_THATSIT_TRANSITION}
        >
          <LinkButton
            onPress={() => {
              playAffirmativePress();
              onThatsIt();
            }}
            size="lg"
            className="self-start"
          >
            <LinkButton.Label className="font-semibold text-accent">
              That&apos;s it
            </LinkButton.Label>
          </LinkButton>
        </EaseView>

        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_NOTQUITE_TRANSITION}
        >
          <LinkButton
            onPress={onNotQuite}
            size="md"
            className="self-start"
          >
            <LinkButton.Label className="text-foreground/50">
              Not quite
            </LinkButton.Label>
          </LinkButton>
        </EaseView>

        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_SAYMORE_TRANSITION}
        >
          <LinkButton
            onPress={onSayMore}
            size="md"
            className="self-start"
          >
            <LinkButton.Label className="text-foreground/50">
              Say more
            </LinkButton.Label>
          </LinkButton>
        </EaseView>
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
