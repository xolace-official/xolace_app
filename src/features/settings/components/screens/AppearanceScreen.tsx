import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { RadioGroup, Radio, Separator } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { SettingsRow } from "@/src/features/settings/components/settings-row";
import { ThemePreviewCard } from "@/src/features/settings/components/theme-preview-card";
import { ConfirmationDialog } from "@/src/components/shared/confirmation-dialog";
import { FREE_THEMES } from "@/src/lib/themes";
import { useAppearanceSettings, type ThemeMode } from "@/src/features/settings/hooks/use-appearance-settings";
import { useAppStore } from "@/src/store/store";
import { Presets } from "react-native-pulsar";

const MODE_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: "system", label: "System", description: "Follows your device's appearance setting" },
  { value: "light", label: "Light", description: "Always use the light theme" },
  { value: "dark", label: "Dark", description: "Always use the dark theme" },
];

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

const styles = StyleSheet.create({
  contentContainer: { paddingTop: 16, paddingBottom: 48 },
  themeScrollerContent: { paddingHorizontal: 20, gap: 12 },
});

export const AppearanceScreen = () => {
  const {
    storedTheme,
    setThemeMode,
    colorThemeId,
    setColorTheme,
    reducedMotion,
    setReducedMotion,
    nightModeEnabled,
    setNightModeEnabled,
  } = useAppearanceSettings();

  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const [replayIntroOpen, setReplayIntroOpen] = useState(false);

  const handleFreeThemePress = (themeId: string) => {
    Presets.sonar();
    setColorTheme(themeId);
  };

  const handleNightModeToggle = (v: boolean) => {
    Presets.snap();
    setNightModeEnabled(v);
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ── MODE ─────────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280, easing: EASE }}
          className="mb-8"
        >
          <SettingsSection title="Mode">
            <RadioGroup
              value={storedTheme ?? "system"}
              onValueChange={(v) => setThemeMode(v as ThemeMode)}
            >
              {MODE_OPTIONS.map((opt, index) => (
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
                  {index < MODE_OPTIONS.length - 1 && (
                    <Separator className="mx-5" />
                  )}
                </View>
              ))}
            </RadioGroup>
          </SettingsSection>
        </EaseView>

        {/* ── COLOURS ──────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300, delay: 60, easing: EASE }}
          className="mb-8"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeScrollerContent}
          >
            {FREE_THEMES.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isActive={colorThemeId === theme.id}
                onPress={() => handleFreeThemePress(theme.id)}
              />
            ))}
          </ScrollView>
        </EaseView>

        {/* ── VISUAL ───────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280, delay: 120, easing: EASE }}
          className="mx-5 rounded-2xl bg-surface overflow-hidden mb-8"
        >
          <SettingsRow
            variant="toggle"
            label="Reduced motion"
            isSelected={reducedMotion}
            onToggle={setReducedMotion}
          />
          <Separator className="mx-5" />
          <SettingsRow
            variant="toggle"
            label="Night mode (10pm–4am)"
            isSelected={nightModeEnabled}
            onToggle={handleNightModeToggle}
          />
          <View className="px-5 pb-4">
            <AppText className="text-xs text-foreground/30 leading-5">
              Shifts the theme and words to match the rawer emotional register of
              late-night sessions.
            </AppText>
          </View>
        </EaseView>

        {/* ── GENERAL ──────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280, delay: 160, easing: EASE }}
        >
          <SettingsSection title="General">
            <SettingsRow
              variant="chevron"
              label="Replay intro"
              onPress={() => setReplayIntroOpen(true)}
              isLast
            />
          </SettingsSection>
        </EaseView>
      </ScrollView>

      <ConfirmationDialog
        isOpen={replayIntroOpen}
        onOpenChange={setReplayIntroOpen}
        title="Replay intro?"
        description="You'll be taken back to the opening screens."
        confirmLabel="Replay"
        onConfirm={() => {
          setReplayIntroOpen(false);
          setIntroSeen(false);
        }}
      />
    </>
  );
};
