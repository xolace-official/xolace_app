import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, PressableFeedback, useToast } from 'heroui-native';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { cn } from '@/src/lib/utils';
import {
  acceptFailureLabel,
  canHoldUnread,
  chatLimitError,
  unreadBadge,
} from '@/src/features/xolacer-chat/utils';
import { formatCompactTime } from '@/src/features/xolacer-chat/format-time';
import { useConversationUnreadCount } from '@/src/features/xolacer-chat/use-conversation-unread-count';
import { XolacerAvatar } from './xolacer-avatar';
import { PresenceDot } from './presence-dot';
import { chipFor, originLabel, subtitleFor } from './conversation-row-labels';
import type { ConversationList } from './chats-list';

type Conversation = ConversationList[number];

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

export function ConversationRow({
  conversation,
  onPress,
  onLongPress,
  onUnarchive,
}: {
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
  /** Present only in the Archived view — the inline way back out of it. */
  onUnarchive?: () => void;
}) {
  const acceptRequest = useAction(api.xolacerChat.acceptRequest);
  const declineRequest = useMutation(api.xolacerChat.declineRequest);
  const { toast } = useToast();
  const [pending, setPending] = useState<'accept' | 'decline' | null>(null);
  // Both the subscription and the pill read the same rule, so a row that could
  // never show a count doesn't register a listener for one either.
  const unreadCount = useConversationUnreadCount(
    canHoldUnread(conversation.status) ? conversation.streamChannelId : undefined,
  );
  const badge = unreadBadge(conversation.status, unreadCount);

  const run = (kind: 'accept' | 'decline', failLabel: string) => {
    if (pending) return;
    playSoftPress();
    setPending(kind);
    const call =
      kind === 'accept'
        ? acceptRequest({ conversationId: conversation.id })
        : declineRequest({ conversationId: conversation.id });
    call
      .catch((err: unknown) => {
        console.error(`[xolacer-chat] ${kind} failed`, err);

        const isCap = chatLimitError(err)?.code === 'open_conversation_limit';
        toast.show({
          label: failLabel,
          description:
            kind === 'accept' && isCap
              ? acceptFailureLabel(err)
              : 'Something went wrong. Try again.',
          variant: 'default',
        });
      })
      .finally(() => setPending(null));
  };

  const dim = conversation.status !== 'open';
  const chip = chipFor(conversation);
  const origin = originLabel(conversation);
  const showInlineActions =
    conversation.role === 'xolacer' && conversation.status === 'requested';
  const when = conversation.lastMessageAt ?? conversation.requestedAt;

  return (
    <PressableFeedback
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conversation.counterpartName}${
        conversation.counterpartPresent ? ', here right now' : ''
      }${badge ? `, ${badge.a11y}` : ''}`}
    >
      <View
        className="rounded-3xl bg-surface border border-border/40 p-3.5 gap-3"
        style={styles.borderCurve}
      >
        <View className="flex-row items-center gap-3">
          <View>
            <XolacerAvatar
              name={conversation.counterpartName}
              photoUrl={conversation.counterpartPhotoUrl}
              muted={dim}
            />
            {conversation.counterpartPresent && <PresenceDot />}
          </View>
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
              {badge && (
                // Decorative: the count is already in the row's own
                // accessibility label, so the pill shouldn't announce it twice.
                <View
                  className="min-w-[18px] h-[18px] rounded-full bg-accent items-center justify-center px-1"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <AppText className="text-[10px] font-semibold text-accent-foreground">
                    {badge.label}
                  </AppText>
                </View>
              )}
            </View>
            <AppText
              className={cn('text-xs mt-0.5', dim ? 'text-muted' : 'text-foreground/70')}
              numberOfLines={1}
            >
              {subtitleFor(conversation)}
            </AppText>
            {origin && (
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <View className="size-1.5 rounded-full bg-accent" />
                <AppText className="text-[11px] text-muted">{origin}</AppText>
              </View>
            )}
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

        {onUnarchive && (
          <Button size="sm" variant="secondary" onPress={onUnarchive}>
            Unarchive
          </Button>
        )}
      </View>
    </PressableFeedback>
  );
}
