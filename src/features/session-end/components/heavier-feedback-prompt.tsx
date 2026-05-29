import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { EaseView } from 'react-native-ease/uniwind';
import type { TransitionEndEvent } from 'react-native-ease';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { usePostHog } from 'posthog-react-native';
import { useThemeColor, PressableFeedback, useToast } from 'heroui-native';

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_FAST_INITIAL = { opacity: 0 };
const EASE_FAST_ANIMATE = { opacity: 1 };
const EASE_FAST_TRANSITION = { type: 'timing' as const, duration: 200, easing: EASING };
const EASE_EXIT_TRANSITION = { type: 'timing' as const, duration: 250, easing: 'easeIn' as const };
const EASE_ENTER_TRANSITION = { type: 'timing' as const, duration: 400, delay: 400, easing: EASING };

const OPTIONS = [
  { key: 'mirror_missed', label: 'The mirror missed' },
  { key: 'life_is_heavy', label: 'Life is just heavy right now' },
  { key: 'something_else', label: 'Something else' },
] as const;

type OptionKey = typeof OPTIONS[number]['key'];

type Props = {
  sessionId?: Id<'sessions'>;
  // When provided, the component renders as sheet content and delegates close to the caller
  onDismiss?: () => void;
};

export const HeavierFeedbackPrompt = ({ sessionId, onDismiss }: Props) => {
  const [showTextField, setShowTextField] = useState(false);
  const [somethingElseText, setSomethingElseText] = useState('');
  // Self-dismiss animation state — only used in inline (non-sheet) mode
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);

  const submitFeedback = useMutation(api.feedback.submit);
  const posthog = usePostHog();
  const { toast } = useToast();
  const foregroundColor = useThemeColor('foreground') as string;

  if (!mounted) return null;

  const dismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      setExiting(true);
    }
  };

  const handleTransitionEnd = ({ finished }: TransitionEndEvent) => {
    if (finished) {
      setMounted(false);
      setExiting(false);
    }
  };

  const handleOption = async (key: OptionKey) => {
    if (key === 'something_else') {
      setShowTextField(true);
      return;
    }
    if (!sessionId) return;
    try {
      await submitFeedback({ type: 'mood_heavier', sessionId, selectedOption: key });
      posthog.capture('feedback_submitted', { type: 'mood_heavier', has_text: false, has_option: true });
      toast.show({ label: 'Thank you for sharing', description: 'We hear you.', variant: 'default' });
      dismiss();
    } catch {
      toast.show({ label: 'Something went wrong', description: "Your response wasn't saved.", variant: 'default' });
    }
  };

  const handleSomethingElseSubmit = async () => {
    if (!sessionId) return;
    const text = somethingElseText.trim();
    try {
      await submitFeedback({ type: 'mood_heavier', sessionId, selectedOption: 'something_else', text: text || undefined });
      posthog.capture('feedback_submitted', { type: 'mood_heavier', has_text: !!text, has_option: true });
      toast.show({ label: 'Thank you for sharing', description: 'We hear you.', variant: 'default' });
      dismiss();
    } catch {
      toast.show({ label: 'Something went wrong', description: "Your response wasn't saved.", variant: 'default' });
    }
  };

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const textInputStyle = { fontSize: 14, color: foregroundColor, paddingHorizontal: 4, paddingVertical: 8 };

  // Sheet mode — clean layout without card wrapper or EaseView (sheet handles its own animation)
  if (onDismiss) {
    return (
      <View className="px-6 pt-2 pb-10 gap-5">
        <View>
          <AppText className="font-serif text-xl text-foreground mb-1">How did that land?</AppText>
          <AppText className="text-sm font-light text-foreground/40">
            You don&apos;t have to answer — this is just for us to understand.
          </AppText>
        </View>

        <View className="gap-3">
          {OPTIONS.map(({ key, label }) => (
            <PressableFeedback
              key={key}
              onPress={() => handleOption(key)}
              accessibilityLabel={label}
              className="w-full py-4 rounded-2xl border border-border/60 bg-surface/40 items-center"
            >
              <AppText className="text-sm font-light text-foreground/70">{label}</AppText>
            </PressableFeedback>
          ))}
        </View>

        {showTextField && (
          <EaseView
            initialAnimate={EASE_FAST_INITIAL}
            animate={EASE_FAST_ANIMATE}
            transition={EASE_FAST_TRANSITION}
            className="gap-2"
          >
            <BottomSheetTextInput
              placeholder="Anything you want us to know?"
              accessibilityLabel="Describe what happened"
              value={somethingElseText}
              onChangeText={setSomethingElseText}
              maxLength={300}
              placeholderTextColor={`${foregroundColor}4D`}
              onSubmitEditing={handleSomethingElseSubmit}
              returnKeyType="send"
              style={textInputStyle}
            />
            <PressableFeedback
              onPress={handleSomethingElseSubmit}
              accessibilityLabel="Submit something else feedback"
              className="self-start py-2 px-4 rounded-xl bg-accent/10 items-center"
            >
              <AppText className="text-xs font-medium text-accent">Done</AppText>
            </PressableFeedback>
          </EaseView>
        )}
      </View>
    );
  }

  // Inline mode — self-contained with EaseView enter/exit animation
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const outerInitial = { opacity: 0, translateY: 20 };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const outerAnimate = { opacity: exiting ? 0 : 1, translateY: exiting ? 10 : 0 };
  const outerTransition = exiting ? EASE_EXIT_TRANSITION : EASE_ENTER_TRANSITION;

  return (
    <EaseView
      initialAnimate={outerInitial}
      animate={outerAnimate}
      transition={outerTransition}
      onTransitionEnd={exiting ? handleTransitionEnd : undefined}
    >
      <View className="mx-5 mt-4 p-4 rounded-2xl bg-surface border border-overlay/20">
        <AppText className="text-sm text-foreground/60 mb-3">How did that land?</AppText>
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
            initialAnimate={EASE_FAST_INITIAL}
            animate={EASE_FAST_ANIMATE}
            transition={EASE_FAST_TRANSITION}
            className="mt-3"
          >
            <TextInput
              placeholder="Anything you want us to know?"
              accessibilityLabel="Describe what happened"
              value={somethingElseText}
              onChangeText={setSomethingElseText}
              maxLength={300}
              placeholderTextColor={`${foregroundColor}4D`}
              onSubmitEditing={handleSomethingElseSubmit}
              returnKeyType="send"
              style={textInputStyle}
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
