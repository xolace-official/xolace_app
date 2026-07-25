import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, PressableFeedback, Skeleton, useThemeColor, useToast } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { useTray } from '@/src/features/feedback-tray/engine/tray-provider';
import type { Trays } from '@/src/features/feedback-tray/screens/registry';
import { playSoftPress } from '@/src/lib/haptics';
import { formatMonthYear } from '../utils';
import { ListenerAvatar } from './listener-avatar';

type Profile = NonNullable<FunctionReturnType<typeof api.listenerChat.listenerProfile>>;

const styles = StyleSheet.create({ borderCurve: { borderCurve: 'continuous' } });
const BACK_ICON = { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } as const;

export function ListenerProfileScreen({ profileId }: { profileId: string }) {
  const profile = useQuery(api.listenerChat.listenerProfile, {
    listenerProfileId: profileId as Id<'emotional_profiles'>,
  });

  if (profile === undefined) return <ProfileSkeleton />;
  if (profile === null) return <ProfileUnavailable />;
  return <ProfileBody profile={profile} />;
}

function ProfileBody({ profile }: { profile: Profile }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { show } = useTray<Trays>();
  const foreground = useThemeColor('foreground') as string;
  const requestConversation = useMutation(api.listenerChat.requestConversation);

  const { conversation } = profile;
  const hasThread = conversation !== null && conversation.status !== 'closed';

  const openThread = (conversationId: string) =>
    router.replace(`/chat/${conversationId}`);

  const handleAsk = () => {
    playSoftPress();
    requestConversation({ listenerProfileId: profile.listenerProfileId })
      .then(openThread)
      .catch(() =>
        toast.show({ label: `${profile.displayName} isn't taking conversations right now.` }),
      );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-3 pb-1" style={{ paddingTop: insets.top + 6 }}>
        <PressableFeedback
          onPress={() => {
            playSoftPress();
            router.back();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <SymbolView name={BACK_ICON} size={20} tintColor={foreground} />
        </PressableFeedback>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-2 pb-6 gap-3.5"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-2 pt-1">
          <ListenerAvatar
            name={profile.displayName}
            photoUrl={profile.photoUrl}
            size="lg"
            muted={!profile.available}
          />
          <AppText className="text-xl font-semibold text-foreground">
            {profile.displayName}
          </AppText>
          <AppText className="text-[11px] text-muted">
            Listener since {formatMonthYear(profile.listenerSince)} · usually replies within a
            day
          </AppText>
        </View>

        <AppText className="text-center text-[15px] leading-6 text-foreground">
          &ldquo;{profile.bio}&rdquo;
        </AppText>

        {hasThread && (
          <Block accent title="You've talked before">
            <Fact icon="💬">
              Your conversation is still here.{' '}
              {conversation.status === 'resting'
                ? "Picking it back up doesn't need a new request."
                : 'Open it any time.'}
            </Fact>
          </Block>
        )}

        {!profile.available && !hasThread && (
          <Block accent title="Not right now">
            <Fact icon="🌙">
              {profile.displayName} isn&apos;t taking new conversations at the moment. Nothing
              to do with you — try someone else on the roster.
            </Fact>
          </Block>
        )}

        <Block title="What to expect">
          <Fact icon="👤">
            {profile.displayName} is a trained peer listener, not a therapist — no diagnoses,
            no clinical advice.
          </Fact>
          <Fact icon="🔒">
            Your chat is private between you two. It&apos;s never linked to your reflections.
          </Fact>
        </Block>
      </ScrollView>

      <View
        className="gap-2 border-t border-border/40 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <ProfileCta
          profile={profile}
          onAsk={handleAsk}
          onOpen={() => {
            playSoftPress();
            if (conversation) openThread(conversation.id);
          }}
        />
        <PressableFeedback
          onPress={() => {
            playSoftPress();
            show('report', { kind: 'bug' });
          }}
          accessibilityRole="button"
          accessibilityLabel="Report a concern"
        >
          <AppText className="text-center text-[11px] text-muted underline">
            Report a concern
          </AppText>
        </PressableFeedback>
      </View>
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
  const { conversation, available, displayName } = profile;

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

function Note({ children }: { children: React.ReactNode }) {
  return (
    <AppText className="text-center text-[11px] leading-4 text-muted">{children}</AppText>
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
          ? 'rounded-2xl border border-accent/25 bg-accent/8 p-3.5'
          : 'rounded-2xl border border-border/40 bg-surface p-3.5'
      }
      style={styles.borderCurve}
    >
      <AppText className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
        {title}
      </AppText>
      <View className="gap-1.5">{children}</View>
    </View>
  );
}

function Fact({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <AppText className="text-xs opacity-75">{icon}</AppText>
      <AppText className="flex-1 text-xs leading-5 text-foreground/80">{children}</AppText>
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View className="flex-1 items-center gap-3 bg-background px-5 pt-24">
      <Skeleton className="h-[76px] w-[76px] rounded-full" />
      <Skeleton className="h-6 w-32 rounded-lg" />
      <Skeleton className="h-4 w-52 rounded-lg" />
      <Skeleton className="mt-2 h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </View>
  );
}

function ProfileUnavailable() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background px-10">
      <AppText className="text-[15px] font-semibold text-foreground">
        This listener isn&apos;t here
      </AppText>
      <AppText className="text-center text-[13px] leading-5 text-muted">
        Their profile may have been unpublished. There are others on the roster.
      </AppText>
    </View>
  );
}
