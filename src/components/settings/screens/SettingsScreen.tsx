import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsRow } from "@/components/settings/settings-row";
import { ThemePickerDialog } from "@/components/settings/theme-picker-dialog";
import { useSettings } from "@/hooks/use-settings";
import type { ThemeMode } from "@/hooks/use-settings";

/**
 * Settings screen — composes all preference sections.
 *
 * Sections:
 *  • Account        — sign-in method
 *  • Appearance     — theme mode, reduced motion
 *  • Notifications  — gentle reminders
 *  • Reflection Pool — contribute anonymously
 *  • Your Data      — export, retention, delete
 *  • Log out
 */
export const SettingsScreen = () => {
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  const {
    signInMethod,
    themeDisplay,
    storedTheme,
    setThemeMode,
    reducedMotion,
    setReducedMotion,
    gentleReminders,
    setGentleReminders,
    contributeAnonymously,
    setContributeAnonymously,
    handleLogout,
    handleDeleteData,
  } = useSettings();

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
      >
        {/* ── ACCOUNT ─────────────────────────────────────────── */}
        <SettingsSection title="Account">
          <SettingsRow
            variant="value"
            label="Sign-in method"
            value={signInMethod}
            isLast
          />
        </SettingsSection>

        {/* ── APPEARANCE ──────────────────────────────────────── */}
        <SettingsSection title="Appearance">
          <SettingsRow
            variant="value"
            label="Theme"
            value={themeDisplay}
            onPress={() => setThemeDialogOpen(true)}
          />
          <SettingsRow
            variant="toggle"
            label="Reduced motion"
            isSelected={reducedMotion}
            onToggle={setReducedMotion}
            isLast
          />
        </SettingsSection>

        {/* ── NOTIFICATIONS ────────────────────────────────────── */}
        <SettingsSection title="Notifications">
          <SettingsRow
            variant="toggle"
            label="Gentle reminders"
            isSelected={gentleReminders}
            onToggle={setGentleReminders}
            isLast
          />
        </SettingsSection>

        {/* ── REFLECTION POOL ──────────────────────────────────── */}
        <SettingsSection title="Reflection Pool">
          <SettingsRow
            variant="toggle"
            label="Contribute anonymously"
            isSelected={contributeAnonymously}
            onToggle={setContributeAnonymously}
            isLast
          />
        </SettingsSection>

        {/* ── YOUR DATA ────────────────────────────────────────── */}
        <SettingsSection title="Your Data">
          <SettingsRow
            variant="chevron"
            label="Export my data"
            onPress={() => {
              // TODO: trigger data export flow
            }}
          />
          <SettingsRow
            variant="value"
            label="Retention"
            value="Indefinite"
            onPress={() => {
              // TODO: open retention picker
            }}
          />
          <SettingsRow
            variant="chevron"
            label="Delete all my data"
            danger
            onPress={handleDeleteData}
            isLast
          />
        </SettingsSection>

        {/* ── LOG OUT ──────────────────────────────────────────── */}
        <View className="px-5">
          <SettingsRow
            variant="action"
            label="Log out"
            danger
            onPress={handleLogout}
            isLast
          />
        </View>
      </ScrollView>

      {/* ── THEME PICKER DIALOG ──────────────────────────────── */}
      <ThemePickerDialog
        isOpen={themeDialogOpen}
        onOpenChange={setThemeDialogOpen}
        currentMode={(storedTheme ?? "system") as ThemeMode}
        onSelect={setThemeMode}
      />
    </>
  );
};
