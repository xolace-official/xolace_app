import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Button } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';
import * as Haptics from 'expo-haptics';

type Props = {
  mirror: string;
  onThatsIt: () => void;
  onNotQuite: () => void;
  onSayMore: () => void;
};

const hapticPress = (fn: () => void) => () => {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  fn();
};

export const MirrorState = ({ mirror, onThatsIt, onNotQuite, onSayMore }: Props) => (
  <Animated.View
    entering={FadeInDown.duration(1000).springify().damping(18)}
    exiting={FadeOut.duration(500)}
    className="flex-1 justify-center px-8"
  >
    <AppText className="text-center text-xl italic leading-8 text-foreground">
      {mirror}
    </AppText>

    <View className="mt-12 gap-3">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Button variant="primary" onPress={hapticPress(onThatsIt)}>
          <Button.Label>That&apos;s it</Button.Label>
        </Button>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Button variant="secondary" onPress={hapticPress(onNotQuite)}>
          <Button.Label>Not quite</Button.Label>
        </Button>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(400)}>
        <Button variant="ghost" onPress={hapticPress(onSayMore)}>
          <Button.Label>Say more</Button.Label>
        </Button>
      </Animated.View>
    </View>
  </Animated.View>
);
