import { useLocalSearchParams } from 'expo-router';
import { StreamChatProvider } from '@/src/features/listener-chat/providers/stream-chat-provider';
import { ThreadScreen } from '@/src/features/listener-chat/components/thread-screen';

/**
 * Stream is mounted here rather than in a `chat/_layout.tsx` because any layout
 * — `Slot` included — is a navigator, and a navigator between this screen and
 * the protected stack swallows the `<Stack.Screen options>` the thread sets for
 * its own header (avatar + name), and leaves a one-screen stack with nothing to
 * pop to, so no back chevron renders. With no layout in between, the thread is
 * a direct child of the protected stack: native back button, native glass
 * header, and a title slot the screen can actually fill.
 *
 * Scoping stays what it was: the Stream connection lives only as long as an
 * open thread, never app-wide.
 */
export default function ChatThreadRoute() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  return (
    <StreamChatProvider>
      <ThreadScreen conversationId={conversationId} />
    </StreamChatProvider>
  );
}
