import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { useToast } from 'heroui-native';
import { api } from '@/convex/_generated/api';
import { playAffirmativePress } from '@/src/lib/haptics';
import { setTabBarHidden } from '@/src/lib/tab-bar';
import type { ConversationList } from './components/chats-list';

/**
 * The long-press actions for a conversation row, and the row they belong to.
 *
 * This lives above the list rather than inside it because of where the sheet
 * has to render: on Android the bottom toolbar is an ordinary absolutely
 * filling view, so it bottom-aligns to whatever it is mounted in. Inside the
 * scrolling list that means the middle of the screen. The caller renders it as
 * a sibling of the scroll view, which is the only place "bottom" means the
 * bottom of the screen on both platforms.
 */
export function useConversationRowActions() {
  const { toast } = useToast();
  const archiveConversation = useMutation(api.xolacerChat.archiveConversation);
  const unarchiveConversation = useMutation(api.xolacerChat.unarchiveConversation);
  const restConversation = useMutation(api.xolacerChat.restConversation);
  const deleteConversation = useMutation(api.xolacerChat.deleteConversation);
  // The long-pressed row, which is also what the action sheet is: the bottom
  // toolbar only exists while something is selected.
  const [sheetFor, setSheetFor] = useState<ConversationList[number] | null>(null);
  // The row Delete was tapped on — and, the same way, what the confirmation
  // dialog is. Delete is the only one of these that can't be undone, so it is
  // the only one that asks first.
  const [deleteFor, setDeleteFor] = useState<ConversationList[number] | null>(null);

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

  const confirmDelete = () => {
    const conversation = deleteFor;
    if (!conversation) return;
    setDeleteFor(null);
    playAffirmativePress();
    deleteConversation({ conversationId: conversation.id }).catch((err: unknown) => {
      console.error('[xolacer-chat] delete failed', err);
      toast.show({
        label: "Couldn't delete",
        description: 'Something went wrong. Try again.',
        variant: 'default',
      });
    });
  };

  return {
    sheetFor,
    setSheetFor,
    toggleArchive,
    close,
    deleteFor,
    setDeleteFor,
    confirmDelete,
  };
}
