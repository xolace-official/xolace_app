import type { ReactNode } from 'react';
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
 * Archive is the one thing that does hide a row, and it is a route rather than
 * a filter over this list: a place with an address, reached from an entry row
 * passed in as `header`, so it inherits the stack's header and back button and
 * the tab bar keeps working. This component only ever renders the list it was
 * handed — both screens hand it the same kind of rows.
 *
 * The long-press action sheet is deliberately not rendered here — see
 * `useConversationRowActions` for where it has to live instead.
 */
export function ChatsList({
  conversations,
  header,
  onBrowseXolacers,
  onLongPress,
  onOpen,
}: {
  conversations: ConversationList;
  /** Rendered above the rows, full-bleed like them. */
  header?: ReactNode;
  /** Omitted where there is nowhere to browse from — the Archived screen. */
  onBrowseXolacers?: () => void;
  onLongPress: (conversation: ConversationList[number]) => void;
  onOpen: () => void;
}) {
  const router = useRouter();

  if (conversations.length === 0) {
    return (
      <View className="gap-2.5">
        {header && <View className="-mx-4">{header}</View>}
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
          {onBrowseXolacers && (
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
      {header}
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
