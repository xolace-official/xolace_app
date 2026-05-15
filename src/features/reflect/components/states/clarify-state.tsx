import { useState } from 'react';
import { View, TextInput } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { TextArea, LinkButton, useThemeColor } from 'heroui-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/shared/pill-button';
import type { ReflectionAction } from '@/src/features/reflect/types';
import { playSoftPress } from '@/src/lib/haptics';

type Props = {
  previousMirror: string;
  clarifyText: string;
  dispatch: React.Dispatch<ReflectionAction>;
  onSubmit: () => void;
  autoFocus?: boolean;
  // sessionId is guaranteed non-null here: clarify state is only reachable after
  // session initiation + mirror delivery. Typed as | undefined to satisfy the schema
  // optional field, but in practice it will always be defined.
  sessionId: Id<'sessions'> | undefined;
  turnIndex: number;
};

export const ClarifyState = ({
  previousMirror,
  clarifyText,
  dispatch,
  onSubmit,
  autoFocus = true,
  sessionId,
  turnIndex,
}: Props) => {
  const [feedbackText, setFeedbackText] = useState('');
  const canSubmit = clarifyText.trim().length > 0;
  const submitFeedback = useMutation(api.feedback.submit);
  const foregroundColor = useThemeColor('foreground') as string;

  const handleSubmit = () => {
    const capturedFeedbackText = feedbackText.trim();
    onSubmit();
    if (capturedFeedbackText && sessionId) {
      // Fire-and-forget — not awaited, PostHog not captured
      submitFeedback({
        type: 'mirror_miss',
        sessionId,
        turnIndex,
        text: capturedFeedbackText,
      }).catch((e) => console.error('mirror_miss feedback failed', e));
    }
  };

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={50}
        className="flex-1 px-6 pt-8"
      >
        <Animated.View entering={FadeIn.duration(300)} className="mb-2">
          <LinkButton
            onPress={() => { playSoftPress(); dispatch({ type: 'BACK_TO_MIRROR' }); }}
            size="sm"
            className="self-start"
          >
            <LinkButton.Label className="text-foreground/40">← Back to mirror</LinkButton.Label>
          </LinkButton>
        </Animated.View>
        <Animated.View entering={FadeIn.duration(600)}>
          <AppText className="mb-6 text-center text-base italic leading-7 text-foreground/30">
            {previousMirror}
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <AppText className="mb-4 text-center text-lg text-foreground">
            What didn&apos;t land right?
          </AppText>
        </Animated.View>

        <View className="flex-1">
          <TextArea
            autoFocus={autoFocus}
            placeholder="Help me understand better..."
            value={clarifyText}
            onChangeText={(text: string) =>
              dispatch({ type: 'CLARIFY_TEXT_CHANGE', text })
            }
            variant="secondary"
            className="min-h-[120] border-0 bg-transparent text-base text-foreground"
          />

          <Animated.View entering={FadeIn.delay(200).duration(300)}>
            <TextInput
              placeholder="What was off? (optional)"
              accessibilityLabel="Tell us what was off (optional)"
              value={feedbackText}
              onChangeText={setFeedbackText}
              maxLength={100}
              placeholderTextColor={`${foregroundColor}4D`}
              style={{
                fontSize: 14,
                color: foregroundColor,
                marginTop: 12,
                paddingHorizontal: 4,
              }}
            />
          </Animated.View>
        </View>

        <View className="items-center pb-4 pt-2">
          <PillButton
            label="Let it out"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
