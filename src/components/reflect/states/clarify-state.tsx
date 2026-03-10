import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { TextArea } from 'heroui-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AppText } from '@/components/shared/app-text';
import { PillButton } from '@/components/reflect/pill-button';
import type { ReflectionAction } from '@/interfaces/reflection';

type Props = {
  previousMirror: string;
  clarifyText: string;
  dispatch: React.Dispatch<ReflectionAction>;
  onSubmit: () => void;
};

export const ClarifyState = ({
  previousMirror,
  clarifyText,
  dispatch,
  onSubmit,
}: Props) => {
  const canSubmit = clarifyText.trim().length > 0;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(500)}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1 px-6 pt-8"
      >
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
            autoFocus
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
            onPress={onSubmit}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};
