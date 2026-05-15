import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { PressableFeedback } from 'heroui-native';
import { usePostHog } from 'posthog-react-native';

const OPTIONS = [
  { key: 'mirror_kept_missing', label: 'The mirror kept missing' },
  { key: 'figured_it_out', label: 'I found it myself' },
  { key: 'needed_to_vent', label: 'I just needed to express it' },
] as const;

type Props = {
  sessionId: Id<'sessions'>;
};

export const GaveUpFeedbackCard = ({ sessionId }: Props) => {
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = useMutation(api.feedback.submit);
  const posthog = usePostHog();

  if (submitted) return null;

  const handleOption = (key: string) => {
    submitFeedback({
      type: 'gave_up',
      sessionId,
      selectedOption: key,
    }).then(() => {
      setSubmitted(true);
      posthog.capture('feedback_submitted', {
        type: 'gave_up',
        has_text: false,
        has_option: true,
      });
    }).catch((e) => console.error('gave_up feedback failed', e));
  };

  return (
    <Animated.View exiting={FadeOut.duration(200)}>
      <View className="mx-5 mt-4 p-4 rounded-2xl bg-surface border border-overlay/20">
        <AppText className="text-sm text-foreground/60 mb-3">
          What happened?
        </AppText>

        <View className="gap-2">
          {OPTIONS.map(({ key, label }) => (
            <PressableFeedback
              key={key}
              onPress={() => handleOption(key)}
              accessibilityLabel={label}
              className="w-full py-3 rounded-xl bg-accent/10 items-center active:opacity-70"
            >
              <AppText className="text-sm font-medium text-accent">{label}</AppText>
            </PressableFeedback>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};
