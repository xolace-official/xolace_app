import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { PillButton } from '@/components/reflect/pill-button';

type Props = {
  onDone: () => void;
};

export const ContributedConfirmation = ({ onDone }: Props) => {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View entering={FadeIn.duration(600)}>
        <AppText className="text-center font-serif text-lg leading-8 text-foreground">
          Someone out there{'\n'}will feel less alone{'\n'}because of what
          {'\n'}you shared.
        </AppText>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(600).duration(400)}
        className="mt-10"
      >
        <PillButton label="Done" onPress={onDone} />
      </Animated.View>
    </View>
  );
};
