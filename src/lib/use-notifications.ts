import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/expo";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  chatNotificationRoute,
  isChatNotificationType,
} from "@/convex/lib/chatNotifications";
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
  const preferences = useQuery(api.preferences.get);
  const notificationsEnabled = preferences?.notifications.enabled;

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    async function register() {
      // This path is token *refresh* for someone already opted in — never an
      // opt-in of its own. The contextual moments (session end, quote setup,
      // Settings) each register their own token, and that first registration
      // is what auto-enables the preferences.
      //
      // Without the switch check, turning notifications off did not survive a
      // relaunch: `removeToken` drops the token but the OS grant remains, so
      // the next launch re-registered and `registerToken` flipped every
      // preference back on. The master switch has to mean what it says.
      if (notificationsEnabled !== true) return;

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

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

        if (isChatNotificationType(data?.type)) {
          // Conversation notifications carry a conversationId rather than a
          // logId — there is no analytics row to mark — so they branch here
          // instead of through markResultedInSession above.
          router.push(
            chatNotificationRoute(
              data.type,
              String(data.conversationId),
              Date.now(),
            ),
          );
        } else if (data?.screen === "quotes") {
          router.push("/(protected)/quotes");
        } else if (
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
  }, [isSignedIn, notificationsEnabled, registerToken, markResultedInSession, updatePreferences, router, setLastNotification]);

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

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token;
  } catch (err) {
    console.log("Failed to fetch Expo push token (will retry on next launch):", err);
    return null;
  }
}
