import { useCallback, useEffect, useReducer } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/reflect/pill-button';
import { PreRollCard } from '@/src/components/sit-with-this/pre-roll-card';
import { BeatRenderer } from './beat-renderer';
import { runnerReducer } from './exercise-runner.reducer';
import type { ExerciseData } from './exercise-runner.types';

type Props = {
  exercise: ExerciseData;
  reducedMotion: boolean;
  onComplete: () => Promise<void>;
  onExitEarly: () => Promise<void>;
};

export function ExerciseRunner({ exercise, reducedMotion, onComplete, onExitEarly }: Props) {
  const steps = [...exercise.exercise.steps].sort((a, b) => a.order - b.order);
  const totalBeats = steps.length;

  const [phase, dispatch] = useReducer(runnerReducer, { kind: 'pre_roll' });

  useEffect(() => {
    if (phase.kind === 'close' && !phase.doneEnabled) {
      const t = setTimeout(() => dispatch({ type: 'UNLOCK_DONE' }), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase.kind === 'done') {
      onComplete();
    }
    // onComplete is stable (wrapped in useCallback at call site)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind]);

  const handleBeatComplete = useCallback(() => {
    dispatch({ type: 'BEAT_COMPLETE', totalBeats });
  }, [totalBeats]);

  if (phase.kind === 'pre_roll') {
    return (
      <View className="flex-1">
        <PreRollCard onBegin={() => dispatch({ type: 'BEGIN' })} />
      </View>
    );
  }

  if (phase.kind === 'playing') {
    const step = steps[phase.beatIndex];
    return (
      <View className="flex-1 items-center justify-center">
        <BeatRenderer
          key={`beat-${phase.beatIndex}`}
          step={step}
          slots={exercise.slots}
          reducedMotion={reducedMotion}
          onComplete={handleBeatComplete}
        />
      </View>
    );
  }

  if (phase.kind === 'close') {
    return (
      <Animated.View
        entering={FadeIn.duration(600)}
        className="flex-1 items-center justify-center gap-8 px-8"
      >
        <AppText className="text-center text-2xl font-semibold text-foreground">
          You stayed.
        </AppText>
        {phase.doneEnabled ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <PillButton label="Done" onPress={() => dispatch({ type: 'DONE' })} />
          </Animated.View>
        ) : (
          <Animated.View
            exiting={FadeOut.duration(200)}
            style={{ opacity: 0 }}
          >
            <PillButton label="Done" onPress={() => {}} disabled />
          </Animated.View>
        )}
        <Animated.View entering={FadeIn.delay(400).duration(400)}>
          <AppText
            className="text-center text-sm text-foreground/40"
            onPress={onExitEarly}
          >
            Leave early
          </AppText>
        </Animated.View>
      </Animated.View>
    );
  }

  return null;
}
