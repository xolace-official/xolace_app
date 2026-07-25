import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Skeleton } from 'heroui-native';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
} from 'stream-chat-expo';
import type {
  MessageActionsParams,
  MessageActionType,
  ReactionData,
} from 'stream-chat-expo';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { SafetyStrip } from './safety-strip';
import { ThreadHeader } from './thread-header';
import { ThreadStatusBar } from './thread-status-bar';

export type ThreadConversation = NonNullable<
  FunctionReturnType<typeof api.listenerChat.getConversation>
>;

/**
 * v1 surfaces text only: no thread replies, no quoted replies, no reactions,
 * no typing indicator. Stream provides all of them — the constraint is the
 * deliberate "small surface" posture, not a capability gap.
 */
const NO_REACTIONS: ReactionData[] = [];

/** Everything except threadReply and quotedReply — v1 has no reply surface. */
function minimalMessageActions({
  copyMessage,
  deleteMessage,
  editMessage,
  flagMessage,
  retry,
}: MessageActionsParams): MessageActionType[] {
  return [copyMessage, editMessage, deleteMessage, flagMessage, retry];
}

export function ThreadScreen({ conversationId }: { conversationId: string }) {
  const conversation = useQuery(api.listenerChat.getConversation, {
    conversationId: conversationId as Id<'listener_conversations'>,
  });

  if (conversation === undefined) return <ThreadSkeleton />;
  if (conversation === null) return <ThreadUnavailable />;
  return <ThreadBody conversation={conversation} />;
}

function ThreadBody({ conversation }: { conversation: ThreadConversation }) {
  const { client } = useChatContext();
  const { streamChannelId } = conversation;

  // Channel identity must stay stable across renders — `<Channel>` treats a new
  // instance as a new conversation. This memo is for correctness, not perf, so
  // it stays despite the React Compiler being enabled.
  const channel = useMemo(
    () => (streamChannelId ? client.channel('messaging', streamChannelId) : null),
    [client, streamChannelId],
  );

  useTouchOnSend(channel, conversation);

  // A request that hasn't been accepted has no channel yet — there is nothing
  // to read, so the whole screen is header + waiting/accept bar.
  if (!channel) {
    return (
      <View className="flex-1 bg-background">
        <ThreadHeader conversation={conversation} />
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

  return (
    <Channel
      channel={channel}
      // The header lives INSIDE Channel, so nothing sits above it to offset.
      // Both must be explicit: Channel destructures keyboardVerticalOffset
      // with no default, so omitting it passes `undefined`, not 0.
      keyboardVerticalOffset={0}
      topInset={0}
      supportedReactions={NO_REACTIONS}
      messageActions={minimalMessageActions}
    >
      <ThreadHeader conversation={conversation} />
      <SafetyStrip />
      <MessageList disableTypingIndicator />
      {conversation.status === 'open' ? (
        <MessageComposer />
      ) : (
        <ThreadStatusBar conversation={conversation} />
      )}
    </Channel>
  );
}

/**
 * Keeps `lastMessageAt` current so the resting sweep measures real silence.
 * Each client touches on its own sends, so both sides stay covered without a
 * Stream webhook. (ponytail: webhook later only if client drift shows up.)
 */
function useTouchOnSend(channel: StreamChannel | null, conversation: ThreadConversation) {
  const touchConversation = useMutation(api.listenerChat.touchConversation);
  const { id, status, myStreamUserId } = conversation;

  useEffect(() => {
    if (!channel || status !== 'open') return;
    const { unsubscribe } = channel.on('message.new', (event) => {
      if (event.user?.id !== myStreamUserId) return;
      touchConversation({ conversationId: id }).catch((error) =>
        console.error('[listener-chat] touch failed', error),
      );
    });
    return unsubscribe;
  }, [channel, id, status, myStreamUserId, touchConversation]);
}

function ThreadSkeleton() {
  return (
    <View className="flex-1 justify-end gap-3 bg-background px-4 pb-10">
      <Skeleton className="h-12 w-2/3 rounded-2xl" />
      <Skeleton className="h-12 w-1/2 self-end rounded-2xl" />
      <Skeleton className="h-12 w-3/5 rounded-2xl" />
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
