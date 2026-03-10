import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Separator } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';
import { TimelineIcon } from '@/components/reflect/timeline-icon';
import type { UserVariant } from '@/interfaces/reflection';
import * as Haptics from 'expo-haptics';

type Props = {
  variant: UserVariant;
  onTap: () => void;
};

const encouragementText = (variant: UserVariant): string => {
  switch (variant.kind) {
    case 'first-time':
      return "Say whatever's true right now.\nThere's no wrong way to do this.";
    case 'returning':
      return 'Welcome back.\nPick up where you left off.';
    case 'active':
      return `Day ${variant.dayCount}`;
  }
};

export const IdleState = ({ variant, onTap }: Props) => {
  const handleTap = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTap();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      className="flex-1 px-6"
    >
      {/* Top section — vertically centered */}
      <View className="flex-1 justify-center w-2/3">
        <AppText className="text-sm italic leading-6 text-foreground/40">
          {encouragementText(variant)}
        </AppText>

        <AppText className="mt-4 text-4xl font-semibold text-foreground">
          What&apos;s here right now?
        </AppText>
      </View>

      {/* Separator divides prompt from tap zone */}
      <Separator className="mb-0" />

      {/* Entire bottom half is tappable */}
      <Pressable onPress={handleTap} className="flex-1 pt-4">
        <AppText className="text-base text-foreground/30">
          Tap to begin...
        </AppText>
      </Pressable>

      <View className="absolute bottom-8 right-6">
        <TimelineIcon />
      </View>
    </Animated.View>
  );
};
