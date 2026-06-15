import { ScrollView, StyleSheet, View } from "react-native";
import { RadioGroup, Radio, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { cn } from "@/src/lib/utils";
import { AppText } from "@/src/components/shared/app-text";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { SettingsRow } from "@/src/features/settings/components/settings-row";
import {
  useNotificationSettings,
  type NotificationReach,
  type QuietWindow,
} from "@/src/features/settings/hooks/use-notification-settings";
import {
  NOTIFICATIONS_ICON,
  QUIET_HOURS_ICON,
} from "@/src/features/settings/components/settings-icons";

const REACH_OPTIONS: { value: NotificationReach; label: string; description: string }[] = [
  { value: "warm", label: "Warm", description: "Gentle recognition — a friend who notices without demanding" },
  { value: "direct", label: "Direct", description: "Honest and pattern-aware — gets to the point" },
  { value: "quiet", label: "Quiet", description: "Minimal presence — often just a word or two" },
];

const BEFORE_OPTIONS = [
  { label: "5 am", value: 5 },
  { label: "6 am", value: 6 },
  { label: "7 am", value: 7 },
  { label: "8 am", value: 8 },
  { label: "9 am", value: 9 },
  { label: "10 am", value: 10 },
];

const AFTER_OPTIONS = [
  { label: "7 pm", value: 19 },
  { label: "8 pm", value: 20 },
  { label: "9 pm", value: 21 },
  { label: "10 pm", value: 22 },
  { label: "11 pm", value: 23 },
];

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

const styles = StyleSheet.create({
  contentContainer: { paddingTop: 20, paddingBottom: 48 },
});

export const NotificationsScreen = () => {
  const {
    gentleReminders,
    setGentleReminders,
    reach,
    setReach,
    quietWindow,
    setQuietWindow,
  } = useNotificationSettings();

  const mutedColor = useThemeColor("muted") as string;

  const settingIcon = (icon: React.ComponentProps<typeof SymbolView>["name"]) => (
    <SymbolView name={icon} size={17} tintColor={mutedColor} />
  );

  const handleQuietToggle = (enabled: boolean) => {
    if (enabled) {
      setQuietWindow({ dontReachBefore: 8, dontReachAfter: 21 });
    } else {
      setQuietWindow(null);
    }
  };

  const handleBeforeChange = (v: string) => {
    setQuietWindow({
      dontReachBefore: Number(v),
      dontReachAfter: quietWindow?.dontReachAfter ?? 21,
    } as QuietWindow);
  };

  const handleAfterChange = (v: string) => {
    setQuietWindow({
      dontReachBefore: quietWindow?.dontReachBefore ?? 8,
      dontReachAfter: Number(v),
    } as QuietWindow);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* ── REMINDERS ───────────────────────────────────────────── */}
      <EaseView
        initialAnimate={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280, easing: EASE }}
      >
        <SettingsSection title="Reminders">
          <SettingsRow
            variant="toggle"
            icon={settingIcon(NOTIFICATIONS_ICON)}
            label="Gentle reminders"
            isSelected={gentleReminders}
            onToggle={setGentleReminders}
            isLast
          />
        </SettingsSection>
      </EaseView>

      {/* ── HOW I REACH OUT ─────────────────────────────────────── */}
      {gentleReminders && (
        <>
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280, delay: 60, easing: EASE }}
          >
            <SettingsSection title="How I reach out">
              <View className="px-5">
                <RadioGroup
                  value={reach}
                  onValueChange={(v) => setReach(v as NotificationReach)}
                  className="gap-2"
                >
                  {REACH_OPTIONS.map((opt) => (
                    <RadioGroup.Item key={opt.value} value={opt.value}>
                      {({ isSelected }) => (
                        <View
                          className={cn(
                            "flex-row items-center gap-4 px-4 py-4 rounded-2xl",
                            isSelected ? "bg-surface" : "bg-surface/30",
                          )}
                        >
                          <Radio />
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

          {/* ── QUIET HOURS ───────────────────────────────────────── */}
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280, delay: 120, easing: EASE }}
          >
            <SettingsSection title="Quiet hours">
              <SettingsRow
                variant="toggle"
                icon={settingIcon(QUIET_HOURS_ICON)}
                label="Enable quiet hours"
                isSelected={!!quietWindow}
                onToggle={handleQuietToggle}
                isLast={!quietWindow}
              />

              {quietWindow && (
                <>
                  <View className="px-5 pt-5 pb-1">
                    <AppText className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      Not before
                    </AppText>
                  </View>
                  <View className="px-5">
                    <RadioGroup
                      value={String(quietWindow.dontReachBefore)}
                      onValueChange={handleBeforeChange}
                      className="gap-1.5"
                    >
                      {BEFORE_OPTIONS.map((opt) => (
                        <RadioGroup.Item key={opt.value} value={String(opt.value)}>
                          {({ isSelected }) => (
                            <View
                              className={cn(
                                "flex-row items-center gap-4 px-4 py-3 rounded-xl",
                                isSelected ? "bg-surface" : "bg-surface/30",
                              )}
                            >
                              <Radio />
                              <AppText className="flex-1 text-base text-foreground">
                                {opt.label}
                              </AppText>
                            </View>
                          )}
                        </RadioGroup.Item>
                      ))}
                    </RadioGroup>
                  </View>

                  <View className="px-5 pt-5 pb-1">
                    <AppText className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      Not after
                    </AppText>
                  </View>
                  <View className="px-5 pb-4">
                    <RadioGroup
                      value={String(quietWindow.dontReachAfter)}
                      onValueChange={handleAfterChange}
                      className="gap-1.5"
                    >
                      {AFTER_OPTIONS.map((opt) => (
                        <RadioGroup.Item key={opt.value} value={String(opt.value)}>
                          {({ isSelected }) => (
                            <View
                              className={cn(
                                "flex-row items-center gap-4 px-4 py-3 rounded-xl",
                                isSelected ? "bg-surface" : "bg-surface/30",
                              )}
                            >
                              <Radio />
                              <AppText className="flex-1 text-base text-foreground">
                                {opt.label}
                              </AppText>
                            </View>
                          )}
                        </RadioGroup.Item>
                      ))}
                    </RadioGroup>
                  </View>
                </>
              )}
            </SettingsSection>
          </EaseView>
        </>
      )}
    </ScrollView>
  );
};
