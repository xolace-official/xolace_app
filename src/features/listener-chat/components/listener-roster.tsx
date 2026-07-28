import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback } from 'heroui-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { cn } from '@/src/lib/utils';
import { ListenerAvatar } from './listener-avatar';
import { NewListenerChip, RatingStars } from './rating-stars';
import { SpecialtyChips, SpecialtyFilter } from './specialty-chips';
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
  const [filter, setFilter] = useState<string | null>(null);

  if (directory !== undefined && directory.length === 0) {
    return (
      <View className="min-h-95 items-center justify-center gap-2.5 px-8">
        <View className="h-12 w-12 rounded-2xl bg-surface-secondary items-center justify-center">
          <AppText className="text-lg">🕯️</AppText>
        </View>
        <AppText className="text-[15px] font-semibold text-foreground">
          No one&apos;s here just yet
        </AppText>
        <AppText className="text-[13px] text-muted text-center leading-5 max-w-60">
          Listeners are still settling in. They&apos;ll show up here as they arrive — check
          back soon.
        </AppText>
      </View>
    );
  }

  const openWith = new Set(
    conversations
      .filter((c) => c.role === 'user' && c.status === 'open')
      .map((c) => c.listenerProfileId),
  );

  const listeners = directory ?? [];
  const offered = [...new Set(listeners.flatMap((listener) => listener.specialties))];
  const visible = filter
    ? listeners.filter((listener) =>
        (listener.specialties as readonly string[]).includes(filter),
      )
    : listeners;

  return (
    <View className="gap-2.5">
      <SpecialtyFilter available={offered} selected={filter} onSelect={setFilter} />

      {visible.map((listener) => {
        const talking = openWith.has(listener.listenerProfileId);
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
              <View className="flex-1 min-w-0 gap-1">
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
                  {/* Scores share one right-hand column so the eye reads down
                      it instead of hunting; capacity outranks the score. */}
                  <View className="ml-auto pl-2">
                    {listener.atCapacity ? (
                      <View className="rounded-full bg-surface-tertiary px-2 py-0.5">
                        <AppText className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Full right now
                        </AppText>
                      </View>
                    ) : listener.rating === undefined ? (
                      <NewListenerChip />
                    ) : (
                      <RatingStars
                        rating={listener.rating}
                        ratingCount={listener.ratingCount}
                      />
                    )}
                  </View>
                </View>
                <AppText className="text-xs text-muted leading-4" numberOfLines={2}>
                  {listener.bio}
                </AppText>
                <SpecialtyChips
                  specialties={listener.specialties}
                  muted={listener.atCapacity}
                  className="mt-0.5"
                />
              </View>
            </View>
          </PressableFeedback>
        );
      })}

      {filter !== null && visible.length === 0 && (
        <AppText className="py-8 text-center text-[13px] leading-5 text-muted">
          Nobody&apos;s listed that right now. Try another tag, or browse everyone.
        </AppText>
      )}
    </View>
  );
}
