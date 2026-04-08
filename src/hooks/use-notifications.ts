import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/expo";
import { api } from "@/convex/_generated/api";
import { useRouter } from "expo-router";

// Configure how notifications appear when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
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
  const router = useRouter();
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
      }
    }

    register();

    // Listen for notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // No-op for now. Could be used for in-app notification UI.
      });

    // Listen for user tapping a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        // Route based on notification type
        if (data?.type === "gentle_return" || data?.type === "pattern_nudge") {
          router.push("/(protected)");
        }
      });

    return () => {
      cancelled = true;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isSignedIn]);

  return { expoPushToken };
}

/**
 * Request OS push notification permission and return the Expo push token.
 * Exported so settings can trigger re-registration when notifications are enabled.
 */
export async function requestPushToken(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
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
