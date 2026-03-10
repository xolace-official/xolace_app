import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { TextArea } from 'heroui-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AppText } from '@/components/shared/app-text';
import { PresenceDot } from '@/components/reflect/presence-dot';
import { PillButton } from '@/components/reflect/pill-button';
import { useTypingPause } from '@/hooks/use-typing-pause';
import type { ReflectionAction } from '@/interfaces/reflection';

type Props = {
  showNudge: boolean;
  entryText: string;
  dispatch: React.Dispatch<ReflectionAction>;
  onSubmit: () => void;
};

const NUDGE_MESSAGES = [
  "There's no rush. Let it come.",
  'Even a few words are enough.',
  "You don't need to explain \u2014 just say what's there.",
];

export const TypingState = ({ showNudge, entryText, dispatch, onSubmit }: Props) => {
  const { resetTimer, clearTimer } = useTypingPause(
    () => dispatch({ type: 'PAUSE_TIMEOUT' }),
    8000,
  );

  useEffect(() => {
    if (entryText.length > 0) {
      resetTimer();
    }
    return clearTimer;
  }, [entryText, resetTimer, clearTimer]);

  const handleChangeText = (text: string) => {
    dispatch({ type: 'TEXT_CHANGE', text });
    if (showNudge) {
      dispatch({ type: 'RESUME_TYPING' });
    }
  };

  // Pick a nudge message once when showNudge becomes true; stable across re-renders
  const nudgeMessage = useMemo(
    () => NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)],
    [],
  );

  const canSubmit = entryText.trim().length > 0;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(500)}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1 px-6 pt-4"
      >
        <View className="flex-row items-center gap-2 pb-3">
          <PresenceDot />
          {showNudge ? (
            <Animated.View
              key="nudge"
              entering={FadeInDown.springify().damping(20)}
              exiting={FadeOut.duration(200)}
            >
              <AppText className="text-sm text-foreground/40">
                {nudgeMessage}
              </AppText>
            </Animated.View>
          ): (
            <Animated.View
              key="default"
              entering={FadeInDown.duration(200)}
              exiting={FadeOut.duration(200)}
            >
              <AppText className="text-sm text-foreground/40">
                What&apos;s here right now?
              </AppText>
            </Animated.View>
          )}
        </View>

        <View className="flex-1">
          <TextArea
            autoFocus
            placeholder="Start typing..."
            value={entryText}
            onChangeText={handleChangeText}
            className="min-h-[200] flex-1 border-0 bg-transparent text-lg text-foreground"
          />
        </View>

        <View className="items-center pb-4 pt-2">
          <PillButton
            label="Let it out"
            onPress={onSubmit}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};
