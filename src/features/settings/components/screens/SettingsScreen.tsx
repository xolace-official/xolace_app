import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useToast, useThemeColor } from "heroui-native";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { SettingsRow } from "@/src/features/settings/components/settings-row";
import { ThemePickerDialog } from "@/src/features/settings/components/theme-picker-dialog";
import { MirrorTonePickerDialog } from "@/src/features/settings/components/mirror-tone-picker-dialog";
import { RetentionPickerDialog } from "@/src/features/settings/components/retention-picker-dialog";
import { SpaceNameDialog } from "@/src/features/settings/components/space-name-dialog";
import { ReachSelectorDialog } from "@/src/features/settings/components/reach-selector-dialog";
import { QuietWindowDialog } from "@/src/features/settings/components/quiet-window-dialog";
import { FeedbackDialog } from "@/src/features/settings/components/feedback-dialog";
import { EnjoyingXolaceSection } from "@/src/features/settings/components/enjoying-xolace-section";
import { FollowUsSection } from "@/src/features/settings/components/follow-us-section";
import { DevToolsSection } from "@/src/features/settings/components/dev-tools-section";
import { ConfirmationDialog } from "@/src/components/shared/confirmation-dialog";
import { useSettings } from "@/src/features/settings/hooks/use-settings";
import { useConfirmAction } from "@/src/features/settings/hooks/use-confirm-action";
import { useAppStore } from "@/src/store/store";
import { AppleIcon } from "@/src/features/auth/components/apple-icon";
import { GoogleIcon } from "@/src/features/auth/components/google-icon";
import type { ThemeMode } from "@/src/features/settings/hooks/use-settings";
import {
  type CrossPlatformSymbol,
  ACCOUNT_ICON,
  SPACE_NAME_ICON,
  MODE_ICON,
  APPEARANCE_ICON,
  MOTION_ICON,
  REPLAY_ICON,
  MIRROR_ICON,
  NOTIFICATIONS_ICON,
  REACH_ICON,
  QUIET_HOURS_ICON,
  SHARE_ICON,
  FEEDBACK_ICON,
  RETENTION_ICON,
  DELETE_DATA_ICON,
  DELETE_ACCOUNT_ICON,
  LOG_OUT_ICON,
  EMAIL_ICON,
} from "@/src/features/settings/components/settings-icons";

const styles = StyleSheet.create({
  contentContainer: { paddingTop: 20, paddingBottom: 48 },
});

/**
 * Settings screen — composes all preference sections.
 *
 */
export const SettingsScreen = () => {
  const { toast } = useToast();
  const router = useRouter();
  const iconColor = useThemeColor("foreground") as string;
  const mutedIconColor = useThemeColor("muted") as string;
  const setIntroSeen = useAppStore((s) => s.setIntroSeen);
  const bridgeEnabled = useAppStore((s) => s.bridgeEnabled);
  const setBridgeEnabled = useAppStore((s) => s.setBridgeEnabled);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [mirrorToneDialogOpen, setMirrorToneDialogOpen] = useState(false);
  const [retentionDialogOpen, setRetentionDialogOpen] = useState(false);
  const [spaceNameDialogOpen, setSpaceNameDialogOpen] = useState(false);
  const [reachDialogOpen, setReachDialogOpen] = useState(false);
  const [quietWindowDialogOpen, setQuietWindowDialogOpen] = useState(false);
  const [replayIntroOpen, setReplayIntroOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

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
    reach,
    setReach,
    quietWindow,
    setQuietWindow,
    performLogout,
    performDeleteData,
    performDeleteAccount,
  } = useSettings();

  const reachDisplay =
    reach === "warm" ? "Warm" : reach === "direct" ? "Direct" : "Quiet";
  const quietWindowDisplay = quietWindow
    ? `${quietWindow.dontReachBefore}–${quietWindow.dontReachAfter}h`
    : "Off";

  const settingIcon = (name: CrossPlatformSymbol) => (
    <SymbolView name={name} size={17} tintColor={mutedIconColor} />
  );

  const signInProvider = signInMethod.toLowerCase();
  const signInValueIcon = signInProvider.includes("apple") ? (
    <AppleIcon size={16} color={iconColor} />
  ) : signInProvider.includes("google") ? (
    <GoogleIcon size={16} />
  ) : (
    <SymbolView name={EMAIL_ICON} size={15} tintColor={mutedIconColor} />
  );

  const { setConfirmAction, isConfirmLoading, activeConfig, handleConfirm } =
    useConfirmAction({
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
        contentContainerStyle={styles.contentContainer}
      >
        {/* ── ACCOUNT ─────────────────────────────────────────── */}
        <SettingsSection title="Account">
          <SettingsRow
            variant="value"
            icon={settingIcon(ACCOUNT_ICON)}
            label="Sign-in method"
            value={signInMethod}
            valueIcon={signInValueIcon}
            isLast
          />
        </SettingsSection>

        {/* ── YOUR SPACE ──────────────────────────────────────── */}
        <SettingsSection title="Your space">
          <SettingsRow
            variant="value"
            icon={settingIcon(SPACE_NAME_ICON)}
            label="Name"
            value={spaceName ?? "—"}
            onPress={() => setSpaceNameDialogOpen(true)}
            isLast
          />
        </SettingsSection>

        {/* ── APPEARANCE ──────────────────────────────────────── */}
        <SettingsSection title="Appearance">
          <SettingsRow
            variant="value"
            icon={settingIcon(MODE_ICON)}
            label="Mode"
            value={themeDisplay}
            onPress={() => setThemeDialogOpen(true)}
          />
          <SettingsRow
            variant="chevron"
            icon={settingIcon(APPEARANCE_ICON)}
            label="Appearance"
            onPress={() => router.push("/(protected)/settings/appearance")}
          />
          <SettingsRow
            variant="toggle"
            icon={settingIcon(MOTION_ICON)}
            label="Reduced motion"
            isSelected={reducedMotion}
            onToggle={setReducedMotion}
          />
          <SettingsRow
            variant="chevron"
            icon={settingIcon(REPLAY_ICON)}
            label="Replay intro"
            onPress={() => setReplayIntroOpen(true)}
            isLast
          />
        </SettingsSection>

        {/* ── MIRROR ─────────────────────────────────────────── */}
        <SettingsSection title="Mirror">
          <SettingsRow
            variant="value"
            icon={settingIcon(MIRROR_ICON)}
            label="Tone"
            value={mirrorToneDisplay}
            onPress={() => setMirrorToneDialogOpen(true)}
            isLast
          />
        </SettingsSection>

        {/* ── NOTIFICATIONS ────────────────────────────────────── */}
        <SettingsSection title="Notifications">
          <SettingsRow
            variant="toggle"
            icon={settingIcon(NOTIFICATIONS_ICON)}
            label="Gentle reminders"
            isSelected={gentleReminders}
            onToggle={setGentleReminders}
            isLast={!gentleReminders}
          />
          {gentleReminders && (
            <>
              <SettingsRow
                variant="value"
                icon={settingIcon(REACH_ICON)}
                label="How I reach out"
                value={reachDisplay}
                onPress={() => setReachDialogOpen(true)}
              />
              <SettingsRow
                variant="value"
                icon={settingIcon(QUIET_HOURS_ICON)}
                label="Quiet hours"
                value={quietWindowDisplay}
                onPress={() => setQuietWindowDialogOpen(true)}
                isLast
              />
            </>
          )}
        </SettingsSection>

        {/* ── REFLECTION POOL ──────────────────────────────────── */}
        <SettingsSection title="Reflection Pool">
          <SettingsRow
            variant="toggle"
            icon={settingIcon(SHARE_ICON)}
            label="Share by default"
            isSelected={contributeAnonymously}
            onToggle={setContributeAnonymously}
            isLast
          />
        </SettingsSection>

        {/* ── TRUSTED BRIDGE ───────────────────────────────────── */}
        <SettingsSection title="Trusted Bridge">
          <SettingsRow
            variant="toggle"
            icon={settingIcon({ ios: "flame", android: "local_fire_department", web: "local_fire_department" })}
            label="Show bridge at session end"
            isSelected={bridgeEnabled}
            onToggle={setBridgeEnabled}
            isLast
          />
        </SettingsSection>

        {/* ── IS XOLACE HELPING? ───────────────────────────────── */}
        <EnjoyingXolaceSection />

        {/* ── FOLLOW US ────────────────────────────────────────── */}
        <FollowUsSection />

        {/* ── SUPPORT ──────────────────────────────────────────── */}
        <SettingsSection title="Support">
          <SettingsRow
            variant="chevron"
            icon={settingIcon(FEEDBACK_ICON)}
            label="Send feedback"
            onPress={() => setFeedbackDialogOpen(true)}
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
            icon={settingIcon(RETENTION_ICON)}
            label="Retention"
            value={retentionDisplay}
            onPress={() => setRetentionDialogOpen(true)}
          />
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

        {/* ── DEV TOOLS (development builds only) ──────────────── */}
        {__DEV__ && <DevToolsSection />}

        {/* ── LOG OUT ──────────────────────────────────────────── */}
        <View className="px-5">
          <SettingsRow
            variant="action"
            icon={settingIcon(LOG_OUT_ICON)}
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
        onSave={async (name) => {
          await setSpaceName(name);
        }}
        onClear={async () => {
          await setSpaceName(null);
        }}
      />

      {/* ── REACH SELECTOR DIALOG ───────────────────────────── */}
      <ReachSelectorDialog
        isOpen={reachDialogOpen}
        onOpenChange={setReachDialogOpen}
        currentReach={reach}
        onSelect={setReach}
      />

      {/* ── QUIET WINDOW DIALOG ─────────────────────────────── */}
      <QuietWindowDialog
        isOpen={quietWindowDialogOpen}
        onOpenChange={setQuietWindowDialogOpen}
        current={quietWindow}
        onSave={setQuietWindow}
      />

      {/* ── RETENTION PICKER DIALOG ─────────────────────────── */}
      <RetentionPickerDialog
        isOpen={retentionDialogOpen}
        onOpenChange={setRetentionDialogOpen}
        currentValue={retention}
        onSelect={setRetention}
      />

      {/* ── FEEDBACK DIALOG ─────────────────────────────────── */}
      <FeedbackDialog
        isOpen={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
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
