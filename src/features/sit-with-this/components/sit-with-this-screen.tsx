import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { useToast } from "heroui-native";
import { api } from "@/convex/_generated/api";
import { usePathSession } from "@/src/features/sit-with-this/hooks/use-path-session";
import { usePostHog } from "posthog-react-native";
import { ExerciseRunner } from "./runner/exercise-runner";
import { SwapSheet } from "./swap-sheet";
import { AppText } from "@/src/components/shared/app-text";
import type { ExerciseData } from "./runner/exercise-runner.types";
import type { Id } from "@/convex/_generated/dataModel";

const styles = StyleSheet.create({
  insetsContainer: { paddingTop: 0, paddingBottom: 0 },
});

export function SitWithThisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const startedRef = useRef(false);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const insetsStyle = [
    styles.insetsContainer,
    { paddingTop: insets.top, paddingBottom: insets.bottom },
  ];

  const { sessionId, session, startPath } = usePathSession();
  const posthog = usePostHog();
  const exerciseResult = useQuery(
    api.exercises.getForSession,
    sessionId ? { sessionId } : "skip",
  );
  const swapOptions = useQuery(
    api.exercises.getSwapOptions,
    sessionId ? { sessionId } : "skip",
  );
  const preferences = useQuery(api.preferences.get);
  const recordSwapMutation = useMutation(api.exercises.recordSwap);

  useEffect(() => {
    if (startedRef.current || !sessionId || !session) return;
    if (session.state === "path_selected") {
      const go = async () => {
        const ok = await startPath();
        if (ok) startedRef.current = true;
      };
      go();
    } else if (session.state === "path_in_progress") {
      startedRef.current = true;
    }
  }, [sessionId, session, startPath]);

  // Don't complete the session here — that would flip it to a terminal state and
  // strand session-end (its "no active session" guard bounces home, and it loses
  // the distilled/mirror text it reads from the active session). Like the peer
  // and exit paths, we just navigate and let session-end complete on dismiss,
  // carrying whether the exercise was finished.
  const handleComplete = async () => {
    router.replace("/session-end?path=solo&completed=true");
  };

  const handleExitEarly = async () => {
    router.replace("/session-end?path=solo&completed=false");
  };

  const handleSwap = async (newExerciseId: Id<"exercises">) => {
    if (!sessionId) return;
    try {
      const result = await recordSwapMutation({ sessionId, newExerciseId });
      posthog.capture("exercise_swapped", {
        swaps_used: result.swapsUsed,
      });
      setSwapSheetOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // Server-state mismatches: close sheet and let queries re-render.
      if (
        msg.includes("Maximum swaps reached") ||
        msg.includes("Exercise not allowed")
      ) {
        setSwapSheetOpen(false);
        return;
      }
      toast.show({
        label: "Could not switch",
        description: "Try again in a moment.",
        variant: "default",
      });
    }
  };

  const handleOpenSwapSheet = () => {
    setSwapSheetOpen(true);
  };

  const exerciseData: ExerciseData | null = !exerciseResult ? null : {
    exercise: {
      _id: exerciseResult.exercise._id,
      title: exerciseResult.exercise.title,
      type: exerciseResult.exercise.type,
      steps: exerciseResult.exercise.steps,
      estimatedMinutes: exerciseResult.exercise.estimatedMinutes,
    },
    slots: exerciseResult.slots,
  };

  if (exerciseResult === undefined || !session || preferences === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={insetsStyle}
      >
        <AppText className="text-center text-base text-foreground/40">
          Getting ready…
        </AppText>
      </View>
    );
  }

  if (exerciseResult === null) {
    return (
      <View
        className="flex-1 items-center justify-center gap-8 bg-background px-8"
        style={insetsStyle}
      >
        <AppText className="text-center text-base text-foreground/60">
          No exercise available right now.
        </AppText>
        <AppText
          className="text-center text-sm text-foreground/40"
          onPress={handleExitEarly}
        >
          Go back
        </AppText>
      </View>
    );
  }

  const swapsUsed = session.swappedExerciseIds?.length ?? 0;
  // Derive from session: if any swaps have happened, skip pre-roll on remount.
  const hasSwapped = swapsUsed > 0;

  return (
    <View className="flex-1 bg-background" style={insetsStyle}>
      <ExerciseRunner
        key={exerciseData?.exercise._id}
        exercise={exerciseData!}
        reducedMotion={preferences.reducedMotion}
        showPreRoll={!hasSwapped}
        onComplete={handleComplete}
        onExitEarly={handleExitEarly}
        onSwap={swapsUsed < 2 ? handleOpenSwapSheet : undefined}
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
