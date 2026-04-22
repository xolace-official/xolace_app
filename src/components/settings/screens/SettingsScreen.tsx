import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native";
import { SettingsSection } from "@/src/components/settings/settings-section";
import { SettingsRow } from "@/src/components/settings/settings-row";
import { ThemePickerDialog } from "@/src/components/settings/theme-picker-dialog";
import { MirrorTonePickerDialog } from "@/src/components/settings/mirror-tone-picker-dialog";
import { RetentionPickerDialog } from "@/src/components/settings/retention-picker-dialog";
import { SpaceNameDialog } from "@/src/components/settings/space-name-dialog";
import { ConfirmationDialog } from "@/src/components/shared/confirmation-dialog";
import { useSettings } from "@/src/hooks/use-settings";
import { useConfirmAction } from "@/src/hooks/use-confirm-action";
import { useAppStore } from "@/src/store/store";
import type { ThemeMode } from "@/src/hooks/use-settings";

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
  const { toast } = useToast();
  const router = useRouter();
  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [mirrorToneDialogOpen, setMirrorToneDialogOpen] = useState(false);
  const [retentionDialogOpen, setRetentionDialogOpen] = useState(false);
  const [spaceNameDialogOpen, setSpaceNameDialogOpen] = useState(false);
  const [replayIntroOpen, setReplayIntroOpen] = useState(false);

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
    spaceName,
    setSpaceName,
    mirrorTone,
    mirrorToneDisplay,
    setMirrorTone,
    retention,
    retentionDisplay,
    setRetention,
    performLogout,
    performDeleteData,
    performDeleteAccount,
  } = useSettings();

  const {
    setConfirmAction,
    isConfirmLoading,
    activeConfig,
    handleConfirm,
  } = useConfirmAction({
    performLogout,
    performDeleteData,
    performDeleteAccount,
    toast,
  });

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
            label="Mode"
            value={themeDisplay}
            onPress={() => setThemeDialogOpen(true)}
          />
          <SettingsRow
            variant="chevron"
            label="Appearance"
            onPress={() => router.push('/(protected)/settings/appearance')}
          />
          <SettingsRow
            variant="toggle"
            label="Reduced motion"
            isSelected={reducedMotion}
            onToggle={setReducedMotion}
          />
          <SettingsRow
            variant="chevron"
            label="Replay intro"
            onPress={() => setReplayIntroOpen(true)}
            isLast
          />
        </SettingsSection>

        {/* ── MIRROR ─────────────────────────────────────────── */}
        <SettingsSection title="Mirror">
          <SettingsRow
            variant="value"
            label="Tone"
            value={mirrorToneDisplay}
            onPress={() => setMirrorToneDialogOpen(true)}
            isLast
          />
        </SettingsSection>

        {/* ── YOUR SPACE ──────────────────────────────────────── */}
        <SettingsSection title="Your space">
          <SettingsRow
            variant="value"
            label="Name"
            value={spaceName ?? "—"}
            onPress={() => setSpaceNameDialogOpen(true)}
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
            label="Share by default"
            isSelected={contributeAnonymously}
            onToggle={setContributeAnonymously}
            isLast
          />
        </SettingsSection>

        {/* ── YOUR DATA ────────────────────────────────────────── */}
        <SettingsSection title="Your Data">
          {/* TODO: export data flow not yet implemented */}
          {/* <SettingsRow
            variant="chevron"
            label="Export my data"
            onPress={() => {}}
          /> */}
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

      {/* ── MIRROR TONE PICKER DIALOG ────────────────────────── */}
      <MirrorTonePickerDialog
        isOpen={mirrorToneDialogOpen}
        onOpenChange={setMirrorToneDialogOpen}
        currentTone={mirrorTone}
        onSelect={setMirrorTone}
      />

      {/* ── SPACE NAME DIALOG ───────────────────────────────── */}
      <SpaceNameDialog
        isOpen={spaceNameDialogOpen}
        currentName={spaceName}
        onOpenChange={setSpaceNameDialogOpen}
        onSave={async (name) => { await setSpaceName(name); }}
        onClear={async () => { await setSpaceName(null); }}
      />

      {/* ── RETENTION PICKER DIALOG ─────────────────────────── */}
      <RetentionPickerDialog
        isOpen={retentionDialogOpen}
        onOpenChange={setRetentionDialogOpen}
        currentValue={retention}
        onSelect={setRetention}
      />

      {/* ── REPLAY INTRO DIALOG ──────────────────────────────── */}
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

      {/* ── CONFIRMATION DIALOG ──────────────────────────────── */}
      <ConfirmationDialog
        isOpen={activeConfig !== null}
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
