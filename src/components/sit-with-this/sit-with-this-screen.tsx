import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { usePathSession } from '@/src/hooks/use-path-session';
import { ExerciseRunner } from './runner/exercise-runner';
import { SwapSheet } from './swap-sheet';
import { AppText } from '@/src/components/shared/app-text';
import type { ExerciseData } from './runner/exercise-runner.types';
import type { Id } from '../../../convex/_generated/dataModel';

export function SitWithThisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startedRef = useRef(false);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);

  const { sessionId, session, startPath, completePath } = usePathSession();
  const exerciseResult = useQuery(
    api.exercises.getForSession,
    sessionId ? { sessionId } : 'skip',
  );
  const swapOptions = useQuery(
    api.exercises.getSwapOptions,
    sessionId ? { sessionId } : 'skip',
  );
  const preferences = useQuery(api.preferences.get);
  const recordSwapMutation = useMutation(api.exercises.recordSwap);

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

  const handleComplete = useCallback(async () => {
    await completePath(true);
    router.replace('/session-end?path=solo');
  }, [completePath, router]);

  const handleExitEarly = useCallback(async () => {
    await completePath(false);
    router.replace('/session-end?path=solo');
  }, [completePath, router]);

  const handleSwap = useCallback(async (newExerciseId: Id<'exercises'>) => {
    if (!sessionId) return;
    try {
      await recordSwapMutation({ sessionId, newExerciseId });
    } catch {
      // Server-enforced cap — button will be hidden on next render
    }
    setSwapSheetOpen(false);
  }, [sessionId, recordSwapMutation]);

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

  const swapsUsed = session.swappedExerciseIds?.length ?? 0;
  // Derive from session: if any swaps have happened, skip pre-roll on remount.
  const hasSwapped = swapsUsed > 0;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ExerciseRunner
        key={exerciseData.exercise._id}
        exercise={exerciseData}
        reducedMotion={preferences?.reducedMotion ?? false}
        showPreRoll={!hasSwapped}
        onComplete={handleComplete}
        onExitEarly={handleExitEarly}
        onSwap={swapsUsed < 2 ? () => setSwapSheetOpen(true) : undefined}
      />

      <SwapSheet
        isOpen={swapSheetOpen}
        onOpenChange={setSwapSheetOpen}
        swapsUsed={swapsUsed}
        resetId={swapOptions?.resetId ?? null}
        nextBestId={swapOptions?.nextBestId ?? null}
        onKeepGoing={() => setSwapSheetOpen(false)}
        onSwap={handleSwap}
      />
    </View>
  );
}
