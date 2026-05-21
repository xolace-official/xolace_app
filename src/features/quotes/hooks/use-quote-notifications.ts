import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const TIME_MAP: Record<string, { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 0 },
  afternoon: { hour: 13, minute: 0 },
  evening: { hour: 19, minute: 0 },
};

export type NotifSetupState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "scheduled";

/**
 * Handles requesting permission and scheduling the daily quote notification.
 * Returns a setup function to call after preference setup completes.
 */
export function useQuoteNotifications() {
  const [state, setState] = useState<NotifSetupState>("idle");
  const updateQuotePrefs = useMutation(api.preferences.updateQuotePreferences);

  const scheduleNotification = useCallback(
    async (
      themes: string[],
      notificationEnabled: boolean,
      notificationTime?: string
    ) => {
      // Always save preferences first
      await updateQuotePrefs({ themes, notificationEnabled, notificationTime });

      if (!notificationEnabled || !notificationTime || notificationTime === "none") {
        setState("scheduled");
        return { granted: false };
      }

      if (!Device.isDevice) {
        // Simulator — skip permission, just save
        setState("scheduled");
        return { granted: false };
      }

      setState("requesting");

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setState("denied");
        // Preferences already saved with notificationEnabled=false effective
        await updateQuotePrefs({
          themes,
          notificationEnabled: false,
          notificationTime,
        });
        return { granted: false, denied: true };
      }

      setState("granted");

      // Cancel any previously scheduled daily quote notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existing = scheduled.filter((n) =>
        n.identifier.startsWith("daily-quote-")
      );
      for (const n of existing) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }

      const timeConfig = TIME_MAP[notificationTime] ?? { hour: 8, minute: 0 };

      await Notifications.scheduleNotificationAsync({
        identifier: `daily-quote-${notificationTime}`,
        content: {
          title: "Your quote is waiting.",
          body: "Open Xolace to see today's reflection.",
          data: { screen: "quotes" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: timeConfig.hour,
          minute: timeConfig.minute,
        },
      });

      setState("scheduled");
      return { granted: true };
    },
    [updateQuotePrefs]
  );

  return { state, scheduleNotification };
}
