/**
 * The intake questionnaire (T5, issue #265) — 11 questions across 3 sections,
 * 2 info interstitials, one branch, paged internally.
 *
 * Internally paged rather than one route per step: intake is forward-only with
 * no back edge, so the step cursor is state, not history, and a cold kill lands
 * back at the start with the (non-persisted) answers slice already empty.
 */
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import type { QuestionnaireAnswers } from '@/src/components/ui/questionnaire';
import { FindingStep } from '@/src/features/intake/questionnaire/finding-step';
import { PrivacyStep, ShakeStep } from '@/src/features/intake/questionnaire/interstitials';
import { NameStep } from '@/src/features/intake/questionnaire/name-step';
import { CarryStep, YouStep } from '@/src/features/intake/questionnaire/section-steps';
import { suggestHandle } from '@/src/features/intake/questions';
import { useIntakeComplete } from '@/src/features/intake/use-intake-complete';
import { usePlusEntitlement } from '@/src/features/purchases/use-plus-entitlement';
import type { IntakeAnswers } from '@/src/store/intake-slice';
import { useAppStore } from '@/src/store/store';

type Step = 'name' | 'you' | 'privacy' | 'carry' | 'shake' | 'finding';

/**
 * Q11 is presented as Yes/No, so the questionnaire holds it as a string; the
 * mutation takes a boolean. Nothing else needs translating — every other value
 * is already the enum `intake.complete` accepts.
 */
function toIntakeAnswers(answers: QuestionnaireAnswers): IntakeAnswers {
  const { seriesWantInApp, ...rest } = answers;
  return {
    ...rest,
    ...(seriesWantInApp === undefined ? {} : { seriesWantInApp: seriesWantInApp === 'true' }),
  } as IntakeAnswers;
}

export default function IntakeQuestionnaire() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const setIntakeAnswers = useAppStore((s) => s.setIntakeAnswers);

  // Deduped against the root's subscription. An existing user already has a
  // name, and Q1 pre-fills from it rather than suggesting a new handle.
  const context = useQuery(api.users.getFullContext);
  const { isPlus } = usePlusEntitlement();
  const completeIntake = useIntakeComplete();
  const finishing = useRef(false);

  const record = (answers: QuestionnaireAnswers, next: Step) => {
    setIntakeAnswers(toIntakeAnswers(answers));
    setStep(next);
  };

  /*
   * Entitlement skip lives here, at the completion handler — not as a guard
   * around the paywall screen (T4, issue #235): someone who already pays never
   * sees the offer, but still gets the message and the questions.
   *
   * `isPlus` is false until both entitlement sources answer, so a subscriber
   * whose SDK is still loading eleven questions later sees the paywall — an
   * extra screen they leave with "Not now", which completes intake the same
   * way. Waiting on `isResolved` instead would trade that for a Done button
   * that silently does nothing.
   */
  const finish = (answers: QuestionnaireAnswers) => {
    if (finishing.current) return;
    finishing.current = true;
    setIntakeAnswers(toIntakeAnswers(answers));
    if (!isPlus) {
      router.push('/(intake)/paywall');
      return;
    }
    // `completeIntake` swallows a failed write (toast + stay put), so the latch
    // has to come off or Done is inert for the rest of the flow — and intake
    // has no back edge to escape through.
    void completeIntake().finally(() => {
      finishing.current = false;
    });
  };

  switch (step) {
    case 'name':
      // Held until the query answers so the field isn't seeded with a
      // suggestion the user's own saved name is about to replace.
      if (context === undefined) return <View className="flex-1 bg-background" />;
      return (
        <NameStep
          initialName={context.preferences?.displayName || suggestHandle()}
          onDone={(displayName) => record({ displayName }, 'you')}
        />
      );
    case 'you':
      return <YouStep onDone={(answers) => record(answers, 'privacy')} />;
    case 'privacy':
      return <PrivacyStep onDone={() => setStep('carry')} />;
    case 'carry':
      return <CarryStep onDone={(answers) => record(answers, 'shake')} />;
    case 'shake':
      return <ShakeStep onDone={() => setStep('finding')} />;
    case 'finding':
      return <FindingStep onDone={finish} />;
  }
}
