import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useToast } from 'heroui-native';
import type { FunctionArgs } from 'convex/server';
import * as Sentry from '@sentry/react-native';

import { api } from '@/convex/_generated/api';
import { useAppStore } from '@/src/store/store';

type CompleteArgs = FunctionArgs<typeof api.intake.complete>;

/**
 * Terminal step of intake: write the answers, clear the draft slice, land in
 * the app. Fires at paywall exit — both exits, the "Not now" link and a
 * completed purchase — because `onboardingComplete` is what the root guard
 * reads, and it must not flip before the user has actually left the paywall.
 *
 * The `replace` is belt-and-braces: the reactive guard evicts `(intake)` on
 * its own once the flag lands.
 */
export function useIntakeComplete() {
  const complete = useMutation(api.intake.complete);
  const router = useRouter();
  const { toast } = useToast();

  return async () => {
    const { intakeAnswers, resetIntakeAnswers } = useAppStore.getState();
    try {
      await complete(intakeAnswers as CompleteArgs);
    } catch (error) {
      // Stay in intake — the guard still reads onboardingComplete: false, so
      // bouncing to (protected) here would only be undone on the next render.
      // Say so out loud: intake has no back edge, so a silent failure would
      // leave the user tapping a button that does nothing.
      Sentry.captureException(error);
      toast.show({
        label: "Couldn't finish setting up",
        description: 'Check your connection and try again.',
      });
      return;
    }
    resetIntakeAnswers();
    router.replace('/(protected)');
  };
}
