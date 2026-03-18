import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { TimelineIcon } from '@/components/reflect/timeline-icon';

type Props = {
  onHaveMore: () => void;
};

export const ExitVariant = ({ onHaveMore }: Props) => {
  return (
    <View className="flex-1 justify-center px-8">
      <Animated.View entering={FadeIn.duration(600)}>
        <AppText className="mb-2 font-serif text-xl text-foreground">
          Heard.
        </AppText>
        <AppText className="mb-12 text-base font-light leading-7 text-foreground/40">
          It&apos;s saved to your timeline{'\n'}whenever you want to come back
          to it.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(400)}>
        <Pressable onPress={onHaveMore} hitSlop={8}>
          <AppText className="text-sm font-light text-foreground/20">
            Have more? I&apos;m here.
          </AppText>
        </Pressable>
      </Animated.View>

      <View className="absolute bottom-6 right-7">
        <TimelineIcon />
      </View>
    </View>
  );
};
