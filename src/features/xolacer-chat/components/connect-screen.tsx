import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { Skeleton } from 'heroui-native';
import { api } from '@/convex/_generated/api';
import { isSpecialty } from '@/convex/lib/specialties';
import PersonIcon from '@expo/material-symbols/person.xml';
import BedtimeIcon from '@expo/material-symbols/bedtime.xml';
import { AppText } from '@/src/components/shared/app-text';
import { ConfirmationDialog } from '@/src/components/shared/confirmation-dialog';
import { SegmentedControl } from '@/src/components/shared/segmented-control';
import { cn } from '@/src/lib/utils';
import { playSoftPress } from '@/src/lib/haptics';
import { useChatWarmup } from '../use-chat-warmup';
import { useConversationRowActions } from '../use-conversation-row-actions';
import { ChatActionSheet } from './chat-action-sheet';
import { ChatsList } from './chats-list';
import { XolacerRoster } from './xolacer-roster';
import { XolacerSetupBanner } from './xolacer-setup-banner';

type Segment = 'chats' | 'xolacers';

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
 * xolacer's incoming requests) and Xolacers (the roster). Auto-lands on
 * Chats when any conversation exists, on Xolacers otherwise — a first-time
 * user meets the roster, a returning user meets their thread.
 */
export function ConnectScreen({
  specialty,
  view,
  navToken,
}: {
  specialty?: string;
  view?: string;
  navToken?: string;
}) {
  const router = useRouter();
  const status = useQuery(api.xolacerChat.status);
  const conversations = useQuery(api.xolacerChat.myConversations);
  // A specialty always means the roster; otherwise the segment is whatever the
  // route named, if it named one.
  const routedSegment: Segment | null = isSpecialty(specialty)
    ? 'xolacers'
    : view === 'chats' || view === 'xolacers'
      ? view
      : null;
  const [selected, setSelected] = useState<Segment | null>(routedSegment);
  const [filter, setFilter] = useState<string | null>(
    isSpecialty(specialty) ? specialty : null,
  );
  // The Archived view is a filter over the same list, not a route — so it
  // costs nothing to leave and nothing to come back to.
  const [showArchived, setShowArchived] = useState(false);
  const { sheetFor, setSheetFor, toggleArchive, close, deleteFor, setDeleteFor, confirmDelete } =
    useConversationRowActions();

  // Arriving with a specialty (from a profile's "others listen to this too")
  // snaps to the roster filtered to it; arriving from a notification snaps to
  // the segment that notification is about. The tab stays mounted across
  // navigations, so the params are latched and re-applied when they change
  // rather than only read at mount — and `navToken` differs per tap, so a
  // second notification for the same segment still lands.
  const routed = `${specialty ?? ''}|${view ?? ''}|${navToken ?? ''}`;
  const [routedParams, setRoutedParams] = useState(routed);
  if (routed !== routedParams) {
    setRoutedParams(routed);
    if (isSpecialty(specialty)) setFilter(specialty);
    // Sent to the roster without a specialty — a decline, whose copy promises
    // "other xolacers are available". A filter left over from earlier browsing
    // would answer that with a narrowed, possibly empty list.
    else if (routedSegment === 'xolacers') setFilter(null);
    if (routedSegment) setSelected(routedSegment);
  }

  // Opens the Stream connection and warms every channel in the list, so tapping
  // a row lands on messages instead of a skeleton. Held off until `status`
  // confirms the feature is on — a disabled deployment has no token to mint.
  useChatWarmup(conversations, status?.enabled ?? false);

  const loading = status === undefined || conversations === undefined;
  const archivedChats = (conversations ?? []).filter((c) => c.archived);
  const activeChats = (conversations ?? []).filter((c) => !c.archived);
  const segment: Segment =
    selected ?? (activeChats.length > 0 ? 'chats' : 'xolacers');
  // The sheet outlives the list it was raised from now that it renders out
  // here, so leaving Chats — by the segment control or by a notification —
  // would strand it over the roster with the tab bar still hidden.
  if (segment !== 'chats' && sheetFor) setSheetFor(null);

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

  // A published xolacer's way to their own profile — the self-preview everyone
  // else sees, and from there the edit sheet. Before publishing, the setup
  // banner still owns that job and no button renders.
  const published =
    status?.enabled === true && status.isXolacer && status.xolacerProfileComplete;
  // Paused is a state someone can forget they're in now that the status card
  // is gone, so the icon itself carries it: a moon instead of a face, on the
  // one control that leads to the switch.
  const paused = published && !status.xolacerActive;

  return (
    <>
      {published && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon={
              paused
                ? process.env.EXPO_OS === 'ios'
                  ? 'moon.zzz'
                  : BedtimeIcon
                : process.env.EXPO_OS === 'ios'
                  ? 'person.crop.circle'
                  : PersonIcon
            }
            accessibilityLabel={
              paused ? "Your Xolacer profile — you're paused" : 'Your Xolacer profile'
            }
            onPress={() => {
              playSoftPress();
              router.push(`/xolacer/${status.myProfileId}`);
            }}
          />
        </Stack.Toolbar>
      )}

      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-4 pb-10 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="gap-3 pt-2">
            <Skeleton className="h-11 rounded-2xl" />
            {/* Row-shaped, not card-shaped — the list it resolves into is flat. */}
            <Skeleton className="h-[68px] rounded-none" />
            <Skeleton className="h-[68px] rounded-none" />
            <Skeleton className="h-[68px] rounded-none" />
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
              <SegmentedControl.Item value="xolacers" className="flex-1 items-center py-2.5">
                <SegmentLabel label="Xolacers" active={segment === 'xolacers'} />
              </SegmentedControl.Item>
            </SegmentedControl>

            {status?.enabled && status.isXolacer && !status.xolacerProfileComplete && (
              <XolacerSetupBanner />
            )}

            {segment === 'chats' ? (
              <ChatsList
                conversations={showArchived ? archivedChats : activeChats}
                archived={showArchived}
                archivedCount={archivedChats.length}
                onToggleArchived={() => setShowArchived((shown) => !shown)}
                onBrowseXolacers={() => setSelected('xolacers')}
                onLongPress={setSheetFor}
                onOpen={() => setSheetFor(null)}
              />
            ) : (
              <XolacerRoster
                conversations={conversations ?? []}
                filter={filter}
                onFilterChange={setFilter}
              />
            )}
          </>
        )}
      </ScrollView>

      {/*
        The action sheet only exists while a row is long-pressed, and it sits
        out here rather than in the list because Android bottom-aligns it to
        its parent — inside the scroll view that lands it over the middle of
        the screen. Close is the xolacer wrapping an open conversation up
        early, the same `resting` the quiet sweep would reach in 14 days, so it
        runs on the tap with no confirmation and nothing is lost either way.
      */}
      {sheetFor && (
        <ChatActionSheet
          conversation={sheetFor}
          onDismiss={() => setSheetFor(null)}
          onArchive={() => toggleArchive(sheetFor)}
          onClose={() => close(sheetFor)}
          onDelete={() => {
            setSheetFor(null);
            setDeleteFor(sheetFor);
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={deleteFor !== null}
        onOpenChange={(open) => !open && setDeleteFor(null)}
        title="Delete this request?"
        description="It disappears from your list for good. Their copy stays until they delete it too."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isDestructive
      />
    </>
  );
}
