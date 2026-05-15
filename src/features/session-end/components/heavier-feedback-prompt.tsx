import { useState } from 'react';
import { View, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeOut, FadeIn } from 'react-native-reanimated';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { usePostHog } from 'posthog-react-native';
import { useThemeColor, PressableFeedback } from 'heroui-native';

const OPTIONS = [
  { key: 'mirror_missed', label: 'The mirror missed' },
  { key: 'life_is_heavy', label: 'Life is just heavy right now' },
  { key: 'something_else', label: 'Something else' },
] as const;

type OptionKey = typeof OPTIONS[number]['key'];

type Props = {
  sessionId?: Id<'sessions'>;
};

export const HeavierFeedbackPrompt = ({ sessionId }: Props) => {
  const [showTextField, setShowTextField] = useState(false);
  const [somethingElseText, setSomethingElseText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = useMutation(api.feedback.submit);
  const posthog = usePostHog();
  const foregroundMuted = useThemeColor('foreground') as string;

  if (submitted) return null;

  const handleOption = async (key: OptionKey) => {
    if (key === 'something_else') {
      setShowTextField(true);
      return;
    }
    setSubmitted(true);
    try {
      await submitFeedback({
        type: 'mood_heavier',
        sessionId,
        selectedOption: key,
      });
      posthog.capture('feedback_submitted', {
        type: 'mood_heavier',
        has_text: false,
        has_option: true,
      });
    } catch (e) {
      console.error('mood_heavier feedback failed', e);
    }
  };

  const handleSomethingElseSubmit = async () => {
    setSubmitted(true);
    const text = somethingElseText.trim();
    try {
      await submitFeedback({
        type: 'mood_heavier',
        sessionId,
        selectedOption: 'something_else',
        text: text || undefined,
      });
      posthog.capture('feedback_submitted', {
        type: 'mood_heavier',
        has_text: !!text,
        has_option: true,
      });
    } catch (e) {
      console.error('mood_heavier feedback failed', e);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(400)}
      exiting={FadeOut.duration(200)}
    >
      <View className="mx-5 mt-4 p-4 rounded-2xl bg-surface border border-overlay/20">
        <AppText className="text-sm text-foreground/60 mb-3">
          How did that land?
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

        {showTextField && (
          <Animated.View entering={FadeIn.duration(200)} className="mt-3">
            <TextInput
              placeholder="Anything you want us to know?"
              accessibilityLabel="Describe what happened"
              value={somethingElseText}
              onChangeText={setSomethingElseText}
              maxLength={300}
              placeholderTextColor={`${foregroundMuted}4D`}
              onSubmitEditing={handleSomethingElseSubmit}
              returnKeyType="send"
              style={{
                fontSize: 14,
                color: foregroundMuted,
                paddingHorizontal: 4,
                paddingVertical: 8,
              }}
            />
            <PressableFeedback
              onPress={handleSomethingElseSubmit}
              accessibilityLabel="Submit something else feedback"
              className="mt-2 self-start py-2 px-4 rounded-xl bg-accent/10 items-center active:opacity-70"
            >
              <AppText className="text-xs font-medium text-accent">Done</AppText>
            </PressableFeedback>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};
