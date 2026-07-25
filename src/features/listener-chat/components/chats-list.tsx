import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback } from 'heroui-native';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { ConversationRow } from './conversation-row';

export type ConversationList = FunctionReturnType<typeof api.listenerChat.myConversations>;

/**
 * All lifecycle states live in one list — resting rows dim rather than hide
 * (the history is the point), and a listener's incoming requests sit inline
 * with accept/decline so "Waiting" is never a screen to remember.
 */
export function ChatsList({
  conversations,
  onBrowseListeners,
}: {
  conversations: ConversationList;
  onBrowseListeners: () => void;
}) {
  const router = useRouter();

  if (conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8 gap-2.5">
        <View className="h-12 w-12 rounded-2xl bg-surface-secondary items-center justify-center">
          <AppText className="text-lg">💬</AppText>
        </View>
        <AppText className="text-[15px] font-semibold text-foreground">
          No conversations yet
        </AppText>
        <AppText className="text-[13px] text-muted text-center leading-5 max-w-[240px]">
          When you message a listener, it&apos;ll live here — including anything you&apos;ve
          talked about before.
        </AppText>
        <PressableFeedback
          onPress={() => {
            playSoftPress();
            onBrowseListeners();
          }}
          accessibilityRole="button"
          accessibilityLabel="See who's listening"
        >
          <AppText className="text-[13px] font-semibold text-accent mt-1.5">
            See who&apos;s listening →
          </AppText>
        </PressableFeedback>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pt-3 pb-6 gap-2.5"
      contentInsetAdjustmentBehavior="automatic"
    >
      {conversations.map((conversation) => (
        <ConversationRow
          key={conversation.id}
          conversation={conversation}
          onPress={() => {
            playSoftPress();
            router.push(`/chat/${conversation.id}` as never);
          }}
        />
      ))}
    </ScrollView>
  );
}
