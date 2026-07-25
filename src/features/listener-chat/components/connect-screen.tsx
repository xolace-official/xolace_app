import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from 'convex/react';
import { Skeleton } from 'heroui-native';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { SegmentedControl } from '@/src/components/shared/segmented-control';
import { cn } from '@/src/lib/utils';
import { ChatsList } from './chats-list';
import { ListenerRoster } from './listener-roster';
import { ListenerSetupBanner } from './listener-setup-banner';

type Segment = 'chats' | 'listeners';

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

function SegmentLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <AppText
      className={cn(
        'text-[13px] font-semibold',
        active ? 'text-foreground' : 'text-muted',
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

  const loading = status === undefined || conversations === undefined;
  const segment: Segment =
    selected ?? (conversations && conversations.length > 0 ? 'chats' : 'listeners');

  if (status && !status.enabled) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8 gap-2">
        <AppText className="text-base font-medium text-foreground">Nothing here yet</AppText>
        <AppText className="text-sm text-muted text-center">
          This space is still being prepared. Check back soon.
        </AppText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-4">
        <AppText className="text-2xl font-semibold text-foreground">Connect</AppText>
      </View>

      {loading ? (
        <View className="px-4 pt-4 gap-3">
          <Skeleton className="h-11 rounded-2xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </View>
      ) : (
        <>
          <View className="px-4 pt-3">
            <SegmentedControl
              value={segment}
              onValueChange={(value) => setSelected(value as Segment)}
              className="relative rounded-2xl bg-surface-secondary p-1"
            >
              <SegmentedControl.Indicator
                className="rounded-xl bg-surface top-1"
                style={styles.borderCurve}
              />
              <SegmentedControl.Item value="chats" className="flex-1 items-center py-2">
                <SegmentLabel label="Chats" active={segment === 'chats'} />
              </SegmentedControl.Item>
              <SegmentedControl.Item value="listeners" className="flex-1 items-center py-2">
                <SegmentLabel label="Listeners" active={segment === 'listeners'} />
              </SegmentedControl.Item>
            </SegmentedControl>
          </View>

          {status?.enabled && status.isListener && !status.listenerProfileComplete && (
            <ListenerSetupBanner />
          )}

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
    </View>
  );
}
