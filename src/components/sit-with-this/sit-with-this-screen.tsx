import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { usePathSession } from '@/src/hooks/use-path-session';
import { ExerciseRunner } from './runner/exercise-runner';
import { AppText } from '@/src/components/shared/app-text';
import type { ExerciseData } from './runner/exercise-runner.types';

export function SitWithThisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startedRef = useRef(false);

  const { sessionId, session, startPath, completePath } = usePathSession();
  const exerciseResult = useQuery(
    api.exercises.getForSession,
    sessionId ? { sessionId } : 'skip',
  );
  const preferences = useQuery(api.preferences.get);

  useEffect(() => {
    if (startedRef.current || !sessionId || !session) return;
    if (session.state === 'path_selected') {
      const go = async () => {
        const ok = await startPath();
        if (ok) startedRef.current = true;
      };
      go();
    } else if (session.state === 'path_in_progress') {
      startedRef.current = true;
    }
  }, [sessionId, session, startPath]);

  const handleComplete = async () => {
    await completePath(true);
    router.replace('/session-end?path=solo');
  };

  const handleExitEarly = async () => {
    await completePath(false);
    router.replace('/session-end?path=solo');
  };

  if (!exerciseResult || !session) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <AppText className="text-center text-base text-foreground/40">
          Getting ready...
        </AppText>
      </View>
    );
  }

  const exerciseData: ExerciseData = {
    exercise: {
      _id: exerciseResult.exercise._id,
      title: exerciseResult.exercise.title,
      type: exerciseResult.exercise.type,
      steps: exerciseResult.exercise.steps,
      estimatedMinutes: exerciseResult.exercise.estimatedMinutes,
    },
    slots: exerciseResult.slots,
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ExerciseRunner
        exercise={exerciseData}
        reducedMotion={preferences?.reducedMotion ?? false}
        onComplete={handleComplete}
        onExitEarly={handleExitEarly}
      />
    </View>
  );
}
