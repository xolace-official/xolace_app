import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, useToast } from 'heroui-native';
import { useAction, useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import type { ThreadConversation } from './thread-screen';

/**
 * The composer is the state indicator: when a conversation can take a message
 * there's a composer, otherwise this bar takes its place and says plainly
 * whether tapping will just work. History always renders identically above.
 */
export function ThreadStatusBar({ conversation }: { conversation: ThreadConversation }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const acceptRequest = useAction(api.listenerChat.acceptRequest);
  const declineRequest = useMutation(api.listenerChat.declineRequest);
  const resumeConversation = useMutation(api.listenerChat.resumeConversation);

  const padBottom = Math.max(insets.bottom, 14);

  const handleAccept = () => {
    playSoftPress();
    acceptRequest({ conversationId: conversation.id }).catch(() =>
      toast.show({ label: "Couldn't open the conversation. Try again." }),
    );
  };

  const handleDecline = () => {
    playSoftPress();
    declineRequest({ conversationId: conversation.id })
      .then(() => router.back())
      .catch(() => toast.show({ label: "Couldn't decline. Try again." }));
  };

  const handleResume = () => {
    playSoftPress();
    resumeConversation({ conversationId: conversation.id })
      .then((result) => {
        if (!result.resumed) {
          toast.show({ label: 'This one has gone quiet on their end too.' });
        }
      })
      .catch(() => toast.show({ label: "Couldn't pick this back up. Try again." }));
  };

  const goToRoster = () => {
    playSoftPress();
    // Same pattern as the idle menu's Discovery entry — the tab surface is a
    // sibling stack entry, so replace rather than stacking another screen.
    router.replace('/connect');
  };

  if (conversation.status === 'requested') {
    return (
      <Bar padBottom={padBottom}>
        {conversation.role === 'listener' ? (
          <>
            <Copy>
              <Bold>{conversation.counterpartName}</Bold> asked to talk. Accepting opens a
              conversation only the two of you can see.
            </Copy>
            <View className="flex-row gap-2">
              <Button className="flex-1" onPress={handleAccept}>
                Accept
              </Button>
              <Button variant="secondary" className="flex-1" onPress={handleDecline}>
                Not right now
              </Button>
            </View>
          </>
        ) : (
          <Copy>
            Request sent. <Bold>{conversation.counterpartName}</Bold> will see it and can
            accept when they have space — usually within a day.
          </Copy>
        )}
      </Bar>
    );
  }

  if (conversation.status === 'resting' && conversation.resumable) {
    return (
      <Bar padBottom={padBottom}>
        <Copy>
          This one&apos;s gone quiet. <Bold>{conversation.counterpartName} is still here</Bold>{' '}
          — picking it up doesn&apos;t need a new request.
        </Copy>
        <Button onPress={handleResume}>Pick this back up</Button>
      </Bar>
    );
  }

  // Resting-but-blocked and closed share one screen: inactive, unpublished, at
  // cap, or declined. No-guilt framing, and the promise that nothing was
  // deleted comes before the redirect — losing the conversation is the fear.
  return (
    <Bar padBottom={padBottom}>
      <Copy>
        {conversation.counterpartName} has stepped back for now. Nothing to do with you —{' '}
        <Bold>everything you two wrote is still here</Bold>.
      </Copy>
      <Button variant="secondary" onPress={goToRoster}>
        Find another listener
      </Button>
    </Bar>
  );
}

function Bar({ children, padBottom }: { children: React.ReactNode; padBottom: number }) {
  return (
    <View
      className="gap-2.5 border-t border-border/40 bg-background px-4 pt-3"
      style={{ paddingBottom: padBottom }}
    >
      {children}
    </View>
  );
}

function Copy({ children }: { children: React.ReactNode }) {
  return (
    <AppText className="text-center text-xs leading-5 text-muted">{children}</AppText>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <AppText className="font-semibold text-foreground">{children}</AppText>;
}
