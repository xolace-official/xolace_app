import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Uniwind } from 'uniwind';
import { useAppStore } from '@/src/store/store';

export type SessionMode = 'day' | 'night';

interface SessionModeContextType {
  mode: SessionMode;
  isNight: boolean;
}

const SessionModeContext = createContext<SessionModeContextType | undefined>(
  undefined,
);

/** Returns true if the given hour (0–23) falls in the night window (22:00–04:00). */
function isNightHour(hour: number): boolean {
  return hour >= 22 || hour < 4;
}

function computeMode(nightModeEnabled: boolean): SessionMode {
  if (!nightModeEnabled) return 'day';
  return isNightHour(new Date().getHours()) ? 'night' : 'day';
}

/**
 * Provides time-aware session mode to the app.
 *
 * - Computes initial mode from the device clock.
 * - Listens to AppState 'active' events to recompute on foreground.
 * - When entering the night window: stashes the current theme and
 *   switches to `nightly-dark` (or `nightly-light` if the user is
 *   in light mode). When exiting: restores the previous theme.
 * - Does NOT flip mid-session; callers that need the mode at session
 *   start should capture it via a ref.
 */
export function SessionModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const nightModeEnabled = useAppStore((s) => s.nightModeEnabled);
  const storedTheme = useAppStore((s) => s.theme);
  const colorThemeId = useAppStore((s) => s.colorThemeId);
  const previousTheme = useAppStore((s) => s.previousTheme);
  const setPreviousTheme = useAppStore((s) => s.setPreviousTheme);

  const [mode, setMode] = useState<SessionMode>(() =>
    computeMode(nightModeEnabled),
  );

  // Track whether we've already applied the nightly theme swap so we
  // don't double-stash on repeated AppState events within the window.
  // Always starts false — the first refresh() call on mount applies it.
  const nightAppliedRef = useRef(false);

  const applyNightTheme = useCallback(() => {
    if (nightAppliedRef.current) return;
    nightAppliedRef.current = true;
    // Stash the current Uniwind theme before switching
    const current = Uniwind.currentTheme as string;
    setPreviousTheme(current);
    // nightly always uses its dark variant (night mode = dark by intent)
    Uniwind.setTheme('nightly-dark' as never);
  }, [setPreviousTheme]);

  const restoreDayTheme = useCallback(() => {
    if (!nightAppliedRef.current) return;
    nightAppliedRef.current = false;
    const restore = previousTheme;
    setPreviousTheme(null);

    if (restore) {
      Uniwind.setTheme(restore as never);
      return;
    }

    // Fallback: reconstruct from stored preferences
    const modeStr =
      storedTheme === 'system' ? 'dark' : storedTheme;
    const nextTheme =
      colorThemeId === 'default'
        ? modeStr
        : (`${colorThemeId}-${modeStr}` as never);
    Uniwind.setTheme(nextTheme);
  }, [previousTheme, setPreviousTheme, storedTheme, colorThemeId]);

  const refresh = useCallback(() => {
    const next = computeMode(nightModeEnabled);
    setMode(next);
    if (next === 'night') {
      applyNightTheme();
    } else {
      restoreDayTheme();
    }
  }, [nightModeEnabled, applyNightTheme, restoreDayTheme]);

  // On mount and when nightModeEnabled changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // On app foreground
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        refresh();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [refresh]);

  return (
    <SessionModeContext.Provider value={{ mode, isNight: mode === 'night' }}>
      {children}
    </SessionModeContext.Provider>
  );
}

/** Access the current session mode anywhere inside SessionModeProvider. */
export function useSessionMode(): SessionModeContextType {
  const ctx = useContext(SessionModeContext);
  if (!ctx) {
    throw new Error('useSessionMode must be used within SessionModeProvider');
  }
  return ctx;
}
