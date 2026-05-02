import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/expo";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "expo-router";
import { useAppStore } from "@/src/store/store";

// Configure how notifications appear when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Manages push notification permissions, token registration,
 * and notification response handling.
 *
 * Must be rendered inside an authenticated Convex context
 * (i.e. within the protected route group).
 */
export function useNotifications() {
  const { isSignedIn } = useAuth();
  const registerToken = useMutation(api.notifications.registerToken);
  const markResultedInSession = useMutation(api.notifications.markResultedInSession);
  const updatePreferences = useMutation(api.preferences.update);
  const router = useRouter();
  const setLastNotification = useAppStore((s) => s.setLastNotification);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    async function register() {
      const token = await requestPushToken();
      if (token && !cancelled) {
        setExpoPushToken(token);
        await registerToken({ pushToken: token });

        // Sync the device's IANA timezone so the server can compute Quiet Window gates.
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (timezone) {
            await updatePreferences({ notificationTimezone: timezone });
          }
        } catch {
          // Non-blocking; timezone is best-effort
        }
      }
    }

    register();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // No-op for now. Could be used for in-app notification UI.
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const logId = data?.logId as Id<"notification_log"> | undefined;
        const body = response.notification.request.content.body;

        if (logId) {
          markResultedInSession({ logId });

          // Store notification content for the soft framing banner on the reflect screen.
          if (body) {
            setLastNotification({ content: body, notificationId: logId });
          }
        }

        if (
          data?.type === "gentle_return" ||
          data?.type === "pattern_nudge" ||
          data?.type === "milestone"
        ) {
          router.push("/(protected)");
        }
      });

    return () => {
      cancelled = true;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isSignedIn, registerToken, markResultedInSession, updatePreferences, router, setLastNotification]);

  return { expoPushToken };
}

/**
 * Request OS push notification permission and return the Expo push token.
 * Exported so settings can trigger re-registration when notifications are enabled.
 */
export async function requestPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C63FF",
    });
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.error("No EAS projectId found for push token registration");
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return token;
}
