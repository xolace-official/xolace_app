import { useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { TimelineIcon } from '@/components/reflect/timeline-icon';
import { ContributedConfirmation } from '@/components/session-end/contributed-confirmation';

type Props = {
  distilledText: string | null;
  contributeByDefault: boolean;
  onDismiss: (contributedReflection?: boolean) => void;
  onHaveMore: (contributedReflection?: boolean) => void;
};

const MOODS = ['lighter', 'same', 'heavier', 'unsure'] as const;

export const ActivityVariant = ({
  distilledText,
  contributeByDefault,
  onDismiss,
  onHaveMore,
}: Props) => {
  const [phase, setPhase] = useState<'main' | 'contributed'>('main');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [shareToggled, setShareToggled] = useState(contributeByDefault);

  // Sync when the async preference loads after initial render
  useEffect(() => {
    setShareToggled(contributeByDefault);
  }, [contributeByDefault]);

  if (phase === 'contributed') {
    return (
      <ContributedConfirmation onDone={() => onDismiss(true)} />
    );
  }

  return (
    <View className="flex-1 justify-center px-7">
      <Animated.View entering={FadeIn.duration(600)}>
        <AppText className="mb-2 font-serif text-xl leading-8 text-foreground">
          You showed up for{'\n'}yourself today.
        </AppText>
        <AppText className="mb-3 text-base font-light leading-7 text-foreground/40">
          Go live your life. This&apos;ll be here.
        </AppText>
      </Animated.View>

      {/* Optional mood check */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        className="my-6 border-t border-border pt-5"
      >
        <AppText className="mb-3 text-xs font-light text-muted">
          How do you feel now?
        </AppText>
        <View className="flex-row gap-4">
          {MOODS.map((mood) => (
            <Pressable
              key={mood}
              onPress={() => setSelectedMood(mood)}
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
      </Animated.View>

      {/* Contribution prompt — only when there's something to share */}
      {distilledText ? (
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          className="mb-8 border-t border-border pt-6"
        >
          <AppText className="mb-3 text-sm font-light leading-6 text-muted">
            Would you want this to exist{'\n'}anonymously for someone who{'\n'}might feel the same?
          </AppText>
          <View className="mb-4 rounded-xl border border-border/60 bg-surface/50 px-4 py-3">
            <AppText className="text-sm font-light italic leading-6 text-foreground/60">
              {`"${distilledText}"`}
            </AppText>
          </View>

          {contributeByDefault ? (
            /* Toggle mode: pre-selected, one-tap confirm */
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setShareToggled((v) => !v)}
                className={`rounded-full border px-5 py-2.5 ${
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
              <Pressable
                onPress={() => {
                  if (shareToggled) {
                    setPhase('contributed');
                  } else {
                    onDismiss(false);
                  }
                }}
                className="rounded-full border border-border px-5 py-2.5"
              >
                <AppText className="text-sm text-foreground/40">
                  Done
                </AppText>
              </Pressable>
            </View>
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
                onPress={() => onDismiss(false)}
                className="rounded-full border border-border px-5 py-2.5"
              >
                <AppText className="text-sm text-foreground/20">
                  Not this time
                </AppText>
              </Pressable>
            </View>
          )}
        </Animated.View>
      ): null}

      <Animated.View entering={FadeIn.delay(700).duration(400)}>
        <Pressable onPress={() => onHaveMore()} hitSlop={8}>
          <AppText className="text-sm font-light text-foreground/30">
            Have more? I&apos;m here.
          </AppText>
        </Pressable>
      </Animated.View>

      <View className="absolute bottom-6 right-7">
        <TimelineIcon />
      </View>
    </View>
  );
};
