import { View, Pressable, StyleSheet } from "react-native";
import { BottomSheet } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";

type ReportReason = "offensive" | "self_harm" | "spam" | "other";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
};

const REASONS: { label: string; value: ReportReason }[] = [
  { label: "Offensive or hateful", value: "offensive" },
  { label: "Self-harm or crisis content", value: "self_harm" },
  { label: "Spam or off-topic", value: "spam" },
  { label: "Something else", value: "other" },
];

const SNAP_POINTS = ["40%"];

export const ReportSheet = ({ isOpen, onClose, onSubmit }: Props) => {
  const handleSelect = (reason: ReportReason) => {
    onSubmit(reason);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={SNAP_POINTS}
          enableOverDrag={false}
          enableDynamicSizing={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/30"
        >
          <View style={styles.container}>
            <AppText style={styles.prompt} className="text-foreground/40">
              Why are you reporting this?
            </AppText>

            {REASONS.map(({ label, value }) => (
              <Pressable
                key={value}
                onPress={() => handleSelect(value)}
                style={({ pressed }) => ({
                  paddingVertical: 13,
                  paddingHorizontal: 20,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <AppText className="text-base text-foreground">{label}</AppText>
              </Pressable>
            ))}

            <View className="h-px mx-5 my-1.5 bg-foreground/10" />

            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                paddingVertical: 13,
                paddingHorizontal: 20,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <AppText className="text-base text-foreground/40">Cancel</AppText>
            </Pressable>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingTop: 8,
    paddingBottom: 16,
  },
  prompt: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
