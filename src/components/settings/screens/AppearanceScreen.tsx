import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useToast } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { SettingsRow } from '@/src/components/settings/settings-row';
import { ThemePreviewCard } from '@/src/components/settings/theme-preview-card';
import { FREE_THEMES, PREMIUM_THEMES } from '@/src/constants/themes';
import { useSettings } from '@/src/hooks/use-settings';
import { useAppStore } from '@/src/store/store';
import { playSoftPress } from '@/src/lib/haptics';

/**
 * Appearance settings screen.
 *
 * Sections:
 *  • Free themes — live preview cards (default, lavender, mint, sky)
 *  • The Mirror  — premium-locked preview cards (ember, moss, ink)
 *  • Night mode  — 3am Mode toggle (10pm–4am)
 */
export const AppearanceScreen = () => {
  const { toast } = useToast();
  const { colorThemeId, setColorTheme } = useSettings();
  const nightModeEnabled = useAppStore((s) => s.nightModeEnabled);
  const setNightModeEnabled = useAppStore((s) => s.setNightModeEnabled);

  const handleFreeThemePress = (themeId: string) => {
    playSoftPress();
    setColorTheme(themeId);
  };

  const handlePremiumThemePress = () => {
    toast.show({
      label: 'Coming soon',
      description: 'Premium themes are part of The Mirror, launching soon.',
      variant: 'default',
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
    >
      {/* ── FREE THEMES ─────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(300)} className="mb-8">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
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
      </Animated.View>

      {/* ── THE MIRROR (premium) ─────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(80).duration(300)} className="mb-8">
        {/* Section header */}
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
      </Animated.View>

      {/* ── NIGHT MODE ───────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(160).duration(300)}
        className="mx-5 rounded-2xl bg-surface overflow-hidden"
      >
        <SettingsRow
          variant="toggle"
          label="Night mode (10pm–4am)"
          isSelected={nightModeEnabled}
          onToggle={setNightModeEnabled}
          isLast
        />
        <View className="px-5 pb-4">
          <AppText className="text-xs text-foreground/30 leading-5">
            Shifts the palette and copy to match the rawer emotional register of late-night sessions.
          </AppText>
        </View>
      </Animated.View>
    </ScrollView>
  );
};
