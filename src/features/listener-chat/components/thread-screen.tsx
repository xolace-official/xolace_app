import { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from 'heroui-native';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  MessageComposer,
  MessageList,
  messageActions as defaultMessageActions,
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

/**
 * Everything except threadReply and quotedReply — v1 has no reply surface.
 *
 * Subtractive on purpose. Building the array by hand skipped Stream's own
 * gating and offered actions that cannot run: Copy with no clipboard handler
 * registered, Retry on a message that never failed, Flag on your own message.
 */
const ALLOWED_ACTIONS = new Set([
  'copyMessage',
  'editMessage',
  'deleteMessage',
  'flagMessage',
  'retry',
]);

/**
 * Gives iOS the portal settle window Stream only grants Android.
 *
 * Edit is the one action that focuses the composer input, and Stream gates that
 * focus behind `usePortalSettledCallback` — two frames on Android, **zero on
 * iOS**. With no window the focus lands while `PortalWhileClosingView` is still
 * handing the composer's native view back from the overlay's closing portal
 * host, and Stream's own doc comment predicts the result: "Doing this
 * prematurely will result in the keyboard being immediately closed." Observed
 * here as Edit silently doing nothing, and on iOS 26 as a hard abort inside JSI
 * (`Assertion failed: (isObject()), getObject`) when the focus command reached
 * a shadow node mid-reparent.
 *
 * Two frames reproduces the Android timing: one to let the portal retarget and
 * React commit, one to let the native hierarchy settle in its final host.
 * Remove once stream-chat-react-native ships a non-zero iOS SETTLE_FRAMES.
 */
function afterPortalSettles(action: () => void) {
  return () => requestAnimationFrame(() => requestAnimationFrame(action));
}

function minimalMessageActions(params: MessageActionsParams): MessageActionType[] {
  return defaultMessageActions(params)
    .filter((action) => ALLOWED_ACTIONS.has(action.actionType))
    .map((action) =>
      process.env.EXPO_OS === 'ios' && action.actionType === 'editMessage'
        ? { ...action, action: afterPortalSettles(action.action) }
        : action,
    );
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState(0);

  // Stream's KeyboardCompatibleView compares its own layout height — which
  // starts below the native header — against the keyboard's absolute screen Y,
  // so the shift under-shoots by exactly the header height and the composer
  // ends up behind the keyboard. Handing that height back as the offset closes
  // the gap. Measured rather than assumed: the header grows with the subtitle,
  // the notch and Dynamic Island, and no constant survives all three.
  const headerOffset = contentHeight ? windowHeight - contentHeight : 0;
  const onContentLayout = (event: LayoutChangeEvent) =>
    setContentHeight(event.nativeEvent.layout.height);

  // Identity lives in the native header's title slot; the back affordance,
  // safe area and glass background are the platform's.
  const header = (
    <Stack.Screen
      options={{
        // eslint-disable-next-line react/no-unstable-nested-components -- navigation header render prop, not a mounted subtree
        headerTitle: () => <ThreadHeader conversation={conversation} />,
        title: conversation.counterpartName,
      }}
    />
  );

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

  return (
    // Wrapper exists to measure the content box; Channel's own root is the
    // view whose height Stream mis-compares against the keyboard frame.
    <View className="flex-1" onLayout={onContentLayout}>
      <Channel
        channel={channel}
        // Must be explicit: Channel destructures both with no default, so
        // omitting them passes `undefined`, not 0.
        keyboardVerticalOffset={headerOffset}
        topInset={insets.top}
        supportedReactions={NO_REACTIONS}
        messageActions={minimalMessageActions}
      >
        {header}
        <SafetyStrip />
        <MessageList disableTypingIndicator />
        {conversation.status === 'open' ? (
          <MessageComposer />
        ) : (
          <ThreadStatusBar conversation={conversation} />
        )}
      </Channel>
    </View>
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
