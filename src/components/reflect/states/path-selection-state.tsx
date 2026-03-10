import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Button } from 'heroui-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/shared/app-text';

type Props = {
  mirror: string;
  onReset: () => void;
};

export const PathSelectionState = ({ mirror, onReset }: Props) => {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(500)}
      className="flex-1 justify-center px-8"
    >
      <AppText className="mb-10 text-center text-base italic leading-7 text-foreground/30">
        {mirror}
      </AppText>

      <AppText className="mb-8 text-center text-lg text-foreground">
        Where would you like to go from here?
      </AppText>

      <View className="gap-3">
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Button
            variant="primary"
            onPress={() => router.push('/sit-with-this' as never)}
          >
            <Button.Label>Sit with this</Button.Label>
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Button
            variant="secondary"
            onPress={() => router.push('/community' as never)}
          >
            <Button.Label>You're not alone</Button.Label>
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Button variant="ghost" onPress={onReset}>
            <Button.Label>I just needed to say it</Button.Label>
          </Button>
        </Animated.View>
      </View>
    </Animated.View>
  );
};
