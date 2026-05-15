import { useState } from 'react';
import { Pressable, View , ScrollView} from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';
import { LinkButton } from 'heroui-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress, playTextureSelect } from '@/src/lib/haptics';
import { ContributedConfirmation } from '@/src/features/session-end/components/contributed-confirmation';
import { HeavierFeedbackPrompt } from '@/src/features/session-end/components/heavier-feedback-prompt';
import { NIGHT_SESSION_END_ACTIVITY } from '@/src/features/reflect/night-copy';

type PostSessionMood = 'lighter' | 'same' | 'heavier' | 'unsure';

type Props = {
  sessionId?: Id<'sessions'>;
  distilledText: string | null;
  contributeByDefault: boolean;
  onDismiss: (contributedReflection?: boolean, mood?: PostSessionMood) => void;
  onHaveMore: (contributedReflection?: boolean, mood?: PostSessionMood) => void;
  isNight?: boolean;
};

const MOODS = ['lighter', 'same', 'heavier', 'unsure'] as const;

export const ActivityVariant = ({
  sessionId,
  distilledText,
  contributeByDefault,
  onDismiss,
  onHaveMore,
  isNight = false,
}: Props) => {
  const [phase, setPhase] = useState<'main' | 'contributed'>('main');
  const [selectedMood, setSelectedMood] = useState<PostSessionMood | null>(null);
  const canAsk = useQuery(api.feedback.canAskContextual);
  // null = no explicit user choice yet, fall back to prop
  const [shareOverride, setShareOverride] = useState<boolean | null>(null);
  const shareToggled = shareOverride ?? contributeByDefault;

  const router = useRouter();

  const handleTimelinePress = () => {
    playSoftPress();
    router.push('/(protected)/timeline');
  };

  if (phase === 'contributed') {
    return (
      <ContributedConfirmation onDone={() => onDismiss(true, selectedMood ?? undefined)} />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}
    >
    <View className="flex-1 px-7">
      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
      >
        <AppText className="mb-2 font-serif text-xl leading-8 text-foreground">
          {isNight ? NIGHT_SESSION_END_ACTIVITY : 'You showed up for\nyourself today.'}
        </AppText>
        <View className="mb-3 flex-row flex-wrap">
          <AppText className="text-base font-light leading-7 text-foreground/40">
            It&apos;s on{' '}
          </AppText>
          <LinkButton size="sm" onPress={handleTimelinePress}>
            <LinkButton.Label className="text-base font-light text-accent/60">
              your timeline
            </LinkButton.Label>
          </LinkButton>
          <AppText className="text-base font-light leading-7 text-foreground/40">
            . Go live your life.
          </AppText>
        </View>
      </EaseView>

      {/* Optional mood check + heavier feedback prompt — skipped for night sessions */}
      {!isNight && (
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300, easing: [0.455, 0.03, 0.515, 0.955] }}
          className="my-6 border-t border-border pt-5"
        >
          <AppText className="mb-3 text-xs font-light text-muted">
            How do you feel now?
          </AppText>
          <View className="flex-row gap-4">
            {MOODS.map((mood) => (
              <Pressable
                key={mood}
                onPress={() => { playTextureSelect(); setSelectedMood(mood); }}
                className={`rounded-full border px-3 py-1.5 ${
                  selectedMood === mood
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-border'
                }`}
              >
                <AppText
                  className={`text-xs font-light ${
                    selectedMood === mood
                      ? 'text-accent'
                      : 'text-foreground/40'
                  }`}
                >
                  {mood}
                </AppText>
              </Pressable>
            ))}
          </View>
        </EaseView>
      )}

      {/* Heavier feedback prompt — only when heavier selected, not during night, and throttle allows */}
      {!isNight && selectedMood === 'heavier' && canAsk === true && (
        <HeavierFeedbackPrompt sessionId={sessionId} />
      )}

      {/* Contribution prompt — only when there's something to share */}
      {distilledText ? (
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 500, easing: [0.455, 0.03, 0.515, 0.955] }}
          className="mb-8 border-t border-border pt-6"
        >
          <AppText className="mb-3 text-sm font-light leading-6 text-muted">
            Would you want this to exist{'\n'}anonymously for someone who{'\n'}might feel the same?
          </AppText>
          <ScrollView
            style={{ flexGrow: 0, maxHeight: '50%' }}
            showsVerticalScrollIndicator={false}
            className="mb-4 rounded-xl border border-border/60 bg-surface/50 px-4 py-3">
            <AppText className="text-sm font-light italic leading-6 text-foreground/60">
              {`"${distilledText}"`}
            </AppText>
          </ScrollView>

          {contributeByDefault ? (
            /* Toggle mode: pre-selected, user can untoggle */
            <Pressable
              onPress={() => setShareOverride((v) => !(v ?? contributeByDefault))}
              className={`self-start rounded-full border px-5 py-2.5 ${
                shareToggled
                  ? 'border-accent/30 bg-accent/10'
                  : 'border-border'
              }`}
            >
              <AppText
                className={`text-sm ${
                  shareToggled ? 'text-accent' : 'text-foreground/40'
                }`}
              >
                Share anonymously
              </AppText>
            </Pressable>
          ) : (
            /* Default mode: explicit choice */
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setPhase('contributed')}
                className="rounded-full border border-accent/30 bg-accent/10 px-5 py-2.5"
              >
                <AppText className="text-sm text-accent">
                  Yes, anonymously
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => onDismiss(false, selectedMood ?? undefined)}
                className="rounded-full border border-border px-5 py-2.5"
              >
                <AppText className="text-sm text-foreground/20">
                  Not this time
                </AppText>
              </Pressable>
            </View>
          )}
        </EaseView>
      ): null}

      {/* Forward action — only in toggle mode */}
      {contributeByDefault && distilledText ? (
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
          className="mb-4"
        >
          <Pressable
            onPress={() => {
              if (shareToggled) {
                setPhase('contributed');
              } else {
                onDismiss(false, selectedMood ?? undefined);
              }
            }}
            className="self-start rounded-full border border-border px-6 py-2.5"
          >
            <AppText className="text-sm text-foreground/40">
              Done
            </AppText>
          </Pressable>
        </EaseView>
      ) : null}

      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 700, easing: [0.455, 0.03, 0.515, 0.955] }}
      >
        <LinkButton onPress={() => onHaveMore(undefined, selectedMood ?? undefined)} size="sm" className="self-start">
          <LinkButton.Label className="font-light text-accent/60">
            Have more? I&apos;m here.
          </LinkButton.Label>
        </LinkButton>
      </EaseView>

    </View>
    </ScrollView>
  );
};
