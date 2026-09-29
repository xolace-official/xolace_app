import { useEffect } from 'react';
import { useToast } from 'heroui-native';
import { useAppStore } from '@/src/store/store';
import type { ReflectionAction, ReflectionStateName } from '@/src/features/reflect/types';

/**
 * A request from outside the screen to open the card (#462). From idle it opens
 * the composer the way a tap would; already composing, there is nothing to do;
 * anywhere else the card is not there to open, so the user is told how to get
 * to it rather than left with nothing happening. Spent either way.
 */
export function useComposerOpenRequest(
  screen: ReflectionStateName,
  dispatch: (action: ReflectionAction) => void,
) {
  const requested = useAppStore((s) => s.composerOpenRequested);
  const clear = useAppStore((s) => s.clearComposerOpenRequest);
  const { toast } = useToast();

  useEffect(() => {
    if (!requested) return;
    clear();
    if (screen === 'idle') dispatch({ type: 'TAP_INPUT' });
    else if (screen !== 'typing' && screen !== 'typing-nudge')
      toast.show({ label: 'Tap the card to start reflecting' });
  }, [requested, screen, dispatch, clear, toast]);
}
