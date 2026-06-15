import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { RadioGroup, Separator } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { cn } from "@/src/lib/utils";
import { AppText } from "@/src/components/shared/app-text";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { SettingsRow } from "@/src/features/settings/components/settings-row";
import { RadioIconIndicator } from "@/src/features/settings/components/radio-icon-indicator";
import type { CrossPlatformSymbol } from "@/src/features/settings/components/settings-icons";
import { ThemePreviewCard } from "@/src/features/settings/components/theme-preview-card";
import { ConfirmationDialog } from "@/src/components/shared/confirmation-dialog";
import { FREE_THEMES } from "@/src/lib/themes";
import { useAppearanceSettings, type ThemeMode } from "@/src/features/settings/hooks/use-appearance-settings";
import { useAppStore } from "@/src/store/store";
import { Presets } from "react-native-pulsar";

const MODE_OPTIONS: {
  value: ThemeMode;
  label: string;
  description: string;
  symbol: CrossPlatformSymbol;
}[] = [
  {
    value: "system",
    label: "System",
    description: "Follows your device's appearance setting",
    symbol: { ios: "gearshape", android: "settings", web: "settings" },
  },
  {
    value: "light",
    label: "Light",
    description: "Always use the light theme",
    symbol: { ios: "sun.max", android: "light_mode", web: "light_mode" },
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark theme",
    symbol: { ios: "moon", android: "dark_mode", web: "dark_mode" },
  },
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
            <View className="px-5 gap-2">
              <RadioGroup
                value={storedTheme ?? "system"}
                onValueChange={(v) => setThemeMode(v as ThemeMode)}
                className="gap-2"
              >
                {MODE_OPTIONS.map((opt) => (
                  <RadioGroup.Item key={opt.value} value={opt.value}>
                    {({ isSelected }) => (
                      <View
                        className={cn(
                          "flex-row items-center gap-4 px-4 py-4 rounded-2xl",
                          isSelected ? "bg-surface" : "bg-surface/30",
                        )}
                      >
                        <RadioIconIndicator
                          symbol={opt.symbol}
                          isSelected={isSelected}
                        />
                        <View className="flex-1 gap-0.5">
                          <AppText className="text-base font-medium text-foreground">
                            {opt.label}
                          </AppText>
                          <AppText className="text-sm text-foreground/50">
                            {opt.description}
                          </AppText>
                        </View>
                      </View>
                    )}
                  </RadioGroup.Item>
                ))}
              </RadioGroup>
            </View>
          </SettingsSection>
        </EaseView>

        {/* ── THEMES ──────────────────────────────────────────── */}
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300, delay: 60, easing: EASE }}
          className="mb-8"
        >
          <AppText className="text-xs font-semibold tracking-widest text-accent uppercase px-5 pb-3">
            App Themes
          </AppText>
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
