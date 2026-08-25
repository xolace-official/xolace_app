import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { PressableFeedback, useToast } from 'heroui-native';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playAffirmativePress, playSoftPress } from '@/src/lib/haptics';
import { setTabBarHidden } from '@/src/lib/tab-bar';
import { ChatActionSheet } from './chat-action-sheet';
import { ConversationRow } from './conversation-row';

export type ConversationList = FunctionReturnType<typeof api.xolacerChat.myConversations>;

/**
 * All lifecycle states live in one list — resting rows dim rather than hide
 * (the history is the point), and a xolacer's incoming requests sit inline
 * with accept/decline so "Waiting" is never a screen to remember.
 *
 * Archive is the one thing that does hide a row, and it renders through this
 * same component: `archived` swaps which half of the list it was handed, not
 * which screen you're on.
 */
export function ChatsList({
  conversations,
  archived,
  archivedCount,
  onToggleArchived,
  onBrowseXolacers,
}: {
  conversations: ConversationList;
  archived: boolean;
  archivedCount: number;
  onToggleArchived: () => void;
  onBrowseXolacers: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const archiveConversation = useMutation(api.xolacerChat.archiveConversation);
  const unarchiveConversation = useMutation(api.xolacerChat.unarchiveConversation);
  const restConversation = useMutation(api.xolacerChat.restConversation);
  // The long-pressed row, which is also what the action sheet is: the bottom
  // toolbar only exists while something is selected.
  const [sheetFor, setSheetFor] = useState<ConversationList[number] | null>(null);

  // The sheet and the floating tab bar are the same strip of screen: left up,
  // the tab pill sits between Cancel and Archive and swallows the taps under
  // it. The cleanup also covers navigating away with the sheet still open.
  useEffect(() => {
    setTabBarHidden(sheetFor !== null);
    return () => setTabBarHidden(false);
  }, [sheetFor]);

  const toggleArchive = (conversation: ConversationList[number]) => {
    setSheetFor(null);
    playAffirmativePress();
    const call = conversation.archived ? unarchiveConversation : archiveConversation;
    call({ conversationId: conversation.id }).catch((err: unknown) => {
      console.error('[xolacer-chat] archive toggle failed', err);
      toast.show({
        label: conversation.archived ? "Couldn't unarchive" : "Couldn't archive",
        description: 'Something went wrong. Try again.',
        variant: 'default',
      });
    });
  };

  const close = (conversation: ConversationList[number]) => {
    setSheetFor(null);
    playAffirmativePress();
    restConversation({ conversationId: conversation.id }).catch((err: unknown) => {
      console.error('[xolacer-chat] close failed', err);
      toast.show({
        label: "Couldn't close",
        description: 'Something went wrong. Try again.',
        variant: 'default',
      });
    });
  };

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
    <View className="gap-2.5">
      {header}
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
          onLongPress={() => {
            playSoftPress();
            setSheetFor(conversation);
          }}
          onUnarchive={archived ? () => toggleArchive(conversation) : undefined}
        />
      ))}

      {/*
        The action sheet only exists while a row is selected; it renders per
        platform (toolbar on iOS, bottom sheet on Android). Close is the
        xolacer wrapping an open conversation up early — the same `resting`
        the quiet sweep would reach in 14 days, so it runs on the tap with no
        confirmation and nothing is lost either way.
      */}
      {sheetFor && (
        <ChatActionSheet
          conversation={sheetFor}
          onDismiss={() => setSheetFor(null)}
          onArchive={() => toggleArchive(sheetFor)}
          onClose={() => close(sheetFor)}
        />
      )}
    </View>
  );
}
