import { useEffect } from 'react';
import { View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { LinkButton } from 'heroui-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/shared/app-text';
import { playCompassionateHold } from '@/src/lib/haptics';
import { GaveUpFeedbackCard } from '@/src/features/reflect/components/gave-up-feedback-card';
import type { Id } from '@/convex/_generated/dataModel';

type Props = {
  onPathSelection: () => void;
  onReset: () => void;
  sessionId?: Id<'sessions'>;
};

export const GaveUpState = ({ onPathSelection, onReset, sessionId }: Props) => {
  const router = useRouter();

  useEffect(() => {
    playCompassionateHold();
  }, []);

  return (
  <View className="flex-1 justify-center px-6">
    <AppText className="text-xl leading-8 text-foreground">
      Sometimes words can&apos;t quite capture what we feel — and that&apos;s okay.
    </AppText>

    <AppText className="mt-4 text-base leading-6 text-foreground/40">
      What you shared still matters, even if the mirror didn&apos;t reflect it perfectly.
    </AppText>

    {sessionId && <GaveUpFeedbackCard sessionId={sessionId} />}

    <View className="mt-14 gap-6">
      <EaseView
        initialAnimate={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200, easing: [0.455, 0.03, 0.515, 0.955] }}
      >
        <LinkButton accessibilityLabel="See my options" onPress={onPathSelection} size="md" className="self-start">
          <LinkButton.Label className="font-semibold text-accent">
            See my options
          </LinkButton.Label>
        </LinkButton>
      </EaseView>

      <EaseView
        initialAnimate={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 400, easing: [0.455, 0.03, 0.515, 0.955] }}
      >
        <LinkButton accessibilityLabel="Start fresh" onPress={onReset} size="md" className="self-start">
          <LinkButton.Label className="text-foreground/50">
            Start fresh
          </LinkButton.Label>
        </LinkButton>
      </EaseView>

      <EaseView
        initialAnimate={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
      >
        <LinkButton
          accessibilityLabel="Explore different mirror tones"
          onPress={() => router.push('/settings')}
          size="sm"
          className="self-start"
        >
          <LinkButton.Label className="text-foreground/30">
            Explore different mirror tones →
          </LinkButton.Label>
        </LinkButton>
      </EaseView>
    </View>
  </View>
  );
};
