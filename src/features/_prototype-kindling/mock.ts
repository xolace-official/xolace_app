/**
 * PROTOTYPE — throwaway. Issue #273 (kindling screen shape + "why" line voice).
 * Delete this whole directory once a variant wins. Do NOT import from app code.
 *
 * State model under test: an ORDERED list of independent tri-state steps.
 * The order is deliberate (the system's best guess at a helpful sequence), but
 * completion is not sequential — any step can be marked done or skipped at any
 * time. There is no single "progress value"; each step owns its own state.
 */
import { useCallback, useState } from 'react';
import type { SymbolViewProps } from 'expo-symbols';

export type StepState = 'pending' | 'done' | 'skipped';
export type StepKind = 'breathing' | 'audio' | 'xolacer';

export interface KindlingStep {
  id: string;
  kind: StepKind;
  /** SF Symbol for the rail node. */
  symbol: SymbolViewProps['name'];
  eyebrow: string;
  title: string;
  /** The model's one-line "why this step, for you". See voice notes below. */
  why: string;
  /** Primary affordance label on the card. */
  actionLabel: string;
  state: StepState;
}

/*
 * "why" line voice — SETTLED for this prototype, open to the founder's react.
 *
 * Rules the copy holds to:
 *   - second person, present; talks to the user, not about them
 *   - names something they actually said in the session ("you said…", "you came
 *     back to…") so it reads as heard, not generated
 *   - states what the action *does*, plainly — no promise, no outcome claim
 *   - no clinical register: not "anxiety", "symptoms", "cope", "regulate",
 *     "grounding", "manage". Campfire, not care-plan.
 *   - one sentence, ~12–22 words. Two short beats, not one long clause.
 *
 * Repo precedent: articulator copy was tuned ~5–6 rounds against the live model
 * (docs/confidence-aware-mirroring.md). Same expectation here — these three are
 * the starting draft, and each carries one alternate to react against.
 */
const STEPS: KindlingStep[] = [
  {
    id: 'k1',
    kind: 'breathing',
    symbol: 'wind',
    eyebrow: 'A few minutes',
    title: 'Sit with this',
    why: 'Your breathing kept catching while you wrote. This is a short while to let it out slow.',
    // alt: "You said it was hard to catch your breath. Take a few slow rounds here."
    actionLabel: 'Begin',
    state: 'pending',
  },
  {
    id: 'k2',
    kind: 'audio',
    symbol: 'waveform',
    eyebrow: 'Something to hear',
    title: 'Low sound for the quiet',
    why: 'You said the place feels too quiet at night. Something low in the background can sit with you.',
    // alt: "The quiet came up more than once. Here's something soft to fill it."
    actionLabel: 'Play',
    state: 'pending',
  },
  {
    id: 'k3',
    kind: 'xolacer',
    symbol: 'person.2',
    eyebrow: 'When you want it',
    title: 'Someone who has been here',
    why: "You came back to feeling alone in this more than once. One person who gets it changes the room.",
    // alt: "Feeling alone kept coming up. A xolacer who's felt the same is around."
    actionLabel: 'See who',
    state: 'pending',
  },
];

export interface KindlingModel {
  steps: KindlingStep[];
  doneCount: number;
  total: number;
  allSettled: boolean;
  markDone: (id: string) => void;
  skip: (id: string) => void;
  reset: () => void;
}

export function useKindlingMock(): KindlingModel {
  const [steps, setSteps] = useState<KindlingStep[]>(() =>
    STEPS.map((s) => ({ ...s }))
  );

  const set = useCallback((id: string, state: StepState) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, state } : s))
    );
  }, []);

  const markDone = useCallback((id: string) => set(id, 'done'), [set]);
  const skip = useCallback((id: string) => set(id, 'skipped'), [set]);
  const reset = useCallback(
    () => setSteps(STEPS.map((s) => ({ ...s }))),
    []
  );

  const doneCount = steps.filter((s) => s.state === 'done').length;
  const allSettled = steps.every((s) => s.state !== 'pending');

  return {
    steps,
    doneCount,
    total: steps.length,
    allSettled,
    markDone,
    skip,
    reset,
  };
}

/** Preview states driven by ?state= on the route. */
export type PreviewState = 'active' | 'loading' | 'empty';
