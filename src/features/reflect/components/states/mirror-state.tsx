import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { Chip, LinkButton, PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/src/components/shared/app-text';
import type { EntryType } from '@/src/features/reflect/types';
import type { Id } from '@/convex/_generated/dataModel';
import { playMirrorArrival, playAffirmativePress, playSoftPress } from '@/src/lib/haptics';
import { useMirrorAudio } from '@/src/features/reflect/hooks/use-mirror-audio';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { ToneTipBanner } from '@/src/features/reflect/components/tone-tip-banner';

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
  const { mirrorTone } = useSettings();
  const showToneBadge = mirrorTone !== 'adaptive';
  const toneLabel = mirrorTone.charAt(0).toUpperCase() + mirrorTone.slice(1);

  const TONE_BADGE: Partial<Record<string, { text: string; border: string }>> = {
    poetic:   { text: 'text-purple-400',  border: 'border-purple-400/40' },
    gentle:   { text: 'text-rose-400',    border: 'border-rose-400/40' },
    direct:   { text: 'text-sky-400',     border: 'border-sky-400/40' },
    witnessed:{ text: 'text-amber-400',   border: 'border-amber-400/40' },
  };
  const badgeStyle = TONE_BADGE[mirrorTone] ?? { text: 'text-foreground/40', border: 'border-foreground/20' };

  useEffect(() => {
    playMirrorArrival();
    return () => { stop(); };
  }, [stop]);

  const showTextures =
    selectedTextures.length > 0 &&
    (entryType === 'scaffold' || entryType === 'hybrid');

  return (
    <View className="flex-1 justify-center px-6">
      {/* Banner floats above content — absolute so it doesn't shift the mirror */}
      <View style={{ position: 'absolute', top: 8, left: 24, right: 24, zIndex: 1 }}>
        <ToneTipBanner />
      </View>

      {/* Texture pills from scaffold */}
      {showTextures && (
        <EaseView
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, easing: [0.455, 0.03, 0.515, 0.955] }}
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
        </EaseView>
      )}

      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
        className="mb-3 flex-row items-center gap-3"
      >
        <AppText className="text-xs uppercase tracking-widest text-accent">
          The Mirror
        </AppText>
        {isReady && (
          <PressableFeedback
            onPress={() => { playSoftPress(); toggle(); }}
            animation={{ scale: { ignoreScaleCoefficient: true, value: 0.85 } }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause mirror audio' : 'Play mirror audio'}
            accessibilityHint="Toggles playback of the mirror response"
            accessibilityState={{ selected: isPlaying }}
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
      </EaseView>

      {showToneBadge && (
        <View className="mb-3 flex-row">
          <View className={`rounded-full border px-2.5 py-0.5 ${badgeStyle.border}`}>
            <AppText className={`text-xs ${badgeStyle.text}`}>{toneLabel}</AppText>
          </View>
        </View>
      )}

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
        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200, easing: [0.455, 0.03, 0.515, 0.955] }}
        >
          <LinkButton onPress={() => { playAffirmativePress(); onThatsIt(); }} size="lg" className="self-start">
            <LinkButton.Label className="font-semibold text-accent">
              That&apos;s it
            </LinkButton.Label>
          </LinkButton>
        </EaseView>

        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400, easing: [0.455, 0.03, 0.515, 0.955] }}
        >
          <LinkButton onPress={() => { playSoftPress(); onNotQuite(); }} size="md" className="self-start">
            <LinkButton.Label className="text-foreground/50">
              Not quite
            </LinkButton.Label>
          </LinkButton>
        </EaseView>

        <EaseView
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
        >
          <LinkButton onPress={() => { playSoftPress(); onSayMore(); }} size="md" className="self-start">
            <LinkButton.Label className="text-foreground/50">
              Say more
            </LinkButton.Label>
          </LinkButton>
        </EaseView>
      </View>
    </View>
  );
};
