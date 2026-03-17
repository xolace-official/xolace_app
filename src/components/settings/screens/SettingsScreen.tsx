import { useState, useCallback } from "react";
import { ScrollView, View } from "react-native";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsRow } from "@/components/settings/settings-row";
import { ThemePickerDialog } from "@/components/settings/theme-picker-dialog";
import { RetentionPickerDialog } from "@/components/settings/retention-picker-dialog";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useSettings } from "@/hooks/use-settings";
import type { ThemeMode } from "@/hooks/use-settings";

type ConfirmAction = "logout" | "deleteData" | "deleteAccount" | null;

const CONFIRM_CONFIG = {
  logout: {
    title: "Log out",
    description: "Are you sure you want to log out?",
    confirmLabel: "Log out",
    isDestructive: true,
    showLoading: false,
  },
  deleteData: {
    title: "Delete all my data",
    description:
      "This will permanently erase all your sessions, reflections, and emotional history. Your account and preferences will be kept. This action cannot be undone.",
    confirmLabel: "Delete everything",
    isDestructive: true,
    showLoading: true,
  },
  deleteAccount: {
    title: "Delete account",
    description:
      "This will permanently delete your account and all associated data. This action cannot be undone.",
    confirmLabel: "Delete account",
    isDestructive: true,
    showLoading: true,
  },
} as const;

/**
 * Settings screen — composes all preference sections.
 *
 * Sections:
 *  • Account        — sign-in method
 *  • Appearance     — theme mode, reduced motion
 *  • Notifications  — gentle reminders
 *  • Reflection Pool — contribute anonymously
 *  • Your Data      — export, retention, delete data, delete account
 *  • Log out
 */
export const SettingsScreen = () => {
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [retentionDialogOpen, setRetentionDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

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
    retention,
    retentionDisplay,
    setRetention,
    performLogout,
    performDeleteData,
    performDeleteAccount,
  } = useSettings();

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;

    const actions: Record<NonNullable<ConfirmAction>, () => Promise<void>> = {
      logout: performLogout,
      deleteData: performDeleteData,
      deleteAccount: performDeleteAccount,
    };

    const config = CONFIRM_CONFIG[confirmAction];

    if (config.showLoading) {
      setIsConfirmLoading(true);
      try {
        await actions[confirmAction]();
      } finally {
        setIsConfirmLoading(false);
      }
    } else {
      await actions[confirmAction]();
    }

    setConfirmAction(null);
  }, [confirmAction, performLogout, performDeleteData, performDeleteAccount]);

  const activeConfig = confirmAction ? CONFIRM_CONFIG[confirmAction] : null;

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
            value={retentionDisplay}
            onPress={() => setRetentionDialogOpen(true)}
          />
          <SettingsRow
            variant="chevron"
            label="Delete all my data"
            danger
            onPress={() => setConfirmAction("deleteData")}
          />
          <SettingsRow
            variant="chevron"
            label="Delete account"
            danger
            onPress={() => setConfirmAction("deleteAccount")}
            isLast
          />
        </SettingsSection>

        {/* ── LOG OUT ──────────────────────────────────────────── */}
        <View className="px-5">
          <SettingsRow
            variant="action"
            label="Log out"
            danger
            onPress={() => setConfirmAction("logout")}
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

      {/* ── RETENTION PICKER DIALOG ─────────────────────────── */}
      <RetentionPickerDialog
        isOpen={retentionDialogOpen}
        onOpenChange={setRetentionDialogOpen}
        currentValue={retention}
        onSelect={setRetention}
      />

      {/* ── CONFIRMATION DIALOG ──────────────────────────────── */}
      <ConfirmationDialog
        isOpen={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
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
