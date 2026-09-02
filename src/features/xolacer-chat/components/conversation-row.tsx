import { View } from 'react-native';
import { PressableFeedback } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { cn } from '@/src/lib/utils';
import { canHoldUnread, unreadBadge } from '@/src/features/xolacer-chat/utils';
import { formatCompactTime } from '@/src/features/xolacer-chat/format-time';
import { useConversationUnreadCount } from '@/src/features/xolacer-chat/use-conversation-unread-count';
import { XolacerAvatar } from './xolacer-avatar';
import { PresenceDot } from './presence-dot';
import { rowPresentation } from './conversation-row-labels';
import type { ConversationList } from './chats-list';

type Conversation = ConversationList[number];

export function ConversationRow({
  conversation,
  onPress,
  onLongPress,
  showSeparator,
}: {
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
  /** Omitted after the last row, so the list ends rather than stops. */
  showSeparator: boolean;
}) {
  // Both the subscription and the pill read the same rule, so a row that could
  // never show a count doesn't register a listener for one either.
  const unreadCount = useConversationUnreadCount(
    canHoldUnread(conversation.status) ? conversation.streamChannelId : undefined,
  );
  const badge = unreadBadge(conversation.status, unreadCount);
  const { chip, statusLine, requestDot, mutedAvatar } = rowPresentation(conversation);
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
      <View className="px-4">
        <View className="flex-row items-center gap-3 py-3">
          <View>
            <XolacerAvatar
              name={conversation.counterpartName}
              photoUrl={conversation.counterpartPhotoUrl}
              muted={mutedAvatar}
            />
            {conversation.counterpartPresent && <PresenceDot />}
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5">
              <AppText
                className={cn(
                  'shrink text-sm font-semibold',
                  mutedAvatar ? 'text-muted' : 'text-foreground',
                )}
                numberOfLines={1}
              >
                {conversation.counterpartName}
              </AppText>
              {/* Beside the name rather than above the sentence: on line 2 the
                  pill ate half the width and truncated the one line that
                  explains the state. The name gives up space for it instead. */}
              {chip && (
                <View
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5',
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
              {/* Decorative: the count is already in the row's own accessibility
                  label, so the pill shouldn't announce it twice. */}
              {badge && (
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
              {requestDot && (
                <View
                  className="size-2 rounded-full bg-accent"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              )}
            </View>
            {statusLine && (
              <AppText className="text-xs text-muted mt-0.5" numberOfLines={1}>
                {statusLine}
              </AppText>
            )}
          </View>
        </View>
        {/* Inset to the text column: avatar (44) + gap (12). */}
        {showSeparator && <View className="h-px bg-border/40 ml-14" />}
      </View>
    </PressableFeedback>
  );
}
