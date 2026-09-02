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
 * All lifecycle states live in one flat list — one continuous run of rows the
 * way every messaging app reads, so a request or a resting thread is never a
 * screen to remember.
 *
 * Archive is the one thing that does hide a row, and it renders through this
 * same component: `archived` swaps which half of the list it was handed, not
 * which screen you're on. Getting back out is the long-press sheet.
 *
 * The long-press action sheet is deliberately not rendered here — see
 * `useConversationRowActions` for where it has to live instead.
 */
export function ChatsList({
  conversations,
  archived,
  archivedCount,
  onToggleArchived,
  onBrowseXolacers,
  onLongPress,
  onOpen,
}: {
  conversations: ConversationList;
  archived: boolean;
  archivedCount: number;
  onToggleArchived: () => void;
  onBrowseXolacers: () => void;
  onLongPress: (conversation: ConversationList[number]) => void;
  onOpen: () => void;
}) {
  const router = useRouter();

  const header = archived ? (
    <PressableFeedback
      onPress={() => {
        playSoftPress();
        onToggleArchived();
      }}
      accessibilityRole="button"
      accessibilityLabel="Back to chats"
    >
      <AppText className="text-[13px] font-semibold text-accent">← Chats</AppText>
    </PressableFeedback>
  ) : archivedCount > 0 ? (
    <PressableFeedback
      onPress={() => {
        playSoftPress();
        onToggleArchived();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Archived, ${archivedCount} conversations`}
    >
      <AppText className="text-[13px] font-semibold text-muted">
        Archived ({archivedCount}) →
      </AppText>
    </PressableFeedback>
  ) : null;

  if (conversations.length === 0) {
    return (
      <View className="gap-2.5">
        {header}
        <View className="min-h-95 items-center justify-center gap-2.5 px-8">
          <View className="h-12 w-12 rounded-2xl bg-surface-secondary items-center justify-center">
            <AppText className="text-lg">{archived ? '🗂️' : '💬'}</AppText>
          </View>
          <AppText className="text-[15px] font-semibold text-foreground">
            {archived ? 'Nothing archived' : 'No conversations yet'}
          </AppText>
          <AppText className="text-[13px] text-muted text-center leading-5 max-w-60">
            {archived
              ? 'Archived conversations live here until something new happens on them.'
              : "When you message a Xolacer, it'll live here - including anything you've talked about before."}
          </AppText>
          {!archived && (
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
          )}
        </View>
      </View>
    );
  }

  return (
    // Rows are full-bleed, so the list cancels the scroll container's own
    // horizontal padding and each row puts it back on itself.
    <View className="-mx-4">
      {header && <View className="px-4 pb-2.5">{header}</View>}
      {conversations.map((conversation, index) => (
        <ConversationRow
          key={conversation.id}
          conversation={conversation}
          showSeparator={index < conversations.length - 1}
          onPress={() => {
            playSoftPress();
            // Opening a thread leaves this screen mounted, so a sheet raised on
            // another row would still be waiting — over the wrong row, with the
            // tab bar still hidden — when you come back.
            onOpen();
            router.push({
              pathname: '/chat/[conversationId]',
              params: { conversationId: conversation.id },
            });
          }}
          onLongPress={() => {
            playSoftPress();
            onLongPress(conversation);
          }}
        />
      ))}
    </View>
  );
}
