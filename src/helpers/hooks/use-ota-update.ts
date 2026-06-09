import { useEffect, useRef, useState } from 'react';
import * as Updates from 'expo-updates';
import { AppState } from 'react-native';
import { useAppStore } from '@/src/store/store';

/**
 * Checks for OTA updates on mount and whenever the app comes to the foreground.
 * Defers to useVersionCheck — if a native store update is available, the OTA
 * sheet is suppressed (the store update supersedes it).
 *
 * All network calls are no-ops in development mode.
 */
export function useOtaUpdate() {
  const appState = useRef(AppState.currentState);
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const isVersionChecked = useAppStore((s) => s.isVersionChecked);
  const isNewVersionAvailable = useAppStore((s) => s.isNewVersionAvailable);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Silently download the update once detected, but only when we know the
  // installed version is already the latest store release.
  useEffect(() => {
    if (__DEV__ || !isUpdateAvailable || !isVersionChecked || isNewVersionAvailable) return;
    Updates.fetchUpdateAsync().catch(() => {});
  }, [isUpdateAvailable, isVersionChecked, isNewVersionAvailable]);

  // When download completes, open the sheet
  useEffect(() => {
    if (__DEV__ || !isUpdatePending || isSheetOpen) return;
    setIsSheetOpen(true);
  }, [isUpdatePending, isSheetOpen]);

  // Re-check for updates each time the app returns to the foreground
  useEffect(() => {
    if (__DEV__) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        Updates.checkForUpdateAsync().catch(() => {});
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return {
    isSheetOpen,
    dismiss: () => setIsSheetOpen(false),
    confirm: () => Updates.reloadAsync(),
  };
}
