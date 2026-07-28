import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from 'heroui-native';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { useStreamConnection } from '../providers/stream-chat-provider';
import { useThreadConversation } from '../use-thread-conversation';
import { ComposerPlaceholder } from './composer-placeholder';
import { SafetyStrip } from './safety-strip';
import { ThreadHeader } from './thread-header';
import { ThreadMessages } from './thread-messages';
import { ThreadSkeleton } from './thread-skeleton';
import { ThreadStatusBar } from './thread-status-bar';

/**
 * `myStreamUserId` is dropped: it is the profile id, which is also the id the
 * Stream socket connects as, so `client.userID` carries the same value without
 * the round trip — and that lets `useThreadConversation` seed this shape from
 * the conversation list, which has no per-user field of its own. The server
 * still returns it for clients shipped before this change.
 */
export type ThreadConversation = Omit<
  NonNullable<FunctionReturnType<typeof api.listenerChat.getConversation>>,
  'myStreamUserId'
>;

export function ThreadScreen({ conversationId }: { conversationId: string }) {
  const conversation = useThreadConversation(conversationId);

  if (conversation === undefined) return <ThreadSkeleton />;
  if (conversation === null) return <ThreadUnavailable />;
  return <ThreadBody conversation={conversation} />;
}

function ThreadBody({ conversation }: { conversation: ThreadConversation }) {
  // Usually a no-op — the Connect tab already opened the connection on the way
  // here. It matters on the paths that skip that tab: a push-notification deep
  // link, or a cold launch straight into this route.
  const { status: streamStatus, retry } = useStreamConnection();

  // Identity lives in the native header's title slot; the back affordance,
  // safe area and glass background are the platform's. Rendered as a sibling of
  // every branch below rather than inside one, so the title is set on the first
  // frame and survives the connecting → ready swap without the header
  // re-mounting under it.
  const header = (
    <Stack.Screen
      options={{
        // eslint-disable-next-line react/no-unstable-nested-components -- navigation header render prop, not a mounted subtree
        headerTitle: () => <ThreadHeader conversation={conversation} />,
        title: conversation.counterpartName,
      }}
    />
  );

  // A request that hasn't been accepted has no channel yet — there is nothing
  // to read, so the whole screen is header + waiting/accept bar. Independent of
  // Stream: this state never needs a connection.
  if (!conversation.streamChannelId) {
    return (
      <View className="flex-1 bg-background">
        {header}
        <SafetyStrip />
        <View className="flex-1 items-center justify-center px-10">
          <AppText className="text-center text-[13px] leading-5 text-muted">
            {conversation.role === 'listener'
              ? 'Nothing has been said yet — the conversation opens once you accept.'
              : 'Messages will appear here once your request is accepted.'}
          </AppText>
        </View>
        <ThreadStatusBar conversation={conversation} />
      </View>
    );
  }

  // Chrome is Convex-driven and already loaded, so it stays put while the
  // Stream connection opens underneath it. Only the message region waits.
  if (streamStatus !== 'ready') {
    return (
      <View className="flex-1 bg-background">
        {header}
        <SafetyStrip />
        {streamStatus === 'connecting' ? <ThreadSkeleton /> : <MessagesUnavailable onRetry={retry} />}
        {conversation.status === 'open' ? (
          // Only while connecting. On the error path the messages never arrive,
          // so a composer stub would promise a send that cannot happen.
          streamStatus === 'connecting' ? <ComposerPlaceholder /> : null
        ) : (
          <ThreadStatusBar conversation={conversation} />
        )}
      </View>
    );
  }

  return (
    <>
      {header}
      <ThreadMessages conversation={conversation} />
    </>
  );
}

function MessagesUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-10">
      <AppText className="text-center text-[13px] leading-5 text-muted">
        Messages couldn&apos;t load. Check your connection and try again.
      </AppText>
      <Button variant="secondary" size="sm" onPress={onRetry}>
        Try again
      </Button>
    </View>
  );
}

function ThreadUnavailable() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background px-10">
      <AppText className="text-[15px] font-semibold text-foreground">
        This conversation isn&apos;t here
      </AppText>
      <AppText className="text-center text-[13px] leading-5 text-muted">
        It may have been closed, or it isn&apos;t yours to open.
      </AppText>
    </View>
  );
}
