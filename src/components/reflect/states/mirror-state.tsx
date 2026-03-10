import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
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
    className="flex-1 justify-center px-6"
  >
    <AppText className="text-xl italic leading-8 text-foreground">
      {mirror}
    </AppText>

    <View className="mt-14 gap-6">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Pressable onPress={hapticPress(onThatsIt)}>
          <AppText className="text-lg font-semibold text-accent">
            That&apos;s it
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Pressable onPress={hapticPress(onNotQuite)}>
          <AppText className="text-base text-foreground/50">
            Not quite
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(400)}>
        <Pressable onPress={hapticPress(onSayMore)}>
          <AppText className="text-base text-foreground/50">
            Say more
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  </Animated.View>
);
