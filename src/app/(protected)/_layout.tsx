import { Stack } from "expo-router";
import { AppPresence } from "@/src/providers/app-presence";
import { useNotifications } from "@/src/lib/use-notifications";
import { usePostHogIdentity } from "@/src/lib/use-posthog-identity";
import {
  StreamChatProvider,
  StreamOverlayProvider,
} from "@/src/features/xolacer-chat/providers/stream-chat-provider";

/**
 * Provides the navigation layout used by protected routes.
 * Initializes push notification registration for authenticated users.
 */
const SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: "transparent" },
};

const NO_GESTURE = { gestureEnabled: false };

/** Skipping a rating should feel like dismissing, not navigating away. */
const RATE_OPTIONS = {
  presentation: "formSheet",
  sheetGrabberVisible: true,
} as const;


const CHAT_OPTIONS = {
  headerShown: true,
  title: "",
  headerBackButtonDisplayMode: "minimal",
  headerShadowVisible: false,
} as const;

export default function ProtectedLayout() {
  useNotifications();
  usePostHogIdentity();

  return (
    // Above the Stack so the message overlay can lay itself out against the
    // whole window, header included — see StreamOverlayProvider.
    <StreamOverlayProvider>
      <StreamChatProvider>
        {/* Renders nothing — it is here, above the Stack, so presence keeps
            reporting whichever screen the user is on. */}
        <AppPresence />
        <Stack screenOptions={SCREEN_OPTIONS}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={NO_GESTURE} />
          <Stack.Screen name="sit-with-this" options={NO_GESTURE} />
          <Stack.Screen name="peer-reflections" options={NO_GESTURE} />
          <Stack.Screen name="session-end" options={NO_GESTURE} />
          <Stack.Screen name="crisis-resources" options={NO_GESTURE} />
          <Stack.Screen name="trusted-bridge" />
          <Stack.Screen
            name="voice-vent"
            options={{ gestureEnabled: false, animation: "fade" }}
          />
          <Stack.Screen name="quotes/index" />

          
          <Stack.Screen name="chat/[conversationId]" options={CHAT_OPTIONS} />
          <Stack.Screen name="xolacer/[profileId]" />
          <Stack.Screen name="xolacer-setup" />
          <Stack.Screen name="rate/[conversationId]" options={RATE_OPTIONS} />
        </Stack>
      </StreamChatProvider>
    </StreamOverlayProvider>
  );
}
