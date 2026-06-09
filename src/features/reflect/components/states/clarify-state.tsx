import { useEffect } from 'react';
import { View } from 'react-native';
import { Presets } from 'react-native-pulsar';
import { EaseView } from 'react-native-ease/uniwind';
import { TextArea, LinkButton } from 'heroui-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/shared/pill-button';
import type { ReflectionAction } from '@/src/features/reflect/types';

type Props = {
  previousMirror: string;
  clarifyText: string;
  dispatch: React.Dispatch<ReflectionAction>;
  onSubmit: () => void;
  autoFocus?: boolean;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL_FADE = { opacity: 0 };
const EASE_ANIMATE_FADE = { opacity: 1 };
const EASE_INITIAL_SLIDE = { opacity: 0, translateY: 20 };
const EASE_ANIMATE_SLIDE = { opacity: 1, translateY: 0 };
const EASE_BACK_TRANSITION = { type: 'timing' as const, duration: 300, easing: EASING };
const EASE_MIRROR_TRANSITION = { type: 'timing' as const, duration: 600, easing: EASING };
const EASE_PROMPT_TRANSITION = { type: 'timing' as const, duration: 400, delay: 200, easing: EASING };

export const ClarifyState = ({
  previousMirror,
  clarifyText,
  dispatch,
  onSubmit,
  autoFocus = true,
}: Props) => {
  useEffect(() => {
    Presets.wobble();
  }, []);
  const canSubmit = clarifyText.trim().length > 0;

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={50}
        className="flex-1 px-6 pt-8"
      >
        <EaseView
          initialAnimate={EASE_INITIAL_FADE}
          animate={EASE_ANIMATE_FADE}
          transition={EASE_BACK_TRANSITION}
          className="mb-2"
        >
          <LinkButton
            onPress={() => { dispatch({ type: 'BACK_TO_MIRROR' }); }}
            size="sm"
            className="self-start"
          >
            <LinkButton.Label className="text-foreground/40">← Back to mirror</LinkButton.Label>
          </LinkButton>
        </EaseView>
        <EaseView
          initialAnimate={EASE_INITIAL_FADE}
          animate={EASE_ANIMATE_FADE}
          transition={EASE_MIRROR_TRANSITION}
        >
          <AppText className="mb-6 text-center text-base italic leading-7 text-foreground/30">
            {previousMirror}
          </AppText>
        </EaseView>

        <EaseView
          initialAnimate={EASE_INITIAL_SLIDE}
          animate={EASE_ANIMATE_SLIDE}
          transition={EASE_PROMPT_TRANSITION}
        >
          <AppText className="mb-4 text-center text-lg text-foreground">
            What didn&apos;t land right?
          </AppText>
        </EaseView>

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
        </View>

        <View className="items-center pb-4 pt-2">
          <PillButton
            label="Let it out"
            onPress={() => { Presets.propel(); onSubmit(); }}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
