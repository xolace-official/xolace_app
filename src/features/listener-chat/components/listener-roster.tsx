import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback } from 'heroui-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { cn } from '@/src/lib/utils';
import { ListenerAvatar } from './listener-avatar';
import type { ConversationList } from './chats-list';

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });

/**
 * The roster: every published, active listener. A capped listener stays
 * visible but dimmed ("Full right now") — vanishing from a six-person list
 * would read as a bug. "Talking" marks listeners you already have an open
 * thread with.
 */
export function ListenerRoster({ conversations }: { conversations: ConversationList }) {
  const router = useRouter();
  const directory = useQuery(api.listenerChat.directory);

  if (directory !== undefined && directory.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8 gap-2.5">
        <View className="h-12 w-12 rounded-2xl bg-surface-secondary items-center justify-center">
          <AppText className="text-lg">🕯️</AppText>
        </View>
        <AppText className="text-[15px] font-semibold text-foreground">
          No one&apos;s here just yet
        </AppText>
        <AppText className="text-[13px] text-muted text-center leading-5 max-w-[240px]">
          Listeners are still settling in. They&apos;ll show up here as they arrive — check
          back soon.
        </AppText>
      </View>
    );
  }

  const openWith = new Set(
    conversations
      .filter((c) => c.role === 'user' && c.status === 'open')
      .map((c) => c.counterpartName),
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pt-3 pb-6 gap-2.5"
      contentInsetAdjustmentBehavior="automatic"
    >
      {(directory ?? []).map((listener) => {
        const talking = openWith.has(listener.displayName);
        return (
          <PressableFeedback
            key={listener.listenerProfileId}
            onPress={() => {
              playSoftPress();
              router.push(`/listener/${listener.listenerProfileId}` as never);
            }}
            accessibilityRole="button"
            accessibilityLabel={`View ${listener.displayName}'s profile`}
          >
            <View
              className="flex-row items-start gap-3 rounded-3xl bg-surface border border-border/40 p-3.5"
              style={styles.borderCurve}
            >
              <ListenerAvatar
                name={listener.displayName}
                photoUrl={listener.photoUrl}
                muted={listener.atCapacity}
              />
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <AppText
                    className={cn(
                      'text-sm font-semibold',
                      listener.atCapacity ? 'text-muted' : 'text-foreground',
                    )}
                  >
                    {listener.displayName}
                  </AppText>
                  {talking && (
                    <View className="rounded-full bg-success/15 px-2 py-0.5">
                      <AppText className="text-[10px] font-semibold uppercase tracking-wide text-success">
                        Talking
                      </AppText>
                    </View>
                  )}
                  {listener.atCapacity && (
                    <View className="rounded-full bg-surface-tertiary px-2 py-0.5 ml-auto">
                      <AppText className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Full right now
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText className="text-xs text-muted mt-0.5 leading-4" numberOfLines={2}>
                  {listener.bio}
                </AppText>
              </View>
            </View>
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
