import { useState } from "react";
import { View } from "react-native";
import { Button } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import {
  LegalBottomSheet,
} from "@/src/features/auth/components/legal-bottom-sheet";
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  type LegalDocument,
} from "@/src/features/auth/components/legal-content";

type Props = {
  label: string;
  onPress: () => void;
  isDisabled: boolean;
};

/**
 * Sticky bottom CTA block — primary button, renewal legal line, and
 * Terms/Privacy links that reuse the existing LegalBottomSheet (same
 * pattern as the auth screen's LegalLinks) instead of duplicating copy.
 */
export function PaywallCta({ label, onPress, isDisabled }: Props) {
  const [activeDocument, setActiveDocument] = useState<LegalDocument | null>(null);

  return (
    <View className="gap-4">
      <Button
        onPress={onPress}
        isDisabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        variant="primary"
        size="lg"
        className="w-full rounded-2xl"
      >
        <Button.Label className="text-base font-medium">{label}</Button.Label>
      </Button>

      <AppText className="text-[11px] text-muted text-center leading-4">
        Renews automatically. Cancel anytime in your store settings.
      </AppText>

      <View className="flex-row items-center justify-center gap-5">
        <AppText
          className="text-[12px] text-muted underline"
          onPress={() => setActiveDocument(TERMS_OF_SERVICE)}
        >
          Terms of Service
        </AppText>
        <AppText
          className="text-[12px] text-muted underline"
          onPress={() => setActiveDocument(PRIVACY_POLICY)}
        >
          Privacy Policy
        </AppText>
      </View>

      <LegalBottomSheet document={activeDocument} onClose={() => setActiveDocument(null)} />
    </View>
  );
}
