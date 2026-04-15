import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { TextArea } from 'heroui-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { PresenceDot } from '@/src/components/reflect/presence-dot';
import { PillButton } from '@/src/components/reflect/pill-button';
import { useTypingPause } from '@/src/hooks/use-typing-pause';
import type { ReflectionAction } from '@/src/interfaces/reflection';
import { useSessionMode } from '@/src/context/session-mode-context';
import { NIGHT_NUDGE_DELAY_MS, DAY_NUDGE_DELAY_MS } from '@/src/constants/night-copy';

type Props = {
  showNudge: boolean;
  entryText: string;
  dispatch: React.Dispatch<ReflectionAction>;
  onSubmit: () => void;
  onDismiss: () => void;
  autoFocus?: boolean;
};

const NUDGE_MESSAGES = [
  "There's no rush. Let it come.",
  'Even a few words are enough.',
  "You don't need to explain, just say what's there.",
];

export const TypingState = ({ showNudge, entryText, dispatch, onSubmit, onDismiss, autoFocus = true }: Props) => {
  const { isNight } = useSessionMode();
  const { resetTimer, clearTimer } = useTypingPause(
    () => dispatch({ type: 'PAUSE_TIMEOUT' }),
    isNight ? NIGHT_NUDGE_DELAY_MS : DAY_NUDGE_DELAY_MS,
  );

  const handleChangeText = (text: string) => {
    dispatch({ type: 'TEXT_CHANGE', text });
    if (showNudge) {
      dispatch({ type: 'RESUME_TYPING' });
    }
    if (text.length > 0) {
      resetTimer();
    } else {
      clearTimer();
    }
  };

  // Pick a nudge message once when showNudge becomes true; stable across re-renders
  const nudgeMessage = useMemo(
    () => NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)],
    [],
  );

  const canSubmit = entryText.trim().length > 0;

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={50}
        className="flex-1 px-6 pt-4"
      >
        <View className="flex-row items-center gap-2 pb-3">
          <PresenceDot />
          {showNudge ? (
            <Animated.View
              key="nudge"
              entering={FadeInDown.springify().damping(20)}
              exiting={FadeOut.duration(200)}
              className="flex-1"
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
              className="flex-1"
            >
              <AppText className="text-sm text-foreground/40">
                What&apos;s here right now?
              </AppText>
            </Animated.View>
          )}
          <Pressable
            onPress={() => {
              playSoftPress();
              onDismiss();
            }}
            hitSlop={12}
            className="items-center justify-center rounded-full bg-foreground/8 p-1.5"
          >
            <AppText className="text-xs leading-none text-foreground/40">
              ✕
            </AppText>
          </Pressable>
        </View>

        <View className="flex-1">
          <TextArea
            autoFocus={autoFocus}
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
    </View>
  );
};
