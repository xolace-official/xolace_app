import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { requestPushToken } from "@/src/lib/use-notifications";
import { usePreferenceMutation } from "./use-preference-mutation";

export type NotificationReach = "warm" | "direct" | "quiet";
export type QuietWindow = { dontReachBefore: number; dontReachAfter: number };

export const useNotificationSettings = () => {
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = usePreferenceMutation();
  const registerToken = useMutation(api.notifications.registerToken);
  const removeToken = useMutation(api.notifications.removeToken);

  const gentleReminders = preferences?.notifications?.enabled ?? false;
  const reach = (preferences?.notifications?.reach ?? "warm") as NotificationReach;
  const quietWindow = preferences?.notifications?.quietWindow ?? null;

  const setReach = (next: NotificationReach) => {
    updatePreferences({ notificationReach: next });
  };

  const setQuietWindow = (window: QuietWindow | null) => {
    updatePreferences({ notificationQuietWindow: window });
  };

  const syncTimezone = async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) await updatePreferences({ notificationTimezone: timezone });
    } catch {
      // Non-blocking
    }
  };

  const setGentleReminders = async (enabled: boolean) => {
    const current = preferences?.notifications;
    updatePreferences({
      notifications: {
        enabled,
        gentleReturn: enabled,
        patternNudge: enabled,
        milestone: enabled,
        reach: current?.reach ?? "warm",
        quietWindow: current?.quietWindow,
        timezone: current?.timezone,
      },
    });

    if (enabled) {
      try {
        const token = await requestPushToken();
        if (!token) {
          updatePreferences({
            notifications: {
              enabled: false,
              gentleReturn: false,
              patternNudge: false,
              milestone: false,
              reach: current?.reach ?? "warm",
              quietWindow: current?.quietWindow,
              timezone: current?.timezone,
            },
          });
          return;
        }
        await registerToken({ pushToken: token });
        await syncTimezone();
      } catch {
        updatePreferences({
          notifications: {
            enabled: false,
            gentleReturn: false,
            patternNudge: false,
            milestone: false,
            reach: current?.reach ?? "warm",
            quietWindow: current?.quietWindow,
            timezone: current?.timezone,
          },
        });
      }
    } else {
      try {
        await removeToken();
      } catch {
        // Best-effort
      }
    }
  };

  const reachDisplay =
    reach === "warm" ? "Warm" : reach === "direct" ? "Direct" : "Quiet";

  const quietWindowDisplay = quietWindow
    ? `${quietWindow.dontReachBefore}–${quietWindow.dontReachAfter}h`
    : "Off";

  return {
    gentleReminders,
    setGentleReminders,
    reach,
    reachDisplay,
    setReach,
    quietWindow,
    quietWindowDisplay,
    setQuietWindow,
  };
};
