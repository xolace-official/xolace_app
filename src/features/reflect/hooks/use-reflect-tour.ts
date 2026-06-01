import { useEffect, useReducer, useRef } from 'react';
import { useSessionMode } from '@/src/context/session-mode-context';
import { posthog } from '@/src/config/posthog';
import { useAppStore } from '@/src/store/store';
import { TOUR_STEPS } from '@/src/features/reflect/tour-copy';

type TourState = {
  currentStepIndex: number;
  isActive: boolean;
  isComplete: boolean;
};

type TourAction =
  | { type: 'START_TOUR' }
  | { type: 'NEXT_STEP' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'SKIP_TOUR' };

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START_TOUR':
      return { isActive: true, isComplete: false, currentStepIndex: 0 };
    case 'NEXT_STEP':
      return { ...state, currentStepIndex: state.currentStepIndex + 1 };
    case 'COMPLETE_TOUR':
      return { isActive: false, isComplete: true, currentStepIndex: 0 };
    case 'SKIP_TOUR':
      return { isActive: false, isComplete: true, currentStepIndex: 0 };
    default:
      return state;
  }
}

export function useReflectTour() {
  const reflectTourSeen = useAppStore((s) => s.reflectTourSeen);
  const setReflectTourSeen = useAppStore((s) => s.setReflectTourSeen);
  const founderWelcomeSeen = useAppStore((s) => s.founderWelcomeSeen);
  const { isNight } = useSessionMode();

  const steps = isNight ? TOUR_STEPS.slice(0, 3) : [...TOUR_STEPS];

  const [tourState, dispatch] = useReducer(tourReducer, {
    currentStepIndex: 0,
    isActive: false,
    isComplete: false,
  });

  const isAdvancing = useRef(false);

  // Start tour after idle screen settles — but only after founder welcome is dismissed
  useEffect(() => {
    if (!reflectTourSeen && founderWelcomeSeen) {
      const t = setTimeout(() => dispatch({ type: 'START_TOUR' }), 800);
      return () => clearTimeout(t);
    }
  }, [reflectTourSeen, founderWelcomeSeen]);

  // Fire tour_started once the first step is shown
  const hasFiredStartEvent = useRef(false);
  useEffect(() => {
    if (tourState.isActive && !hasFiredStartEvent.current) {
      hasFiredStartEvent.current = true;
      posthog.capture('tour_started');
    }
  }, [tourState.isActive]);

  // Complete when step index passes the last step
  useEffect(() => {
    if (!tourState.isActive) return;
    if (tourState.currentStepIndex >= steps.length) {
      dispatch({ type: 'COMPLETE_TOUR' });
      setReflectTourSeen(true);
      posthog.capture('tour_completed');
    }
  }, [tourState.currentStepIndex, tourState.isActive, steps.length, setReflectTourSeen]);

  const advance = () => {
    if (!tourState.isActive || isAdvancing.current) return;
    isAdvancing.current = true;
    dispatch({ type: 'NEXT_STEP' });
    setTimeout(() => {
      isAdvancing.current = false;
    }, 600);
  };

  const skip = () => {
    dispatch({ type: 'SKIP_TOUR' });
    setReflectTourSeen(true);
    posthog.capture('tour_skipped', { at_step: tourState.currentStepIndex });
  };

  return { tourState, steps, advance, skip };
}
