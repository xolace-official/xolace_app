import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import type { ReflectionStateName } from '@/src/features/reflect/types';
import { normalizeScreen } from '@/src/features/reflect/reflect-transitions';

type TransitionState = {
  current: ReflectionStateName;
  previous: ReflectionStateName | null;
  isTransitioning: boolean;
};

/**
 * Manages cross-fade transitions between reflect state screens.
 *
 * When the screen changes, the old screen is kept mounted (fading out)
 * while the new screen mounts and fades in. Once the outgoing fade
 * completes, the old screen is unmounted.
 */
export function useScreenTransition(screen: ReflectionStateName) {
  const normalized = normalizeScreen(screen);
  const [state, setState] = useState<TransitionState>({
    current: normalized,
    previous: null,
    isTransitioning: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const prev = stateRef.current;
    const next = normalizeScreen(screen);

    if (next === normalizeScreen(prev.current)) return;

    Keyboard.dismiss();
    setState({
      current: next,
      previous: prev.current,
      isTransitioning: true,
    });
  }, [screen]);

  const onOutgoingComplete = () => {
    setState((prev) => ({
      ...prev,
      previous: null,
      isTransitioning: false,
    }));
  };

  return {
    current: state.current,
    previous: state.previous,
    isTransitioning: state.isTransitioning,
    onOutgoingComplete,
  };
}
