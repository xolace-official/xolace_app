import { ScrollView, StyleSheet, View } from "react-native";
import { RadioGroup, Radio, Separator, useToast } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { SettingsRow } from "@/src/features/settings/components/settings-row";
import { ConfirmationDialog } from "@/src/components/shared/confirmation-dialog";
import { useDataSettings, type RetentionOption } from "@/src/features/settings/hooks/use-data-settings";
import { useConfirmAction } from "@/src/features/settings/hooks/use-confirm-action";
import {
  SHARE_ICON,
  RETENTION_ICON,
  DELETE_DATA_ICON,
  DELETE_ACCOUNT_ICON,
} from "@/src/features/settings/components/settings-icons";

const RETENTION_OPTIONS: { value: RetentionOption; label: string; description: string }[] = [
  { value: "indefinite", label: "Indefinite", description: "Keep my data until I delete it" },
  { value: "1_year", label: "1 year", description: "Auto-delete sessions older than 1 year" },
  { value: "6_months", label: "6 months", description: "Auto-delete sessions older than 6 months" },
];

const BRIDGE_ICON = {
  ios: "flame",
  android: "local_fire_department",
  web: "local_fire_department",
} as const;

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

const styles = StyleSheet.create({
  contentContainer: { paddingTop: 20, paddingBottom: 48 },
});

export const DataScreen = () => {
  const { toast } = useToast();
  const {
    contributeAnonymously,
    setContributeAnonymously,
    bridgeEnabled,
    setBridgeEnabled,
    retention,
    setRetention,
    performDeleteData,
    performDeleteAccount,
  } = useDataSettings();

  const mutedColor = useThemeColor("muted") as string;

  const settingIcon = (icon: React.ComponentProps<typeof SymbolView>["name"]) => (
    <SymbolView name={icon} size={17} tintColor={mutedColor} />
  );

  const { setConfirmAction, isConfirmLoading, activeConfig, handleConfirm } =
    useConfirmAction({
      performLogout: async () => {},
      performDeleteData,
      performDeleteAccount,
      toast,
    });

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ── SHARING ──────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280, easing: EASE }}
        >
          <SettingsSection title="Sharing">
            <SettingsRow
              variant="toggle"
              icon={settingIcon(SHARE_ICON)}
              label="Share by default"
              isSelected={contributeAnonymously}
              onToggle={setContributeAnonymously}
            />
            <SettingsRow
              variant="toggle"
              icon={settingIcon(BRIDGE_ICON)}
              label="Show bridge at session end"
              isSelected={bridgeEnabled}
              onToggle={setBridgeEnabled}
              isLast
            />
          </SettingsSection>
        </EaseView>

        {/* ── RETENTION ────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280, delay: 60, easing: EASE }}
        >
          <SettingsSection title="Retention">
            <RadioGroup
              value={retention}
              onValueChange={(v) => setRetention(v as RetentionOption)}
            >
              {RETENTION_OPTIONS.map((opt, index) => (
                <View key={opt.value}>
                  <RadioGroup.Item value={opt.value} className="px-5 py-4">
                    <View className="flex-1 gap-0.5 pr-3">
                      <AppText className="text-base font-medium text-foreground">
                        {opt.label}
                      </AppText>
                      <AppText className="text-sm text-foreground/50">
                        {opt.description}
                      </AppText>
                    </View>
                    <Radio />
                  </RadioGroup.Item>
                  {index < RETENTION_OPTIONS.length - 1 && (
                    <Separator className="mx-5" />
                  )}
                </View>
              ))}
            </RadioGroup>
          </SettingsSection>
        </EaseView>

        {/* ── DANGER ZONE ──────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280, delay: 120, easing: EASE }}
        >
          <SettingsSection title="Danger zone">
            <SettingsRow
              variant="chevron"
              icon={settingIcon(DELETE_DATA_ICON)}
              label="Delete all my data"
              danger
              onPress={() => setConfirmAction("deleteData")}
            />
            <SettingsRow
              variant="chevron"
              icon={settingIcon(DELETE_ACCOUNT_ICON)}
              label="Delete account"
              danger
              onPress={() => setConfirmAction("deleteAccount")}
              isLast
            />
          </SettingsSection>
        </EaseView>
      </ScrollView>

      <ConfirmationDialog
        isOpen={activeConfig !== null}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={activeConfig?.title ?? ""}
        description={activeConfig?.description ?? ""}
        confirmLabel={activeConfig?.confirmLabel ?? ""}
        onConfirm={handleConfirm}
        isDestructive={activeConfig?.isDestructive}
        isLoading={isConfirmLoading}
      />
    </>
  );
};
