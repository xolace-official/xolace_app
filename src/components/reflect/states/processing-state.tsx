import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { BreathingOrb } from '@/components/reflect/breathing-orb';

export const ProcessingState = () => (
  <Animated.View
    entering={FadeIn.duration(800).delay(300)}
    exiting={FadeOut.duration(600)}
    className="flex-1 items-center justify-center gap-8"
  >
    <BreathingOrb />
    <AppText className="text-sm text-foreground/40">
      Listening...
    </AppText>
  </Animated.View>
);
