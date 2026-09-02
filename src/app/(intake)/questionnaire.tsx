/**
 * The intake questionnaire (T5, issue #265) — 11 questions across 3 sections,
 * 2 info interstitials, one branch, paged internally.
 *
 * Internally paged rather than one route per step: intake is forward-only with
 * no back edge, so the step cursor is state, not history, and a cold kill lands
 * back at the start with the (non-persisted) answers slice already empty.
 */
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import type { QuestionnaireAnswers } from '@/src/components/ui/questionnaire';
import { BeatStep } from '@/src/features/intake/questionnaire/beat-step';
import { CompoundingStep } from '@/src/features/intake/questionnaire/compounding-step';
import { CountStep } from '@/src/features/intake/questionnaire/count-step';
import { FindingStep } from '@/src/features/intake/questionnaire/finding-step';
import { IntakeBlank } from '@/src/features/intake/questionnaire/intake-screen';
import { PrivacyStep, ShakeStep } from '@/src/features/intake/questionnaire/interstitials';
import { MASCOT_WAVE, MASCOT_WRITING } from '@/src/features/intake/questionnaire/mascot';
import { NameStep } from '@/src/features/intake/questionnaire/name-step';
import { CarryStep, YouStep } from '@/src/features/intake/questionnaire/section-steps';
import { suggestHandle } from '@/src/features/intake/answer-rules';
import { useIntakeComplete } from '@/src/features/intake/use-intake-complete';
import { usePlusEntitlement } from '@/src/features/purchases/use-plus-entitlement';
import type { IntakeAnswers } from '@/src/store/intake-slice';
import { useAppStore } from '@/src/store/store';

type Step =
  | 'name'
  | 'hey'
  | 'you'
  | 'noted'
  | 'privacy'
  | 'carry'
  | 'compounding'
  | 'shake'
  | 'finding'
  | 'count';

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
  // The name is echoed back on the beat after it's picked, and threaded into
  // each section's mascot line after that. Local, not from the store: the
  // store's copy is the submission payload, not screen state.
  const [name, setName] = useState('');
  const setIntakeAnswers = useAppStore((s) => s.setIntakeAnswers);

  // Deduped against the root's subscription. An existing user already has a
  // name, and Q1 pre-fills from it rather than suggesting a new handle.
  const context = useQuery(api.users.getFullContext);
  const { isPlus } = usePlusEntitlement();
  const completeIntake = useIntakeComplete();
  const finishing = useRef(false);
  const finalAnswers = useRef<QuestionnaireAnswers | null>(null);

  const recordAndAdvance = (answers: QuestionnaireAnswers, next: Step) => {
    setIntakeAnswers(toIntakeAnswers(answers));
    setStep(next);
  };

  /*
   * Entitlement skip lives here, at the completion handler — not as a guard
   * around the paywall screen (T4, issue #235): someone who already pays never
   * sees the offer, but still gets the message and the questions.
   *
   * `isPlus` is false until both entitlement sources answer, so a subscriber
   * whose SDK is still loading eleven questions later is pushed anyway.
   * Waiting on `isResolved` here would trade that for a Done button that
   * silently does nothing, so the offer screen catches it instead: it holds a
   * blank frame and finishes intake the moment entitlement resolves, and the
   * deck is never shown to someone already paying.
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
      if (context === undefined) return <IntakeBlank />;
      return (
        <NameStep
          initialName={context.preferences?.displayName || suggestHandle()}
          onDone={(displayName) => {
            setName(displayName);
            recordAndAdvance({ displayName }, 'hey');
          }}
        />
      );
    case 'hey':
      return (
        <BeatStep
          line={`Hey, ${name}.`}
          subline="That's the only name anyone here sees."
          mascot={MASCOT_WAVE}
          onDone={() => setStep('you')}
        />
      );
    case 'you':
      return <YouStep onDone={(answers) => recordAndAdvance(answers, 'noted')} />;
    case 'noted':
      return <BeatStep line="Noted." mascot={MASCOT_WRITING} onDone={() => setStep('privacy')} />;
    case 'privacy':
      return <PrivacyStep onDone={() => setStep('carry')} />;
    case 'carry':
      return <CarryStep onDone={(answers) => recordAndAdvance(answers, 'compounding')} />;
    case 'compounding':
      return <CompoundingStep onDone={() => setStep('shake')} />;
    case 'shake':
      return <ShakeStep onDone={() => setStep('finding')} />;
    case 'finding':
      return (
        <FindingStep
          onDone={(answers) => {
            finalAnswers.current = answers;
            recordAndAdvance(answers, 'count');
          }}
        />
      );
    case 'count':
      // The count reads real numbers, so it can't be the screen that submits —
      // a slow or failed stats read must never hold the answers hostage. They
      // are already in the store by now; this only walks on.
      return <CountStep onDone={() => finish(finalAnswers.current ?? {})} />;
  }
}
