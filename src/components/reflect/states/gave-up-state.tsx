import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';

type Props = {
  onPathSelection: () => void;
  onReset: () => void;
};

export const GaveUpState = ({ onPathSelection, onReset }: Props) => (
  <Animated.View
    entering={FadeIn.duration(600)}
    exiting={FadeOut.duration(500)}
    className="flex-1 justify-center px-6"
  >
    <AppText className="text-xl leading-8 text-foreground">
      Sometimes words can&apos;t quite capture what we feel — and that&apos;s okay.
    </AppText>

    <AppText className="mt-4 text-base leading-6 text-foreground/40">
      What you shared still matters, even if the mirror didn&apos;t reflect it perfectly.
    </AppText>

    <View className="mt-14 gap-6">
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Pressable onPress={onPathSelection}>
          <AppText className="text-base font-semibold text-accent">
            See my options
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Pressable onPress={onReset}>
          <AppText className="text-base text-foreground/50">
            Start fresh
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  </Animated.View>
);
