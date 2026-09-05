import { PressableFeedback } from "heroui-native";
import { View } from "react-native";
import { Presets } from "react-native-pulsar";
import { AppText } from "@/src/components/shared/app-text";

/**
 * The deck: the poster's second sheet, on the fixed palette rather than themed
 * chrome. Rendered as themed chrome the lower block goes near-black on `dark`
 * and leaves the hero an isolated lit rectangle; as a card the two read as one
 * printed set, with theme chrome shrunk to the ~10pt gutter and the 12pt gap
 * between them (#305).
 *
 * The composer lands here in the reply ticket — for now the deck carries the
 * one control.
 */
export function DeckCard({ onOpenArchive }: { onOpenArchive: () => void }) {
  return (
    // mt-0.5, not mt-3: RN margins do not collapse, and the hero already ends
    // in 10pt of its own — 2 more is what makes the gap 12.
    <View className="mx-2.5 mt-0.5 mb-6 rounded-[28px] bg-poster-deck p-4">
      <PressableFeedback
        onPress={() => {
          Presets.flick();
          onOpenArchive();
        }}
        accessibilityRole="button"
        accessibilityLabel="See old quotes"
      >
        <AppText className="px-1 pb-1 font-poster-display text-[22px] text-poster-ink">
          SEE OLD QUOTES
        </AppText>
      </PressableFeedback>
    </View>
  );
}
