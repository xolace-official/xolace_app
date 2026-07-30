import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback } from 'heroui-native';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { ConversationRow } from './conversation-row';

export type ConversationList = FunctionReturnType<typeof api.xolacerChat.myConversations>;

/**
 * All lifecycle states live in one list — resting rows dim rather than hide
 * (the history is the point), and a xolacer's incoming requests sit inline
 * with accept/decline so "Waiting" is never a screen to remember.
 */
export function ChatsList({
  conversations,
  onBrowseXolacers,
}: {
  conversations: ConversationList;
  onBrowseXolacers: () => void;
}) {
  const router = useRouter();

  if (conversations.length === 0) {
    return (
      <View className="min-h-95 items-center justify-center gap-2.5 px-8">
        <View className="h-12 w-12 rounded-2xl bg-surface-secondary items-center justify-center">
          <AppText className="text-lg">💬</AppText>
        </View>
        <AppText className="text-[15px] font-semibold text-foreground">
          No conversations yet
        </AppText>
        <AppText className="text-[13px] text-muted text-center leading-5 max-w-60">
          When you message a Xolacer, it&apos;ll live here - including anything you&apos;ve
          talked about before.
        </AppText>
        <PressableFeedback
          onPress={() => {
            playSoftPress();
            onBrowseXolacers();
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
    <View className="gap-2.5">
      {conversations.map((conversation) => (
        <ConversationRow
          key={conversation.id}
          conversation={conversation}
          onPress={() => {
            playSoftPress();
            router.push({
              pathname: '/chat/[conversationId]',
              params: { conversationId: conversation.id },
            });
          }}
        />
      ))}
    </View>
  );
}
