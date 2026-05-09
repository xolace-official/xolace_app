import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';
import { Alert, AppState } from 'react-native';
import { useAppStore } from '@/src/store/store';

/**
 * Checks for OTA updates on mount and whenever the app comes to the foreground.
 * Defers to useVersionCheck — if a native store update is available, the OTA
 * alert is suppressed (the store update supersedes it).
 *
 * All network calls are no-ops in development mode.
 */
export function useOtaUpdate() {
  const appState = useRef(AppState.currentState);
  const alertActiveRef = useRef(false);
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const isVersionChecked = useAppStore((s) => s.isVersionChecked);
  const isNewVersionAvailable = useAppStore((s) => s.isNewVersionAvailable);

  // Silently download the update once detected, but only when we know the
  // installed version is already the latest store release.
  useEffect(() => {
    if (__DEV__ || !isUpdateAvailable || !isVersionChecked || isNewVersionAvailable) return;
    Updates.fetchUpdateAsync().catch(() => {});
  }, [isUpdateAvailable, isVersionChecked, isNewVersionAvailable]);

  // When download completes, prompt the user
  useEffect(() => {
    if (__DEV__ || !isUpdatePending || alertActiveRef.current) return;

    alertActiveRef.current = true;
    Alert.alert(
      'Update available',
      'A new update is ready. Refresh now to get the latest changes and improvements.',
      [
        {
          text: 'Later',
          onPress: () => {
            alertActiveRef.current = false;
          },
        },
        {
          text: 'Refresh',
          isPreferred: true,
          onPress: () => Updates.reloadAsync(),
        },
      ]
    );
  }, [isUpdatePending]);

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
}
