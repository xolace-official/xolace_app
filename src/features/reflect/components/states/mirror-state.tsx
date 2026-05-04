import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Chip, LinkButton, PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/src/components/shared/app-text';
import type { EntryType } from '@/src/features/reflect/types';
import type { Id } from '@/convex/_generated/dataModel';
import { playMirrorArrival, playAffirmativePress, playSoftPress } from '@/src/lib/haptics';
import { useMirrorAudio } from '@/src/features/reflect/hooks/use-mirror-audio';

type Props = {
  mirror: string;
  selectedTextures: string[];
  entryType: EntryType;
  sessionId: Id<'sessions'> | null;
  onThatsIt: () => void;
  onNotQuite: () => void;
  onSayMore: () => void;
};

export const MirrorState = ({
  mirror,
  selectedTextures,
  entryType,
  sessionId,
  onThatsIt,
  onNotQuite,
  onSayMore,
}: Props) => {
  const { isReady, isPlaying, toggle, stop } = useMirrorAudio(sessionId);
  const accent = useThemeColor('accent');

  useEffect(() => {
    playMirrorArrival();
    return () => { stop(); };
  }, [stop]);

  const showTextures =
    selectedTextures.length > 0 &&
    (entryType === 'scaffold' || entryType === 'hybrid');

  return (
    <View className="flex-1 justify-center px-6">
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

      <Animated.View entering={FadeIn.duration(600)} className="mb-3 flex-row items-center gap-3">
        <AppText className="text-xs uppercase tracking-widest text-accent">
          The Mirror
        </AppText>
        {isReady && (
          <PressableFeedback
            onPress={() => { playSoftPress(); toggle(); }}
            animation={{ scale: { ignoreScaleCoefficient: true, value: 0.85 } }}
            hitSlop={8}
          >
            <SymbolView
              name={{
                ios: isPlaying ? 'speaker.wave.2.fill' : 'speaker.fill',
                android: isPlaying ? 'volume_up' : 'volume_off',
                web: isPlaying ? 'volume_up' : 'volume_off',
              }}
              size={16}
              tintColor={accent}
            />
          </PressableFeedback>
        )}
      </Animated.View>

      <ScrollView
        style={{ flexGrow: 0, maxHeight: '60%' }}
        showsVerticalScrollIndicator={false}
        className="border-l-2 border-accent/40 pl-4"
      >
        <AppText className="text-xl italic leading-8 text-foreground" selectable>
          {mirror}
        </AppText>
      </ScrollView>

      <View className="mt-14 gap-6">
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <LinkButton onPress={() => { playAffirmativePress(); onThatsIt(); }} size="lg" className="self-start">
            <LinkButton.Label className="font-semibold text-accent">
              That&apos;s it
            </LinkButton.Label>
          </LinkButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <LinkButton onPress={() => { playSoftPress(); onNotQuite(); }} size="md" className="self-start">
            <LinkButton.Label className="text-foreground/50">
              Not quite
            </LinkButton.Label>
          </LinkButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <LinkButton onPress={() => { playSoftPress(); onSayMore(); }} size="md" className="self-start">
            <LinkButton.Label className="text-foreground/50">
              Say more
            </LinkButton.Label>
          </LinkButton>
        </Animated.View>
      </View>
    </View>
  );
};
