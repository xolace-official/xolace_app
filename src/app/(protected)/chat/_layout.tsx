import { Stack } from 'expo-router';
import { StreamChatProvider } from '@/src/features/listener-chat/providers/stream-chat-provider';

const SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

/**
 * Stream is mounted per chat route group, not app-wide: wrapping the whole
 * protected stack would remount navigation when the client connects, and
 * scoping the connection to open threads keeps the app off Stream's
 * concurrent-connection budget everywhere else.
 */
export default function ChatLayout() {
  return (
    <StreamChatProvider>
      <Stack screenOptions={SCREEN_OPTIONS}>
        <Stack.Screen name="[conversationId]" />
      </Stack>
    </StreamChatProvider>
  );
}
