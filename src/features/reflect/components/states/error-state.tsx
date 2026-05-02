import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinkButton } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { playErrorNotice } from '@/src/lib/haptics';

type Props = {
  errorMessage: string;
  onRetry: () => void;
  onReset: () => void;
};

export const ErrorState = ({ errorMessage, onRetry, onReset }: Props) => {
  useEffect(() => {
    playErrorNotice();
  }, []);

  return (
  <View className="flex-1 justify-center px-6">
    <AppText className="text-xl leading-8 text-foreground">
      Something didn&apos;t go as expected.
    </AppText>

    <AppText className="mt-4 text-base leading-6 text-foreground/40">
      {errorMessage}
    </AppText>

    <View className="mt-14 gap-6">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <LinkButton accessibilityLabel="Try again" onPress={onRetry} size="md" className="self-start">
          <LinkButton.Label className="font-semibold text-accent">
            Try again
          </LinkButton.Label>
        </LinkButton>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <LinkButton accessibilityLabel="Start fresh" onPress={onReset} size="md" className="self-start">
          <LinkButton.Label className="text-foreground/50">
            Start fresh
          </LinkButton.Label>
        </LinkButton>
      </Animated.View>
    </View>
  </View>
  );
};
