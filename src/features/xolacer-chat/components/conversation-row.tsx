import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, PressableFeedback, useToast } from 'heroui-native';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { cn } from '@/src/lib/utils';
import { formatCompactTime } from '../utils';
import { XolacerAvatar } from './xolacer-avatar';
import type { ConversationList } from './chats-list';

type Conversation = ConversationList[number];

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

function chipFor(conversation: Conversation): { label: string; tone: 'warn' | 'muted' } | null {
  if (conversation.status === 'requested') {
    return { label: conversation.role === 'xolacer' ? 'New request' : 'Waiting', tone: 'warn' };
  }
  if (conversation.status === 'resting') return { label: 'Resting', tone: 'muted' };
  if (conversation.status === 'closed') return { label: 'Closed', tone: 'muted' };
  return null;
}

function subtitleFor(conversation: Conversation): string {
  if (conversation.status === 'requested') {
    return conversation.role === 'xolacer'
      ? 'Wants to talk — accept when you have space'
      : `Request sent — ${conversation.counterpartName} will reply when they can`;
  }
  if (conversation.status === 'open') return 'Tap to open your conversation';
  if (conversation.status === 'resting') return 'Gone quiet — pick it back up anytime';
  if (conversation.closedReason === 'declined') {
    return `${conversation.counterpartName} couldn't take this one on`;
  }
  if (conversation.closedReason === 'expired') return 'This request quietly expired';
  return 'Everything you two wrote is still here';
}

export function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const acceptRequest = useAction(api.xolacerChat.acceptRequest);
  const declineRequest = useMutation(api.xolacerChat.declineRequest);
  const { toast } = useToast();
  const [pending, setPending] = useState<'accept' | 'decline' | null>(null);

  const run = (kind: 'accept' | 'decline', failLabel: string) => {
    if (pending) return;
    playSoftPress();
    setPending(kind);
    const call =
      kind === 'accept'
        ? acceptRequest({ conversationId: conversation.id })
        : declineRequest({ conversationId: conversation.id });
    call
      .catch((err) => {
        console.error(`[xolacer-chat] ${kind} failed`, err);
        toast.show({
          label: failLabel,
          description: 'Something went wrong. Try again.',
          variant: 'default',
        });
      })
      .finally(() => setPending(null));
  };

  const dim = conversation.status !== 'open';
  const chip = chipFor(conversation);
  const showInlineActions =
    conversation.role === 'xolacer' && conversation.status === 'requested';
  const when = conversation.lastMessageAt ?? conversation.requestedAt;

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conversation.counterpartName}`}
    >
      <View
        className="rounded-3xl bg-surface border border-border/40 p-3.5 gap-3"
        style={styles.borderCurve}
      >
        <View className="flex-row items-center gap-3">
          <XolacerAvatar
            name={conversation.counterpartName}
            photoUrl={conversation.counterpartPhotoUrl}
            muted={dim}
          />
          <View className="flex-1 min-w-0">
            <View className="flex-row items-baseline gap-1.5">
              <AppText
                className={cn(
                  'text-sm font-semibold',
                  dim ? 'text-muted' : 'text-foreground',
                )}
              >
                {conversation.counterpartName}
              </AppText>
              {chip && (
                <View
                  className={cn(
                    'rounded-full px-2 py-0.5',
                    chip.tone === 'warn' ? 'bg-warning/20' : 'bg-surface-tertiary',
                  )}
                >
                  <AppText className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {chip.label}
                  </AppText>
                </View>
              )}
              <AppText className="text-[11px] text-muted ml-auto">
                {formatCompactTime(when)}
              </AppText>
            </View>
            <AppText
              className={cn('text-xs mt-0.5', dim ? 'text-muted' : 'text-foreground/70')}
              numberOfLines={1}
            >
              {subtitleFor(conversation)}
            </AppText>
          </View>
        </View>

        {showInlineActions && (
          <View className="flex-row gap-2">
            <Button
              size="sm"
              className="flex-1"
              isDisabled={pending !== null}
              onPress={() => run('accept', "Couldn't accept this request")}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              isDisabled={pending !== null}
              onPress={() => run('decline', "Couldn't decline this request")}
            >
              Decline
            </Button>
          </View>
        )}
      </View>
    </PressableFeedback>
  );
}
