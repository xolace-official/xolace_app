import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinkButton } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { NIGHT_SESSION_END_EXIT } from '@/src/features/reflect/night-copy';

type Props = {
  onHaveMore: () => void;
  isNight?: boolean;
};

export const ExitVariant = ({ onHaveMore, isNight = false }: Props) => {
  const router = useRouter();

  const handleTimelinePress = () => {
    playSoftPress();
    router.push('/(protected)/timeline');
  };

  return (
    <View className="flex-1 justify-center px-8">
      <Animated.View entering={FadeIn.duration(600)}>
        <AppText className="mb-2 font-serif text-xl text-foreground">
          {isNight ? NIGHT_SESSION_END_EXIT : 'Heard.'}
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
          <LinkButton.Label className="font-light text-accent/60">
            Have more? I&apos;m here.
          </LinkButton.Label>
        </LinkButton>
      </Animated.View>
    </View>
  );
};
