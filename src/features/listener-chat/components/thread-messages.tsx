import { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
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
import { ComposerPlaceholder } from './composer-placeholder';
import { SafetyStrip } from './safety-strip';
import { ThreadSkeleton } from './thread-skeleton';
import { ThreadStatusBar } from './thread-status-bar';
import type { ThreadConversation } from './thread-screen';

/**
 * v1 surfaces text only: no thread replies, no quoted replies, no reactions,
 * no typing indicator. Stream provides all of them — the constraint is the
 * deliberate "small surface" posture, not a capability gap.
 */
const NO_REACTIONS: ReactionData[] = [];

/**
 * Removes the two affordances v1 has no answer for.
 *
 * `supportedReactions: []` only empties the reaction *list* — the picker itself
 * renders on `own_capabilities.sendReaction`, so long-press still offered a bare
 * "+" that opened an emoji sheet. And the composer's "+" is an attachment
 * picker; we accept text only, so it opened a gallery whose result had nowhere
 * to go. Denying the capability is the single lever for both: the reaction
 * picker returns null on `sendReaction`, and the attach button on `uploadFile`.
 *
 * Capabilities are merged per-key, so naming these two leaves the rest of the
 * channel's real capabilities intact.
 */
const TEXT_ONLY_CAPABILITIES = { sendReaction: false, uploadFile: false };

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
      <Channel
        channel={channel}
        // Must be explicit: Channel destructures both with no default, so
        // omitting them passes `undefined`, not 0.
        keyboardVerticalOffset={headerOffset}
        topInset={insets.top}
        supportedReactions={NO_REACTIONS}
        overrideOwnCapabilities={TEXT_ONLY_CAPABILITIES}
        // The capability alone does not remove the attach button: InputButtons
        // sits behind a memo whose comparator checks only these three picker
        // props, so a change to `uploadFile` never re-renders it. These do.
        hasImagePicker={false}
        hasFilePicker={false}
        hasCameraPicker={false}
        // And the button survives on slash commands alone — a messaging
        // channel ships with giphy enabled by default.
        hasCommands={false}
        messageActions={minimalMessageActions}
      >
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
      .watch()
      .then(() => {
        if (alive) setFailedCid(null);
      })
      .catch((error) => {
        console.error('[listener-chat] channel watch failed', error);
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
 * Each client touches on its own sends, so both sides stay covered without a
 * Stream webhook. (ponytail: webhook later only if client drift shows up.)
 */
function useTouchOnSend(
  channel: StreamChannel,
  conversation: ThreadConversation,
  // The connected user's id, from the socket rather than from Convex — same
  // value (the profile id signs the token), one less field the screen has to
  // have loaded before it can mount this.
  myUserId: string | undefined,
) {
  const touchConversation = useMutation(api.listenerChat.touchConversation);
  const { id, status } = conversation;

  useEffect(() => {
    if (status !== 'open') return;
    const { unsubscribe } = channel.on('message.new', (event) => {
      // The `!myUserId` half matters: without it an id-less event would match
      // an id-less user and touch on the counterpart's message.
      if (!myUserId || event.user?.id !== myUserId) return;
      touchConversation({ conversationId: id }).catch((error) =>
        console.error('[listener-chat] touch failed', error),
      );
    });
    return unsubscribe;
  }, [channel, id, status, myUserId, touchConversation]);
}
