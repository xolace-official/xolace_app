import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, PressableFeedback, Skeleton, useThemeColor, useToast } from 'heroui-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { isSpecialty, specialtyListensTo } from '@/convex/lib/specialties';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import {
  chatLimitError,
  declineCooldownActive,
  declineCooldownNote,
  formatMonthYear,
  hasSpoken,
} from '@/src/features/xolacer-chat/utils';
import { XolacerMenu } from './xolacer-menu';
import { XolacerAvatar } from './xolacer-avatar';
import { NewXolacerChip, RatingStars } from './rating-stars';
import { SpecialtyChips } from './specialty-chips';

type Profile = NonNullable<FunctionReturnType<typeof api.xolacerChat.xolacerProfile>>;

const styles = StyleSheet.create({
  borderCurve: { borderCurve: 'continuous' },
  factIcon: { marginTop: 2 },
});

/** Native back chevron — liquid glass on iOS 26, Material back arrow on Android. */
const HEADER_OPTIONS = {
  headerShown: true,
  headerTransparent: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerBackVisible: true,
  headerBackButtonDisplayMode: 'minimal',
} as const;

const PERSON_ICON = { ios: 'person', android: 'person', web: 'person' } as const;
const LOCK_ICON = { ios: 'lock', android: 'lock', web: 'lock' } as const;
const CHAT_ICON = {
  ios: 'bubble.left.and.bubble.right',
  android: 'forum',
  web: 'forum',
} as const;
const MOON_ICON = { ios: 'moon', android: 'bedtime', web: 'bedtime' } as const;

export function XolacerProfileScreen({
  profileId,
  specialty,
}: {
  profileId: string;
  specialty?: string;
}) {
  const profile = useQuery(api.xolacerChat.xolacerProfile, {
    xolacerProfileId: profileId as Id<'emotional_profiles'>,
  });

  if (profile === undefined) return <ProfileSkeleton />;
  if (profile === null) return <ProfileUnavailable />;
  return <ProfileBody profile={profile} specialty={specialty} />;
}

function ProfileBody({ profile, specialty }: { profile: Profile; specialty?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const requestConversation = useMutation(api.xolacerChat.requestConversation);

  const { conversation } = profile;
  const hasThread = conversation !== null && conversation.status !== 'closed';
  const coolingDown = declineCooldownActive(conversation?.retryAvailableAt);

  const openThread = (conversationId: string) =>
    router.replace(`/chat/${conversationId}`);

  const handleAsk = () => {
    playSoftPress();
    requestConversation({ xolacerProfileId: profile.xolacerProfileId })
      .then(openThread)
      .catch((error: unknown) => {
        const data = chatLimitError(error);
        toast.show({
          label:
            // Only reachable from a screen that loaded before the decline —
            // the CTA below replaces itself once the cooldown is in the query.
            data?.code === 'decline_cooldown' && data.until
              ? declineCooldownNote(profile.displayName, data.until)
              : data?.code === 'pending_request_limit'
                ? `You're already waiting on ${data.max ?? 2} Xolacers. Give them a moment to reply.`
                : data?.code === 'open_conversation_limit'
                  ? `You've got ${data.max ?? 3} conversations open. Let one rest before starting another.`
                  : `${profile.displayName} isn't taking conversations right now.`,
        });
      });
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={HEADER_OPTIONS} />


      {!profile.isSelf && (
        <XolacerMenu
          origin="profile"
          profileId={profile.xolacerProfileId}
          name={profile.displayName}
          conversationId={conversation?.id}
          hasHistory={conversation ? hasSpoken(conversation) : false}
        />
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8 gap-7"
        contentContainerStyle={{ paddingTop: insets.top + 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-3">
          <XolacerAvatar
            name={profile.displayName}
            photoUrl={profile.photoUrl}
            size="lg"
            muted={!profile.available}
          />
          <View className="items-center gap-1.5">
            <AppText className="text-[26px] font-semibold leading-8 text-foreground">
              {profile.displayName}
            </AppText>
            <ProfileRating profile={profile} />
            <AppText className="text-xs text-muted">
              Xolacer since {formatMonthYear(profile.xolacerSince)} · replies within a day
            </AppText>
          </View>
        </View>

        <View className="gap-4">
          <AppText className="px-2 text-center text-[17px] leading-7 text-foreground">
            &ldquo;{profile.bio}&rdquo;
          </AppText>
          <SpecialtyChips specialties={profile.specialties} className="justify-center" />
        </View>

        <View className="gap-3.5">
          {hasThread && (
            <Block accent title="You've talked before">
              <Fact icon={CHAT_ICON}>
                Your conversation is still here.{' '}
                {conversation.status === 'resting'
                  ? "Picking it back up doesn't need a new request."
                  : 'Open it any time.'}
              </Fact>
            </Block>
          )}

          {/* Suppressed under a cooldown: the CTA already names the real
              reason and its end date, and "isn't taking new conversations"
              alongside it reads as a second, different no. */}
          {!profile.available && !hasThread && !coolingDown && (
            <Block accent title="Not right now">
              <Fact icon={MOON_ICON}>
                {profile.displayName} isn&apos;t taking new conversations at the moment.
                Nothing to do with you — try someone else on the roster.
              </Fact>
            </Block>
          )}

          <Block title="What to expect">
            <Fact icon={PERSON_ICON}>
              {profile.displayName} is a trained peer Xolacer, not a therapist — no
              diagnoses, no clinical advice.
            </Fact>
            <Fact icon={LOCK_ICON}>
              Your chat is private between you two. It&apos;s never linked to your
              reflections.
            </Fact>
          </Block>
        </View>
      </ScrollView>

      <View
        className="gap-3 border-t border-border/40 px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <ProfileCta
          profile={profile}
          onAsk={handleAsk}
          onOpen={() => {
            playSoftPress();
            if (conversation) openThread(conversation.id);
          }}
        />
        {isSpecialty(specialty) && (
          <OtherListeners
            specialty={specialty}
            onPress={() => {
              playSoftPress();
              router.push({ pathname: '/connect', params: { specialty } });
            }}
          />
        )}
      </View>
    </View>
  );
}

/**
 * The denominator is always visible next to the score — "23 conversations
 * rated" is what stops 4.9 reading as an absolute verdict on a person. Under
 * the display threshold the reason is spelled out rather than showing an empty
 * row of stars, which would read as a bad score.
 */
function ProfileRating({ profile }: { profile: Profile }) {
  if (profile.rating === undefined) {
    return (
      <View className="items-center gap-1">
        <NewXolacerChip />
        <AppText className="text-[11px] text-muted">
          Not enough conversations rated yet
        </AppText>
      </View>
    );
  }

  return (
    <View className="items-center gap-1">
      <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
      <AppText className="text-[11px] text-muted">
        {profile.ratingCount} conversation{profile.ratingCount === 1 ? '' : 's'} rated
      </AppText>
    </View>
  );
}

/**
 * The CTA names the request/accept reality instead of implying a chat opens on
 * tap, and is driven straight off the conversation row's existence + status so
 * there is no extra state to compute.
 */
function ProfileCta({
  profile,
  onAsk,
  onOpen,
}: {
  profile: Profile;
  onAsk: () => void;
  onOpen: () => void;
}) {
  const { conversation, available, displayName, isSelf } = profile;
  const retryAt = conversation?.retryAvailableAt;


  if (isSelf) {
    return <Note>This is how your profile looks to everyone else.</Note>;
  }

  if (conversation && conversation.status !== 'closed') {
    return (
      <>
        <Button onPress={onOpen}>
          {conversation.status === 'requested' ? 'See your request' : 'Open chat'}
        </Button>
        {conversation.status === 'requested' && (
          <Note>{displayName} has your request and can accept when they&apos;re ready.</Note>
        )}
      </>
    );
  }

  // Ahead of the availability branch: this xolacer having space is not the
  // reason, and "not taking conversations" would be the app telling a seeker
  // something untrue about the person who turned them down.
  // Compared, never merely present: a cached timestamp already in the past
  // would disable the button on a request the server would accept, and a
  // disabled button writes nothing, so the cache would never refresh.
  if (declineCooldownActive(retryAt)) {
    return (
      <>
        <Button variant="secondary" isDisabled>
          Not right now
        </Button>
        <Note>{declineCooldownNote(displayName, retryAt)}</Note>
      </>
    );
  }

  if (!available) {
    return (
      <>
        <Button variant="secondary" isDisabled>
          Not taking conversations
        </Button>
        <Note>They&apos;ll show up as available again when they have space.</Note>
      </>
    );
  }

  return (
    <>
      <Button onPress={onAsk}>Ask to talk</Button>
      <Note>They&apos;ll get a request and can accept when they&apos;re ready.</Note>
    </>
  );
}

/**
 * The way out that keeps the thread: not this person, but the roster narrowed
 * to the same thing they listen to. Only shown when the route carried a
 * specialty — which anyone can do by filtering the roster themselves.
 */
function OtherListeners({
  specialty,
  onPress,
}: {
  specialty: string;
  onPress: () => void;
}) {
  const accent = useThemeColor('accent') as string;

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`See other Xolacers who listen to ${specialtyListensTo(specialty)}`}
      hitSlop={8}
    >
      <View className="flex-row items-center justify-center gap-1.5 py-2">
        <AppText className="text-[13px] font-medium text-accent">
          Others listen to {specialtyListensTo(specialty)} too
        </AppText>
        <SymbolView
          name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
          size={12}
          tintColor={accent}
        />
      </View>
    </PressableFeedback>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <AppText className="text-center text-xs leading-5 text-muted">{children}</AppText>
  );
}

function Block({
  title,
  accent = false,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={
        accent
          ? 'rounded-3xl border border-accent/25 bg-accent/8 p-5'
          : 'rounded-3xl border border-border/40 bg-surface p-5'
      }
      style={styles.borderCurve}
    >
      <AppText className="mb-3.5 text-[10px] font-bold uppercase tracking-widest text-muted">
        {title}
      </AppText>
      <View className="gap-3.5">{children}</View>
    </View>
  );
}

function Fact({
  icon,
  children,
}: {
  icon: SymbolViewProps['name'];
  children: React.ReactNode;
}) {
  const muted = useThemeColor('muted') as string;

  return (
    <View className="flex-row gap-3">
      <SymbolView name={icon} size={15} tintColor={muted} style={styles.factIcon} />
      <AppText className="flex-1 text-[13px] leading-5 text-foreground/85">{children}</AppText>
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View className="flex-1 items-center gap-4 bg-background px-6 pt-28">
      <Stack.Screen options={HEADER_OPTIONS} />
      <Skeleton className="h-19 w-19 rounded-full" />
      <Skeleton className="h-7 w-36 rounded-lg" />
      <Skeleton className="h-4 w-52 rounded-lg" />
      <Skeleton className="mt-3 h-28 w-full rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-3xl" />
    </View>
  );
}

function ProfileUnavailable() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background px-10">
      <Stack.Screen options={HEADER_OPTIONS} />
      <AppText className="text-[15px] font-semibold text-foreground">
        This Xolacer isn&apos;t here
      </AppText>
      <AppText className="text-center text-[13px] leading-5 text-muted">
        Their profile may have been unpublished. There are others on the roster.
      </AppText>
    </View>
  );
}
