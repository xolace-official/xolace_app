import { useRouter } from "expo-router";
import { PressableFeedback, Card, cn } from "heroui-native";
import { Presets } from "react-native-pulsar";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/shared/app-text";
import {
  getEmotionEmoji,
  getEmotionLabel,
  getPathLabel,
} from "@/src/features/timeline/emotions";
import type { TimelineEntry } from "@/src/features/timeline/types";

type Props = {
  entry: TimelineEntry;
  className?: string;
};

const styles = StyleSheet.create({
  continuousCurve: { borderCurve: "continuous" },
});

const PRESS_ANIMATION = { scale: { value: 0.98 } };

export const TimelineEntryCard = ({ entry, className }: Props) => {
  const router = useRouter();

  const handlePress = () => {
    Presets.ping();
    router.push({
      pathname: "/(protected)/timeline/session/[id]",
      params: { id: entry.id },
    });
  };

  const emoji = getEmotionEmoji(entry.granularLabel ?? entry.primaryEmotion);
  const emotionLabel = getEmotionLabel(
    entry.granularLabel ?? entry.primaryEmotion,
  );
  const pathLabel = getPathLabel(entry.pathChosen);

  return (
    <PressableFeedback
      onPress={handlePress}
      animation={PRESS_ANIMATION}
      className={cn("mx-5 mb-3", className)}
    >
      <Card
        variant="tertiary"
        className="rounded-2xl border border-foreground/10"
        style={styles.continuousCurve}
      >
        <Card.Body className="gap-4 px-3 py-3">
          <AppText
            className="text-base italic leading-7 text-foreground"
            numberOfLines={3}
          >
            &ldquo;{entry.mirrorText}&rdquo;
          </AppText>

          <View className="flex-row items-center gap-2">
            <AppText className="text-base">{emoji}</AppText>
            <AppText className="text-sm text-foreground/60">
              {emotionLabel}
            </AppText>
            <AppText className="text-sm text-foreground/25">&middot;</AppText>
            <AppText className="text-sm text-foreground/40">
              {pathLabel}
            </AppText>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
};
