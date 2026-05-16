import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { usePostHog } from 'posthog-react-native';
import { useThemeColor, PressableFeedback, useToast } from 'heroui-native';

const OPTIONS = [
  { key: 'mirror_missed', label: 'The mirror missed' },
  { key: 'life_is_heavy', label: 'Life is just heavy right now' },
  { key: 'something_else', label: 'Something else' },
] as const;

type OptionKey = typeof OPTIONS[number]['key'];

type Props = {
  sessionId?: Id<'sessions'>;
};

const EXIT_DURATION = 250;

export const HeavierFeedbackPrompt = ({ sessionId }: Props) => {
  const [showTextField, setShowTextField] = useState(false);
  const [somethingElseText, setSomethingElseText] = useState('');
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);

  const submitFeedback = useMutation(api.feedback.submit);
  const posthog = usePostHog();
  const { toast } = useToast();
  const foregroundMuted = useThemeColor('foreground') as string;

  if (!mounted) return null;

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => setMounted(false), EXIT_DURATION + 50);
  };

  const handleOption = async (key: OptionKey) => {
    if (key === 'something_else') {
      setShowTextField(true);
      return;
    }
    if (!sessionId) return;
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
      toast.show({ label: 'Thank you for sharing', description: 'We hear you.', variant: 'default' });
      dismiss();
    } catch {
      toast.show({ label: 'Something went wrong', description: 'Your response wasn\'t saved.', variant: 'default' });
    }
  };

  const handleSomethingElseSubmit = async () => {
    if (!sessionId) return;
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
      toast.show({ label: 'Thank you for sharing', description: 'We hear you.', variant: 'default' });
      dismiss();
    } catch {
      toast.show({ label: 'Something went wrong', description: 'Your response wasn\'t saved.', variant: 'default' });
    }
  };

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: exiting ? 0 : 1, translateY: exiting ? 10 : 0 }}
      transition={exiting
        ? { type: 'timing', duration: EXIT_DURATION, easing: 'easeIn' }
        : { type: 'timing', duration: 400, delay: 400, easing: [0.455, 0.03, 0.515, 0.955] }
      }
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
          <EaseView
            initialAnimate={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 200, easing: [0.455, 0.03, 0.515, 0.955] }}
            className="mt-3"
          >
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
          </EaseView>
        )}
      </View>
    </EaseView>
  );
};
