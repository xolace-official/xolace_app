import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';

type Props = {
  errorMessage: string;
  onRetry: () => void;
  onReset: () => void;
};

export const ErrorState = ({ errorMessage, onRetry, onReset }: Props) => (
  <Animated.View
    entering={FadeIn.duration(600)}
    exiting={FadeOut.duration(500)}
    className="flex-1 justify-center px-6"
  >
    <AppText className="text-xl leading-8 text-foreground">
      Something didn&apos;t go as expected.
    </AppText>

    <AppText className="mt-4 text-base leading-6 text-foreground/40">
      {errorMessage}
    </AppText>

    <View className="mt-14 gap-6">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={onRetry}>
          <AppText className="text-base font-semibold text-accent">
            Try again
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Start fresh" onPress={onReset}>
          <AppText className="text-base text-foreground/50">
            Start fresh
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  </Animated.View>
);
