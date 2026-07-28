import { Stack } from "expo-router";
import { useNotifications } from "@/src/lib/use-notifications";
import {
  StreamChatProvider,
  StreamOverlayProvider,
} from "@/src/features/listener-chat/providers/stream-chat-provider";

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

/**
 * The chat header is the platform's, not ours: no `headerStyle.backgroundColor`
 * and no custom back button, so iOS 26 renders it in the system glass material
 * with the native chevron, edge-swipe and transition. Only the title slot is
 * ours — `headerLeft` would have replaced the back button rather than sat
 * beside it. It lives here, and the chat route group has no layout of its own,
 * because this is the stack that can actually go back.
 */
const CHAT_OPTIONS = {
  headerShown: true,
  // Blank until the conversation resolves — the default would be the route
  // name, so the connecting frame would flash "[conversationId]".
  title: "",
  headerBackButtonDisplayMode: "minimal",
  headerShadowVisible: false,
} as const;

export default function ProtectedLayout() {
  useNotifications();

  return (
    // Above the Stack so the message overlay can lay itself out against the
    // whole window, header included — see StreamOverlayProvider.
    <StreamOverlayProvider>
      {/* The Connect tab and the thread are sibling routes in this stack, so
        this is the lowest layout that is an ancestor of both — anywhere lower
        and the connection can't be shared between them. Connects nothing until
        a chat surface calls `useStreamConnection`. */}
      <StreamChatProvider>
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
          <Stack.Screen name="listener/[profileId]" />
          <Stack.Screen name="listener-setup" />
          {/* Rating needs no Stream client, and a sheet keeps "skip" feeling
            like a dismissal. */}
          <Stack.Screen name="rate/[conversationId]" options={RATE_OPTIONS} />
        </Stack>
      </StreamChatProvider>
    </StreamOverlayProvider>
  );
}
