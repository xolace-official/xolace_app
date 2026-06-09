import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { getAppInfoFromTheStore, shouldUpdateApp } from '../utils/version-check';
import { APP_STORE_URL, PLAY_MARKET_URL } from '@/src/lib/constants/links';
import { useAppStore } from '@/src/store/store';

export function useVersionCheck() {
  const setIsVersionChecked = useAppStore((s) => s.setIsVersionChecked);
  const setIsNewVersionAvailable = useAppStore((s) => s.setIsNewVersionAvailable);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [storeLink, setStoreLink] = useState<string | null>(null);

  useEffect(() => {
    if (__DEV__) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const timeout = new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => resolve(null), 5000);
        });
        const result = await Promise.race([getAppInfoFromTheStore(), timeout]);
        const newestVersion = result?.version;
        const installedVersion = Constants.expoConfig?.version;

        if (
          installedVersion &&
          newestVersion &&
          shouldUpdateApp(installedVersion, newestVersion)
        ) {
          setIsNewVersionAvailable(true);

          const link = Platform.select({ ios: APP_STORE_URL, android: PLAY_MARKET_URL });
          if (link) {
            setStoreLink(link);
            setIsSheetOpen(true);
          }
        }
      } catch (error) {
        console.error('[useVersionCheck] Failed:', error);
      } finally {
        clearTimeout(timeoutId);
        setIsVersionChecked(true);
      }
    };

    check();
    return () => clearTimeout(timeoutId);
  }, [setIsVersionChecked, setIsNewVersionAvailable]);

  return {
    isSheetOpen,
    storeLink,
    dismiss: () => setIsSheetOpen(false),
    confirm: () => storeLink && Linking.openURL(storeLink),
  };
}
