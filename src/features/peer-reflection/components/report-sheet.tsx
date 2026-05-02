import { View, Pressable } from "react-native";
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

export const ReportSheet = ({ isOpen, onClose, onSubmit }: Props) => {
  const handleSelect = (reason: ReportReason) => {
    onSubmit(reason);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={["40%"]}
          enableOverDrag={false}
          enableDynamicSizing={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/30"
        >
          <View style={{ gap: 4, paddingTop: 8, paddingBottom: 16 }}>
            <AppText
              style={{ fontSize: 13, paddingHorizontal: 20, paddingBottom: 8 }}
              className="text-foreground/40"
            >
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

            <View
              style={{
                height: 1,
                marginHorizontal: 20,
                marginVertical: 6,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            />

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
