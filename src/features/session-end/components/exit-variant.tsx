import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { useRouter } from 'expo-router';
import { LinkButton } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { NIGHT_SESSION_END_EXIT } from '@/src/features/reflect/night-copy';

type Phase = 'acknowledge' | 'close';

type Props = {
  onHaveMore: () => void;
  isNight?: boolean;
};

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_SLOW = { type: 'timing' as const, duration: 600, easing: EASING };
const EASE_IN = { type: 'timing' as const, duration: 400, delay: 300, easing: EASING };

export const ExitVariant = ({ onHaveMore, isNight = false }: Props) => {
  const [phase, setPhase] = useState<Phase>('acknowledge');
  const router = useRouter();

  useEffect(() => {
    if (phase !== 'acknowledge') return;
    const timer = setTimeout(() => setPhase('close'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleTimelinePress = () => {
    router.push('/(protected)/timeline');
  };

  return (
    <View className="flex-1">
      {phase === 'acknowledge' && (
        <Pressable onPress={() => setPhase('close')} className="flex-1 px-8 justify-end pb-16">
          {/* TODO(mascot): Insert illustrated mascot component here when asset is ready */}
          <View className="flex-1" />
          <EaseView
            initialAnimate={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={EASE_SLOW}
          >
            <AppText className="mb-3 font-serif text-3xl text-foreground">
              {isNight ? NIGHT_SESSION_END_EXIT : 'Heard.'}
            </AppText>
            <View className="flex-row flex-wrap">
              <AppText className="text-base font-light leading-7 text-foreground/40">
                It&apos;s saved to{' '}
              </AppText>
              <LinkButton size="sm" onPress={handleTimelinePress}>
                <LinkButton.Label className="text-base font-light text-accent/60">
                  your timeline
                </LinkButton.Label>
              </LinkButton>
              <AppText className="text-base font-light leading-7 text-foreground/40">
                {' '}whenever you want to come back.
              </AppText>
            </View>
          </EaseView>
        </Pressable>
      )}

      {phase === 'close' && (
        <View className="flex-1 px-8 justify-center">
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={EASE_IN}
          >
            <LinkButton onPress={onHaveMore} size="sm" className="self-start">
              <LinkButton.Label className="font-light text-accent/60">
                Have more? I&apos;m here.
              </LinkButton.Label>
            </LinkButton>
          </EaseView>
        </View>
      )}
    </View>
  );
};
