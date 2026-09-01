import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { usePlusEntitlement } from '@/src/features/purchases/use-plus-entitlement';
import { useIntakeComplete } from '@/src/features/intake/use-intake-complete';
import { useAppStore } from '@/src/store/store';
import type { IntakeAnswers } from '@/src/store/intake-slice';

/** Stands in for Q2–Q11 until the real questions land, so the skeleton writes
 *  a row `intake.complete` actually accepts. Q1 (displayName) is supplied
 *  separately — `complete` patches it unconditionally, so a placeholder would
 *  overwrite an existing user's chosen name. */
const PLACEHOLDER_ANSWERS: IntakeAnswers = {
  intent: 'prefer_not_to_say',
  weighingOn: ['cant_name_yet'],
  emotionAwareness: 'prefer_not_to_say',
  disclosureStyle: 'depends',
  copingStyle: ['prefer_not_to_say'],
  supportFrequency: 'not_sure',
  ageBracket: 'prefer_not_to_say',
  acquisitionSource: 'other',
};

export default function IntakeQuestionnaire() {
  const router = useRouter();
  const setIntakeAnswers = useAppStore((s) => s.setIntakeAnswers);
  // Deduped against the root's subscription. An existing user already has a
  // name; the real Q1 will prefill from it too.
  const context = useQuery(api.users.getFullContext);
  const { isPlus, isResolved } = usePlusEntitlement();
  const completeIntake = useIntakeComplete();

  // Entitlement skip lives here, at the completion handler — not as a guard
  // around the paywall screen (T4, issue #235): someone who already pays never
  // sees the offer, but still gets the message and the questions.
  const onNext = () => {
    setIntakeAnswers({
      ...PLACEHOLDER_ANSWERS,
      displayName: context?.preferences?.displayName || 'Friend',
    });
    if (isPlus) {
      void completeIntake();
      return;
    }
    router.push('/(intake)/paywall');
  };

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <AppText className="text-2xl text-foreground">Questionnaire</AppText>
      {/* `isPlus` is false until both entitlement sources answer, so an
          unresolved tap would send a paying subscriber to the paywall. */}
      <Button isDisabled={!isResolved || context === undefined} onPress={onNext}>
        Next
      </Button>
    </View>
  );
}
