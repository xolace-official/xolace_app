import { useMemo, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Channel,
  MessageComposer,
  MessageList,
  WithComponents,
  useChatContext,
  useOverlayContext,
} from 'stream-chat-expo';
import { XOLACE_BROADCAST_CHANNEL_TYPE, XOLACE_CHANNEL_ID } from '@/convex/lib/streamSetup';
import { useStreamConnection } from '../providers/stream-chat-provider';
import { OfflineStrip } from './offline-strip';
import { SafetyStrip } from './safety-strip';
import {
  CHANNEL_ROOT_PROPS,
  COMPONENT_OVERRIDES,
  SUPPORTED_REACTIONS,
  TEXT_ONLY_CAPABILITIES,
  minimalMessageActions,
} from './thread-channel-config';
import { MessagesUnavailable } from './thread-screen';
import { ThreadSkeleton } from './thread-skeleton';
import { useLocalChannelState } from './thread-messages';

/**
 * The one fixed, no-lifecycle channel every camper is a member of (#372-#375).
 * Unlike a xolacer thread there is no `xolacer_conversations` row, no
 * request/accept/rest/close status, and no per-pair identity to resolve: the
 * designated sender's Stream user was created with its real name ("Xolace",
 * see `streamSetup.createXolaceChannel`), so `MessageAuthor` can show it
 * straight off the message with no override. Composer visibility for
 * everyone else is entirely Stream's own doing — only the sender's channel
 * membership carries the `create-message` grant (see `DESIRED_XOLACE_BROADCAST`),
 * so `<MessageComposer>` renders its stock "can't send" state for anyone else
 * with no client-side check to maintain, and a send that somehow reaches the
 * server the same way any other rejected send does — the SDK's own error
 * handling, not a bespoke path.
 */

// Reactors here are every camper, not a resolved counterpart — showing the
// "who reacted" sheet with no identity override renders Stream's own
// (pseudonymous) reactor names instead of hiding every non-self row, which is
// what `ConversationReactionUser` does with no `ConversationIdentityProvider`
// mounted. Everything else in the map is a safe no-op without one.
const { MessageUserReactionsItem: _reactionIdentityOverride, ...BROADCAST_OVERRIDES } =
  COMPONENT_OVERRIDES;

export function XolaceChannelScreen() {
  const { status: streamStatus, retry } = useStreamConnection();
  const { overlay } = useOverlayContext();

  return (
    <>
      <Stack.Screen options={{ title: 'Xolace', gestureEnabled: overlay === 'none' }} />
      {streamStatus === 'ready' ? (
        <XolaceChannelMessages />
      ) : (
        <View className="flex-1 bg-background">
          <SafetyStrip />
          {streamStatus === 'connecting' ? (
            <ThreadSkeleton />
          ) : (
            <MessagesUnavailable onRetry={retry} />
          )}
        </View>
      )}
    </>
  );
}

function XolaceChannelMessages() {
  const { client } = useChatContext();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState(0);

  // See `ThreadMessages` for why this offset is measured rather than assumed.
  const headerOffset = contentHeight ? windowHeight - contentHeight : 0;
  const onContentLayout = (event: LayoutChangeEvent) =>
    setContentHeight(event.nativeEvent.layout.height);

  const channel = useMemo(
    () => client.channel(XOLACE_BROADCAST_CHANNEL_TYPE, XOLACE_CHANNEL_ID),
    [client],
  );
  const hasLocalState = useLocalChannelState(channel);

  if (!hasLocalState) {
    return (
      <View className="flex-1 bg-background">
        <SafetyStrip />
        <ThreadSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1" onLayout={onContentLayout}>
      <WithComponents overrides={BROADCAST_OVERRIDES}>
        <Channel
          channel={channel}
          keyboardVerticalOffset={headerOffset}
          additionalKeyboardAvoidingViewProps={CHANNEL_ROOT_PROPS}
          topInset={insets.top}
          supportedReactions={SUPPORTED_REACTIONS}
          enforceUniqueReaction
          overrideOwnCapabilities={TEXT_ONLY_CAPABILITIES}
          hasImagePicker={false}
          hasFilePicker={false}
          hasCameraPicker={false}
          hasCommands={false}
          // No `useFlagMessage` here — that mutation is keyed on
          // `xolacer_conversations` and would throw for this channel.
          messageActions={(params) =>
            minimalMessageActions(params, () => {}).filter(
              (action) => action.actionType !== 'flagMessage',
            )
          }
        >
          <SafetyStrip />
          <MessageList />
          <OfflineStrip />
          <MessageComposer />
        </Channel>
      </WithComponents>
    </View>
  );
}
