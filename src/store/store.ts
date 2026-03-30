/**
 * Global app store using Zustand with synchronous persistence.
 *
 * Storage uses expo-sqlite/kv-store (sync reads) so the store is
 * hydrated at creation time — no loading state needed.
 */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { zustandJSONStorage } from '@/src/lib/storage/unified-storage';

type ThemeSlice = {
  theme: 'system' | 'light' | 'dark';
  setTheme: (t: 'system' | 'light' | 'dark') => void;
};

type OnboardingSlice = {
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
};

export type AppState = ThemeSlice & OnboardingSlice;

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        setTheme: (t) => set({ theme: t }),

        introSeen: false,
        setIntroSeen: (v) => set({ introSeen: v }),
      }),
      {
        name: 'xolace-app',
        storage: createJSONStorage(() => zustandJSONStorage),
        partialize: (s) => ({
          theme: s.theme,
          introSeen: s.introSeen,
        }),
      }
    )
  )
);
