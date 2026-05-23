import { ScrollView, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { SettingsRow } from "@/src/features/settings/components/settings-row";
import { ThemePreviewCard } from "@/src/features/settings/components/theme-preview-card";
import { FREE_THEMES } from "@/src/lib/themes";
import { useSettings } from "@/src/features/settings/hooks/use-settings";
import { useAppStore } from "@/src/store/store";
import { Presets } from "react-native-pulsar";

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const INITIAL_REVEAL = { opacity: 0, translateY: 20 };
const FINAL_REVEAL = { opacity: 1, translateY: 0 };
const FREE_THEMES_TRANSITION = {
  type: "timing",
  duration: 300,
  easing: EASE,
} as const;
const NIGHT_MODE_TRANSITION = {
  type: "timing",
  duration: 300,
  delay: 160,
  easing: EASE,
} as const;

const styles = StyleSheet.create({
  contentContainer: { paddingTop: 16, paddingBottom: 48 },
  themeScrollerContent: { paddingHorizontal: 20, gap: 12 },
});

/**
 * Appearance settings screen.
 *
 * Sections:
 *  • Free themes — live preview cards (default, lavender, mint, sky)
 *  • The Mirror  — premium-locked preview cards (ember, moss, ink)
 *  • Night mode  — 3am Mode toggle (10pm–4am)
 */
export const AppearanceScreen = () => {
  const { colorThemeId, setColorTheme } = useSettings();
  const nightModeEnabled = useAppStore((s) => s.nightModeEnabled);
  const setNightModeEnabled = useAppStore((s) => s.setNightModeEnabled);

  const handleFreeThemePress = (themeId: string) => {
    Presets.sonar();
    setColorTheme(themeId);
  };

  const handleNightModeToggle = (v: boolean) => {
    Presets.snap();
    setNightModeEnabled(v);
  };

  // const handlePremiumThemePress = () => {
  //   toast.show({
  //     label: 'Coming soon',
  //     description: 'Premium themes are part of The Mirror, launching soon.',
  //     variant: 'default',
  //   });
  // };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* ── FREE THEMES ─────────────────────────────────────────── */}
      <EaseView
        initialAnimate={INITIAL_REVEAL}
        animate={FINAL_REVEAL}
        transition={FREE_THEMES_TRANSITION}
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

      {/* ── THE MIRROR (premium) ─────────────────────────────────── */}
      {/*<Animated.View entering={FadeInDown.delay(80).duration(300)} className="mb-8">
         Section header
        <View className="flex-row items-center gap-2 px-5 mb-4">
          <AppText className="text-sm font-semibold text-foreground/80">
            The Mirror
          </AppText>
          <View className="rounded-full bg-accent/15 px-2 py-0.5">
            <AppText className="text-xs text-accent/80">Premium</AppText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          {PREMIUM_THEMES.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isActive={false}
              onPress={handlePremiumThemePress}
            />
          ))}
        </ScrollView>
      </Animated.View>*/}

      {/* ── NIGHT MODE ───────────────────────────────────────────── */}
      <EaseView
        initialAnimate={INITIAL_REVEAL}
        animate={FINAL_REVEAL}
        transition={NIGHT_MODE_TRANSITION}
        className="mx-5 rounded-2xl bg-surface overflow-hidden"
      >
        <SettingsRow
          variant="toggle"
          label="Night mode (10pm–4am)"
          isSelected={nightModeEnabled}
          onToggle={handleNightModeToggle}
          isLast
        />
        <View className="px-5 pb-4">
          <AppText className="text-xs text-foreground/30 leading-5">
            Shifts the theme and words to match the rawer emotional register of
            late-night sessions.
          </AppText>
        </View>
      </EaseView>
    </ScrollView>
  );
};
