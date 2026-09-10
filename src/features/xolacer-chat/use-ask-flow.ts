import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from 'heroui-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { playSoftPress } from '@/src/lib/haptics';
import { posthog } from '@/src/config/posthog';
import { useAppStore } from '@/src/store/store';
import { chatLimitError, declineCooldownNote } from '@/src/features/xolacer-chat/utils';

/** `gate` stands in front of a request; `reference` is the same content pulled
 *  up from "What to expect" and sends nothing. */
export type PrimerMode = 'gate' | 'reference' | null;

/**
 * Everything behind "Ask to talk": the request itself, its limit-error toast,
 * and the one-time primer that gates a seeker's first ask.
 *
 * The primer's flag and the request are written on the same success path —
 * acknowledging is only meaningful once something was actually sent, so a
 * request that fails a limit check leaves the sheet open, the flag unset, and
 * the seeker able to try again.
 */
export function useAskFlow({
  xolacerProfileId,
  displayName,
}: {
  xolacerProfileId: Id<'emotional_profiles'>;
  displayName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const requestConversation = useMutation(api.xolacerChat.requestConversation);
  const primerSeen = useAppStore((s) => s.xolacerPrimerSeen);
  const setPrimerSeen = useAppStore((s) => s.setXolacerPrimerSeen);
  const [primerMode, setPrimerMode] = useState<PrimerMode>(null);

  const openThread = (conversationId: string) =>
    router.replace(`/chat/${conversationId}`);

  const sendRequest = (fromGate: boolean) => {
    requestConversation({ xolacerProfileId })
      .then((conversationId) => {
        // Only the success path acknowledges and closes — a limit error leaves
        // the seeker exactly where they were, reading the toast, with the
        // primer unacknowledged so nothing half-commits.
        if (fromGate) {
          setPrimerSeen(true);
          posthog.capture('xolacer_primer_resolved', { outcome: 'sent' });
        }
        setPrimerMode(null);
        openThread(conversationId);
      })
      .catch((error: unknown) => {
        const data = chatLimitError(error);
        toast.show({
          label:
            // Only reachable from a screen that loaded before the decline —
            // the CTA replaces itself once the cooldown is in the query.
            data?.code === 'decline_cooldown' && data.until
              ? declineCooldownNote(displayName, data.until)
              : data?.code === 'pending_request_limit'
                ? `You're already waiting on ${data.max ?? 2} Xolacers. Give them a moment to reply.`
                : data?.code === 'open_conversation_limit'
                  ? `You've got ${data.max ?? 3} conversations open. Let one rest before starting another.`
                  : `${displayName} isn't taking conversations right now.`,
        });
      });
  };

  const handleAsk = () => {
    playSoftPress();
    if (primerSeen) {
      sendRequest(false);
      return;
    }
    posthog.capture('xolacer_primer_shown');
    setPrimerMode('gate');
  };

  const handlePrimerConfirm = () => {
    playSoftPress();
    sendRequest(true);
  };

  // Dismissing a gate — swipe, backdrop or close button — is an abandonment
  // whether or not a send was attempted first, and writes no flag.
  const handlePrimerClose = () => {
    if (primerMode === 'gate')
      posthog.capture('xolacer_primer_resolved', { outcome: 'dismissed' });
    setPrimerMode(null);
  };

  const openPrimerReference = () => {
    playSoftPress();
    setPrimerMode('reference');
  };

  return {
    primerMode,
    openThread,
    handleAsk,
    handlePrimerConfirm,
    handlePrimerClose,
    openPrimerReference,
  };
}
