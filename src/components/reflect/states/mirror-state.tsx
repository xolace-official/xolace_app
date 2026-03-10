import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Chip } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';
import type { EntryType } from '@/interfaces/reflection';
import * as Haptics from 'expo-haptics';

type Props = {
  mirror: string;
  selectedTextures: string[];
  entryType: EntryType;
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

export const MirrorState = ({
  mirror,
  selectedTextures,
  entryType,
  onThatsIt,
  onNotQuite,
  onSayMore,
}: Props) => {
  const showTextures =
    selectedTextures.length > 0 &&
    (entryType === 'scaffold' || entryType === 'hybrid');

  return (
    <Animated.View
      entering={FadeInDown.duration(1000).springify().damping(18)}
      exiting={FadeOut.duration(500)}
      className="flex-1 justify-center px-6"
    >
      {/* Texture pills from scaffold */}
      {showTextures && (
        <Animated.View
          entering={FadeIn.duration(400)}
          className="mb-5 flex-row flex-wrap gap-1.5"
        >
          {selectedTextures.map((word) => (
            <Chip
              key={word}
              size="sm"
              variant="primary"
              color="accent"
              animation="disable-all"
            >
              <Chip.Label>{word}</Chip.Label>
            </Chip>
          ))}
        </Animated.View>
      )}

      <ScrollView
        style={{ flexGrow: 0, maxHeight: '60%' }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-xl italic leading-8 text-foreground">
          {mirror}
        </AppText>
      </ScrollView>

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
};
