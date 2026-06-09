import type { ReactNode } from "react";
import { View } from "react-native";
import { BottomSheet, Button, PressableFeedback, useThemeColor } from "heroui-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";

// ─── Frame ────────────────────────────────────────────────────────────────────

type FrameProps = {
  snapPoints: string[];
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

function FeedbackSheetFrame({ snapPoints, isOpen, onClose, children }: FrameProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={snapPoints}
          enableOverDrag={false}
          enableDynamicSizing={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/20"
        >
          <View className="px-6 pt-2 pb-10 gap-5">
            {children}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

type HeaderProps = {
  children: ReactNode;
  subtitle?: string;
};

function FeedbackSheetHeader({ children, subtitle }: HeaderProps) {
  return (
    <View>
      {typeof children === "string" ? (
        <AppText className="font-serif text-xl text-foreground mb-1">{children}</AppText>
      ) : (
        children
      )}
      {subtitle && (
        <AppText className="text-sm font-light text-foreground/40">{subtitle}</AppText>
      )}
    </View>
  );
}

// ─── Chips ────────────────────────────────────────────────────────────────────

type Chip = { key: string; label: string };

type ChipsProps = {
  chips: readonly Chip[];
  selected: string | null;
  onSelect: (key: string) => void;
};

function FeedbackSheetChips({ chips, selected, onSelect }: ChipsProps) {
  return (
    <View className="gap-3">
      {chips.map(({ key, label }) => (
        <PressableFeedback
          key={key}
          onPress={() => onSelect(key)}
          accessibilityRole="radio"
          accessibilityLabel={label}
          accessibilityState={{ selected: selected === key }}
          className={`w-full py-4 rounded-2xl border items-center ${
            selected === key
              ? "border-accent/40 bg-accent/10"
              : "border-border/60 bg-surface/40"
          }`}
        >
          <AppText
            className={`text-sm ${
              selected === key
                ? "font-medium text-accent"
                : "font-light text-foreground/70"
            }`}
          >
            {label}
          </AppText>
        </PressableFeedback>
      ))}
    </View>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
};

function FeedbackSheetInput({ value, onChangeText, placeholder, maxLength = 300 }: InputProps) {
  const foreground = useThemeColor("foreground") as string;
  return (
    <BottomSheetTextInput
      placeholder={placeholder ?? "Anything you want us to know?"}
      accessibilityLabel="Additional context"
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      placeholderTextColor={`${foreground}4D`}
      returnKeyType="done"
      style={{ fontSize: 14, color: foreground, paddingHorizontal: 4, paddingVertical: 8 }}
    />
  );
}

// ─── Submit ───────────────────────────────────────────────────────────────────

type SubmitProps = {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
};

function FeedbackSheetSubmit({ onPress, disabled = false, label = "Done" }: SubmitProps) {
  return (
    <Button
      onPress={onPress}
      isDisabled={disabled}
      accessibilityLabel={label}
      variant="ghost"
      size="sm"
      className="self-start rounded-xl bg-accent/10"
    >
      <Button.Label className="text-xs font-medium text-accent">{label}</Button.Label>
    </Button>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const FeedbackSheet = {
  Frame: FeedbackSheetFrame,
  Header: FeedbackSheetHeader,
  Chips: FeedbackSheetChips,
  Input: FeedbackSheetInput,
  Submit: FeedbackSheetSubmit,
};
