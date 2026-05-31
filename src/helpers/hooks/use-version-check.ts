import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { getAppInfoFromTheStore, shouldUpdateApp } from '../utils/version-check';
import { APP_STORE_URL, PLAY_MARKET_URL } from '@/src/lib/constants/links';
import { useAppStore } from '@/src/store/store';

export function useVersionCheck() {
  const setIsVersionChecked = useAppStore((s) => s.setIsVersionChecked);
  const setIsNewVersionAvailable = useAppStore((s) => s.setIsNewVersionAvailable);

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

          const storeLink = Platform.select({ ios: APP_STORE_URL, android: PLAY_MARKET_URL });

          if (storeLink) {
            Alert.alert(
              'Update Available',
              'Please update the app to get the latest features and improvements.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Update Now',
                  isPreferred: true,
                  onPress: () => Linking.openURL(storeLink),
                },
              ],
              { cancelable: true }
            );
          }
        }
      } catch (error) {
        console.error('[useVersionCheck] Failed:', error);
      } finally {
        setIsVersionChecked(true);
      }
    };

    check();
    return () => clearTimeout(timeoutId);
  }, [setIsVersionChecked, setIsNewVersionAvailable]);
}
