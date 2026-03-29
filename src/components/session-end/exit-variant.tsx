import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinkButton } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/shared/app-text';

type Props = {
  onHaveMore: () => void;
};

export const ExitVariant = ({ onHaveMore }: Props) => {
  const router = useRouter();

  const handleTimelinePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(protected)/timeline');
  };

  return (
    <View className="flex-1 justify-center px-8">
      <Animated.View entering={FadeIn.duration(600)}>
        <AppText className="mb-2 font-serif text-xl text-foreground">
          Heard.
        </AppText>
        <View className="mb-12 flex-row flex-wrap">
          <AppText className="text-base font-light leading-7 text-foreground/40">
            It&apos;s saved to{' '}
          </AppText>
          <LinkButton size="sm" onPress={handleTimelinePress}>
            <LinkButton.Label className="text-base font-light text-accent/60">
              your timeline
            </LinkButton.Label>
          </LinkButton>
          <AppText className="text-base font-light leading-7 text-foreground/40">
            {'\n'}whenever you want to come back to it.
          </AppText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(400)}>
        <LinkButton onPress={onHaveMore} size="sm" className="self-start">
          <LinkButton.Label className="font-light text-foreground/20">
            Have more? I&apos;m here.
          </LinkButton.Label>
        </LinkButton>
      </Animated.View>
    </View>
  );
};
