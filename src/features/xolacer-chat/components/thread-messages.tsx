import { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  MessageComposer,
  MessageList,
  WithComponents,
  useChatContext,
} from 'stream-chat-expo';
import { api } from '@/convex/_generated/api';
import { ComposerPlaceholder } from '@/src/features/xolacer-chat/components/composer-placeholder';
import { ConversationIdentityProvider } from '@/src/features/xolacer-chat/components/message-author';
import { OfflineStrip } from '@/src/features/xolacer-chat/components/offline-strip';
import { SafetyStrip } from '@/src/features/xolacer-chat/components/safety-strip';
import {
  CHANNEL_ROOT_PROPS,
  COMPONENT_OVERRIDES,
  NO_REACTIONS,
  TEXT_ONLY_CAPABILITIES,
  minimalMessageActions,
} from '@/src/features/xolacer-chat/components/thread-channel-config';
import { ThreadSkeleton } from '@/src/features/xolacer-chat/components/thread-skeleton';
import { ThreadStatusBar } from '@/src/features/xolacer-chat/components/thread-status-bar';
import type { ThreadConversation } from '@/src/features/xolacer-chat/components/thread-screen';

/**
 * The message surface, mounted only once `Chat` holds a connected client.
 *
 * Split out from the thread screen so the screen's Convex-driven chrome —
 * header, safety strip, status bar — can render while Stream is still
 * connecting. Everything here needs `ChatContext`, which only exists under a
 * connected `Chat`.
 */
export function ThreadMessages({ conversation }: { conversation: ThreadConversation }) {
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

  // Channel identity must stay stable across renders — `<Channel>` treats a new
  // instance as a new conversation. This memo is for correctness, not perf, so
  // it stays despite the React Compiler being enabled.
  const channel = useMemo(
    () => client.channel('messaging', streamChannelId as string),
    [client, streamChannelId],
  );

  const watched = useWatchedChannel(channel);
  useTouchOnSend(channel, conversation, client.userID);

  // `client.channel()` returns an *unwatched* handle: no messages, and no
  // `own_capabilities`. `<Channel>` renders its children immediately and only
  // watches inside an effect, so mounting it now guarantees one paint of
  // "No chats here yet" over "You can't send messages in this channel" before
  // the real state arrives. Watching first collapses that to the skeleton —
  // and because Channel's effect skips the call when `channel.initialized` is
  // already true, this replaces its watch rather than duplicating it.
  if (!watched) {
    return (
      <View className="flex-1 bg-background">
        <SafetyStrip />
        <ThreadSkeleton />
        {conversation.status === 'open' ? <ComposerPlaceholder /> : null}
      </View>
    );
  }

  return (
    // Wrapper exists to measure the content box; Channel's own root is the
    // view whose height Stream mis-compares against the keyboard frame.
    <View className="flex-1" onLayout={onContentLayout}>
      {/* Component overrides arrive through this, not through Channel props.
        Module-level constant because WithComponents reads `overrides` once at
        mount and never again — a fresh object each render would be silently
        ignored, which is worse than a crash — and why the message-avatar
        override reads its conversation from the context below rather than
        from a closure. */}
      <WithComponents overrides={COMPONENT_OVERRIDES}>
        <ConversationIdentityProvider conversation={conversation}>
          <Channel
            channel={channel}
            // Must be explicit: Channel destructures both with no default, so
            // omitting them passes `undefined`, not 0.
            keyboardVerticalOffset={headerOffset}
            additionalKeyboardAvoidingViewProps={CHANNEL_ROOT_PROPS}
            topInset={insets.top}
            supportedReactions={NO_REACTIONS}
            overrideOwnCapabilities={TEXT_ONLY_CAPABILITIES}
            hasImagePicker={false}
            hasFilePicker={false}
            hasCameraPicker={false}
            // And the button survives on slash commands alone — a messaging
            // channel ships with giphy enabled by default.
            hasCommands={false}
            messageActions={minimalMessageActions}
          >
            <SafetyStrip />
            <MessageList />
            {conversation.status === 'open' ? (
              <>
                <OfflineStrip />
                <MessageComposer />
              </>
            ) : (
              <ThreadStatusBar conversation={conversation} />
            )}
          </Channel>
        </ConversationIdentityProvider>
      </WithComponents>
    </View>
  );
}

/**
 * Resolves once the channel holds real state, so `<Channel>` never mounts over
 * an empty one. Failure resolves too: Stream's own `LoadingErrorIndicator` is a
 * better place to land than a skeleton that never ends.
 */
function useWatchedChannel(channel: StreamChannel) {
  // Records only the failure case. Success needs no state of its own —
  // `channel.initialized` already carries it — but it does need a re-render,
  // which is the whole reason this lands in state at all. Stored with the cid
  // so a channel swap re-gates instead of inheriting the previous verdict.
  const [failedCid, setFailedCid] = useState<string | null>(null);

  useEffect(() => {
    if (channel.initialized) return;
    let alive = true;
    channel
      .watch({ presence: true })
      .then(() => {
        if (alive) setFailedCid(null);
      })
      .catch((error) => {
        console.error('[xolacer-chat] channel watch failed', error);
        if (alive) setFailedCid(channel.cid);
      });
    return () => {
      alive = false;
    };
  }, [channel]);

  // Derived from the channel rather than mirrored into state. A failed watch
  // still opens the gate: Stream's own LoadingErrorIndicator, with its retry,
  // is a better landing than a skeleton that never resolves.
  return channel.initialized || failedCid === channel.cid;
}

/**
 * Keeps `lastMessageAt` current so the resting sweep measures real silence.
 * Each client touches on its own sends, so both sides stay covered.
 *
 * The Stream `message.new` webhook added since does not replace this: it fires
 * on the notification path and stamps the recipient's own notified-at, which is
 * suppressed for two minutes at a time and so cannot stand in for a sweep that
 * has to measure every message. (ponytail: fold the touch into the webhook only
 * if client drift shows up.)
 */
function useTouchOnSend(
  channel: StreamChannel,
  conversation: ThreadConversation,
  // The connected user's id, from the socket rather than from Convex — same
  // value (the profile id signs the token), one less field the screen has to
  // have loaded before it can mount this.
  myUserId: string | undefined,
) {
  const touchConversation = useMutation(api.xolacerChat.touchConversation);
  const { id, status } = conversation;

  useEffect(() => {
    if (status !== 'open') return;
    const { unsubscribe } = channel.on('message.new', (event) => {
      // The `!myUserId` half matters: without it an id-less event would match
      // an id-less user and touch on the counterpart's message.
      if (!myUserId || event.user?.id !== myUserId) return;
      touchConversation({ conversationId: id }).catch((error) =>
        console.error('[xolacer-chat] touch failed', error),
      );
    });
    return unsubscribe;
  }, [channel, id, status, myUserId, touchConversation]);
}
