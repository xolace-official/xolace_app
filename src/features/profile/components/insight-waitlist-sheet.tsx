import { View } from "react-native";
import { BottomSheet, PressableFeedback } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "../hooks/use-token-color";
import type { TeaserFeature } from "../hooks/use-insight-waitlist";

// Intent-only sheet (pre-billing). Deliberately NO price and NO "Subscribe"
// button — a fake purchase surface trips App Store 2.1 / 3.1.1. This is a
// "notify me" waitlist that measures desire only.
const COPY: Record<TeaserFeature, { title: string; body: string; joinedBody: string }> = {
  intensity_history: {
    title: "Your full arc is coming",
    body: "See your intensity across every week — not just this one — and how it shifts over time.",
    joinedBody: "We'll let you know the moment your full intensity arc is ready. No rush, no noise.",
  },
  words_language: {
    title: "Coming soon",
    body: "See every word that keeps finding you, and how often each one returns. The patterns you didn't notice.",
    joinedBody: "We'll let you know the moment your full word map is ready. No rush, no noise.",
  },
};

type Props = {
  isOpen: boolean;
  feature: TeaserFeature | null;
  joined: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function InsightWaitlistSheet({ isOpen, feature, joined, onConfirm, onClose }: Props) {
  const accent = useTokenColor("accent");
  const copy = feature ? COPY[feature] : null;

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
          enableDynamicSizing
          enableOverDrag={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/20"
        >
          <View className="px-6 pt-3 pb-10">
            {joined ? (
              <View className="items-center gap-3 py-4">
                <SymbolView name="checkmark.seal.fill" size={34} tintColor={accent} />
                <AppText className="font-serif text-xl text-foreground text-center">
                  You&apos;re on the list
                </AppText>
                <AppText className="text-sm font-light text-foreground/50 text-center leading-6">
                  {copy?.joinedBody ?? "We'll let you know the moment it's ready. No rush, no noise."}
                </AppText>
                <PressableFeedback
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="mt-3 self-stretch h-12 rounded-2xl items-center justify-center bg-surface border border-border/60"
                >
                  <AppText className="text-sm font-medium text-foreground/70">Close</AppText>
                </PressableFeedback>
              </View>
            ) : (
              <View className="gap-4">
                <AppText className="font-serif text-xl text-foreground">
                  {copy?.title ?? "These insights are coming"}
                </AppText>
                <AppText className="text-sm font-light text-foreground/50 leading-6">
                  {copy?.body ?? "Want to be first to see them?"}
                </AppText>

                <PressableFeedback
                  onPress={onConfirm}
                  accessibilityRole="button"
                  accessibilityLabel="Notify me when it's ready"
                  className="mt-2 h-14 rounded-2xl items-center justify-center bg-accent"
                >
                  <AppText className="text-base font-medium text-white">
                    Notify me when it&apos;s ready
                  </AppText>
                </PressableFeedback>

                <AppText className="text-[11px] font-light text-foreground/30 text-center">
                  No payment. We&apos;ll only nudge you once it exists.
                </AppText>
              </View>
            )}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
