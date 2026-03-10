import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Button } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';

type Props = {
  onPathSelection: () => void;
  onReset: () => void;
};

export const GaveUpState = ({ onPathSelection, onReset }: Props) => (
  <Animated.View
    entering={FadeIn.duration(600)}
    exiting={FadeOut.duration(500)}
    className="flex-1 justify-center px-8"
  >
    <AppText className="text-center text-xl leading-8 text-foreground">
      Sometimes words can't quite capture what we feel — and that's okay.
    </AppText>

    <AppText className="mt-4 text-center text-base leading-6 text-foreground/40">
      What you shared still matters, even if the mirror didn't reflect it perfectly.
    </AppText>

    <View className="mt-12 gap-3">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Button variant="primary" onPress={onPathSelection}>
          <Button.Label>See my options</Button.Label>
        </Button>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Button variant="ghost" onPress={onReset}>
          <Button.Label>Start fresh</Button.Label>
        </Button>
      </Animated.View>
    </View>
  </Animated.View>
);
