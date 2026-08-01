import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from 'heroui-native';
import { useAction } from 'convex/react';
import BlockIcon from '@expo/material-symbols/block.xml';
import { api } from '@/convex/_generated/api';
import { OverflowMenu } from '@/src/components/shared/overflow-menu';
import { ConfirmationDialog } from '@/src/components/shared/confirmation-dialog';
import { playSoftPress } from '@/src/lib/haptics';
import type { ThreadConversation } from './thread-screen';

/**
 * Block lives behind an overflow menu and a confirmation because it cannot be
 * undone — the server refuses to reopen a conversation closed this way, and
 * that refusal is the point. The confirmation says so out loud.
 *
 * Both roles get it. A xolacer's only other exit stops working the moment they
 * accept a request.
 */
export function BlockMenu({ conversation }: { conversation: ThreadConversation }) {
  const router = useRouter();
  const { toast } = useToast();
  const blockConversation = useAction(api.xolacerChat.blockConversation);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const handleBlock = () => {
    if (pending) return;
    setPending(true);
    blockConversation({ conversationId: conversation.id })
      .then(() => {
        setConfirming(false);
        // The row is gone from the list behind us; nothing here to return to.
        router.back();
      })
      .catch((err) => {
        console.error('[xolacer-chat] block failed', err);
        // Closed, not left open mid-claim: nothing was blocked, and the server
        // is idempotent, so opening the menu again and retrying is harmless.
        setConfirming(false);
        toast.show({
          label: "Couldn't block this conversation",
          description: 'Something went wrong. Try again.',
        });
      })
      .finally(() => setPending(false));
  };

  return (
    <>
      <OverflowMenu>
        <OverflowMenu.Action
          destructive
          icon={process.env.EXPO_OS === 'ios' ? 'hand.raised' : BlockIcon}
          onPress={() => {
            playSoftPress();
            setConfirming(true);
          }}
        >
          Block
        </OverflowMenu.Action>
      </OverflowMenu>

      <ConfirmationDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title="Block this conversation?"
        description="Neither of you will be able to send another message here, and this can't be undone. Everything already written stays."
        confirmLabel="Block"
        onConfirm={handleBlock}
        isDestructive
        isLoading={pending}
      />
    </>
  );
}
