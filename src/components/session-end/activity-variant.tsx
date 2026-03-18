import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { TimelineIcon } from '@/components/reflect/timeline-icon';
import { ContributedConfirmation } from '@/components/session-end/contributed-confirmation';

type Props = {
  onDismiss: (contributedReflection?: boolean) => void;
  onHaveMore: (contributedReflection?: boolean) => void;
};

const MOODS = ['lighter', 'same', 'heavier', 'unsure'] as const;

export const ActivityVariant = ({ onDismiss, onHaveMore }: Props) => {
  const [phase, setPhase] = useState<'main' | 'contributed'>('main');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

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
        <AppText className="mb-3 text-xs font-light text-foreground/20">
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

      {/* Contribution prompt */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(400)}
        className="mb-8 border-t border-border pt-6"
      >
        <AppText className="mb-4 text-sm font-light leading-6 text-foreground/40">
          What you shared today — would you{'\n'}want it to exist anonymously
          for someone{'\n'}who might feel the same?
        </AppText>
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
      </Animated.View>

      <Animated.View entering={FadeIn.delay(700).duration(400)}>
        <Pressable onPress={() => onHaveMore()} hitSlop={8}>
          <AppText className="text-sm font-light text-foreground/20">
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
