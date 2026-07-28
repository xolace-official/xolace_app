import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from 'convex/react';
import { Skeleton } from 'heroui-native';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { SegmentedControl } from '@/src/components/shared/segmented-control';
import { cn } from '@/src/lib/utils';
import { useChatWarmup } from '../use-chat-warmup';
import { ChatsList } from './chats-list';
import { ListenerRoster } from './listener-roster';
import { ListenerSetupBanner } from './listener-setup-banner';
import { ListenerStatusCard } from './listener-status-card';

type Segment = 'chats' | 'listeners';

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });


function SegmentLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <AppText
      className={cn(
        'text-[13px] font-semibold',
        active ? 'text-accent-foreground' : 'text-muted',
      )}
    >
      {label}
    </AppText>
  );
}

/**
 * The Connect tab: Chats (conversations in every lifecycle state, including a
 * listener's incoming requests) and Listeners (the roster). Auto-lands on
 * Chats when any conversation exists, on Listeners otherwise — a first-time
 * user meets the roster, a returning user meets their thread.
 */
export function ConnectScreen() {
  const status = useQuery(api.listenerChat.status);
  const conversations = useQuery(api.listenerChat.myConversations);
  const [selected, setSelected] = useState<Segment | null>(null);

  // Opens the Stream connection and warms every channel in the list, so tapping
  // a row lands on messages instead of a skeleton. Held off until `status`
  // confirms the feature is on — a disabled deployment has no token to mint.
  useChatWarmup(conversations, status?.enabled ?? false);

  const loading = status === undefined || conversations === undefined;
  const segment: Segment =
    selected ?? (conversations && conversations.length > 0 ? 'chats' : 'listeners');

  if (status && !status.enabled) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-8">
        <AppText className="text-base font-medium text-foreground">Nothing here yet</AppText>
        <AppText className="text-center text-sm text-muted">
          This space is still being prepared. Check back soon.
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-10 gap-4"
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View className="gap-3 pt-2">
          <Skeleton className="h-11 rounded-2xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </View>
      ) : (
        <>
          <SegmentedControl
            value={segment}
            onValueChange={(value) => setSelected(value as Segment)}
            className="relative mt-1 rounded-2xl bg-surface-secondary p-1"
          >
            <SegmentedControl.Indicator
              className="top-1 rounded-xl bg-accent"
              style={styles.borderCurve}
            />
            <SegmentedControl.Item value="chats" className="flex-1 items-center py-2.5">
              <SegmentLabel label="Chats" active={segment === 'chats'} />
            </SegmentedControl.Item>
            <SegmentedControl.Item value="listeners" className="flex-1 items-center py-2.5">
              <SegmentLabel label="Listeners" active={segment === 'listeners'} />
            </SegmentedControl.Item>
          </SegmentedControl>

          {status?.enabled &&
            status.isListener &&
            (status.listenerProfileComplete ? (
              <ListenerStatusCard active={status.listenerActive} />
            ) : (
              <ListenerSetupBanner />
            ))}

          {segment === 'chats' ? (
            <ChatsList
              conversations={conversations ?? []}
              onBrowseListeners={() => setSelected('listeners')}
            />
          ) : (
            <ListenerRoster conversations={conversations ?? []} />
          )}
        </>
      )}
    </ScrollView>
  );
}
