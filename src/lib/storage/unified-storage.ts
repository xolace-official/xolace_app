/**
 * Unified storage adapter for Zustand's createJSONStorage.
 * Uses localStorage on web and expo-sqlite/kv-store on native.
 *
 * This is used by the Zustand store for persistence. If you need to swap
 * the native storage backend (e.g. to MMKV for performance), replace the
 * AsyncStorage calls below.
 */
import { Platform } from 'react-native';
import AsyncStorage from 'expo-sqlite/kv-store';

const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';

export const zustandJSONStorage = {
  getItem: async (name: string) => {
    if (isWeb) {
      const raw = window.localStorage.getItem(name);
      return raw;
    } else {
      return AsyncStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string) => {
    if (isWeb) {
      window.localStorage.setItem(name, value);
    } else {
      await AsyncStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string) => {
    if (isWeb) {
      window.localStorage.removeItem(name);
    } else {
      await AsyncStorage.removeItem(name);
    }
  },
};