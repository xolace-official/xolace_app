import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import { Chip, Separator } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';
import { PillButton } from '@/components/reflect/pill-button';
import { TimelineIcon } from '@/components/reflect/timeline-icon';
import type { UserVariant, ReflectionAction } from '@/interfaces/reflection';
import * as Haptics from 'expo-haptics';

const TEXTURE_WORDS = [
  'heavy',
  'tight',
  'foggy',
  'buzzing',
  'empty',
  'scattered',
  'numb',
  'raw',
];

type Props = {
  variant: UserVariant;
  selectedTextures: string[];
  dispatch: React.Dispatch<ReflectionAction>;
  onTap: () => void;
  onScaffoldSubmit: () => void;
};

const encouragementText = (variant: UserVariant): string => {
  switch (variant.kind) {
    case 'first-time':
      return "You don't need to know what to say.";
    case 'returning':
      return 'Welcome back.\nPick up where you left off.';
    case 'active':
      return `Day ${variant.dayCount}`;
  }
};

export const IdleState = ({
  variant,
  selectedTextures,
  dispatch,
  onTap,
  onScaffoldSubmit,
}: Props) => {
  const handleTap = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTap();
  };

  const handleToggle = (word: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dispatch({ type: 'TOGGLE_TEXTURE', word });
  };

  const hasSelections = selectedTextures.length > 0;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      className="flex-1 px-6"
    >
      {/* Top section */}
      <View className="pt-16 pb-4">
        <AppText className="text-sm italic leading-6 text-foreground/40">
          {encouragementText(variant)}
        </AppText>

        <AppText className="mt-4 text-4xl font-semibold text-foreground">
          What&apos;s here{'\n'}right now?
        </AppText>
      </View>

      {/* Tap to type zone — takes up available space */}
      <Separator className="mb-0" />

      <Pressable onPress={handleTap} className="flex-1 pt-4">
        <AppText className="text-base text-foreground/30">
          Tap to begin writing...
        </AppText>
      </Pressable>

      {/* Scaffold section */}
      <View className="border-t border-foreground/5 pt-5 pb-8">
        <AppText className="mb-3 text-xs text-foreground/30">
          Or just tap what feels close:
        </AppText>

        <View className="flex-row flex-wrap gap-2">
          {TEXTURE_WORDS.map((word) => {
            const isSelected = selectedTextures.includes(word);
            return (
              <Chip
                key={word}
                size="sm"
                variant={isSelected ? 'primary' : 'tertiary'}
                color={isSelected ? 'accent' : 'default'}
                onPress={() => handleToggle(word)}
              >
                <Chip.Label>{word}</Chip.Label>
              </Chip>
            );
          })}
        </View>

        {/* "Let it out" emerges after first selection */}
        {hasSelections && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mt-5"
          >
            <PillButton label="Let it out" onPress={onScaffoldSubmit} />
          </Animated.View>
        )}
      </View>

      <View className="absolute bottom-8 right-6">
        <TimelineIcon />
      </View>
    </Animated.View>
  );
};
