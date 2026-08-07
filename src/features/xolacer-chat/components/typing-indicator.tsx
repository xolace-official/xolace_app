import { View } from 'react-native';
import { useChatContext, useTypingContext } from 'stream-chat-expo';
import { AppText } from '@/src/components/shared/app-text';
import { useConversationIdentity } from './message-author';

/**
 * Replaces Stream's stock `TypingIndicator` (registered via `WithComponents`
 * in `thread-messages.tsx`). The stock one renders the other user's raw
 * Stream avatar/name (`UserAvatarStack`) with no override slot — see
 * `ConversationMessageAuthor` for why that record can never be shown as-is.
 * `useTypingContext` only tells us *someone* is typing; the name always comes
 * from the conversation, matching every other identity surface here.
 */
export function ConversationTypingIndicator() {
  const { typing } = useTypingContext();
  const { client } = useChatContext();
  const identity = useConversationIdentity();

  const othersTyping = Object.values(typing).some((event) => event.user?.id !== client?.userID);
  if (!othersTyping || !identity) return null;

  return (
    <View className="flex-row items-center">
      <AppText className="text-xs text-muted">
        {identity.conversation.counterpartName} is typing…
      </AppText>
    </View>
  );
}
