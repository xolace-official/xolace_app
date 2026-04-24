/**
 * Global app store using Zustand with synchronous persistence.
 *
 * Storage uses expo-sqlite/kv-store (sync reads) so the store is
 * hydrated at creation time — no loading state needed.
 */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { zustandJSONStorage } from '@/src/lib/storage/unified-storage';
import type { Id } from '@/convex/_generated/dataModel';

type ThemeSlice = {
  theme: 'system' | 'light' | 'dark';
  setTheme: (t: 'system' | 'light' | 'dark') => void;
  /** The active color palette ID (e.g. 'default', 'lavender'). */
  colorThemeId: string;
  setColorThemeId: (id: string) => void;
  /** Theme stashed before 3am Mode activates — restored when exiting the night window. */
  previousTheme: string | null;
  setPreviousTheme: (t: string | null) => void;
};

type OnboardingSlice = {
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
};

type TogglesSlice = {
  /** When true, SessionModeProvider auto-activates 3am Mode between 10pm–4am. */
  nightModeEnabled: boolean;
  setNightModeEnabled: (v: boolean) => void;
};

/** Ephemeral, not persisted. Set when user taps a notification to open the app. */
type LastNotificationSlice = {
  lastNotification: { content: string; notificationId: Id<"notification_log"> } | null;
  setLastNotification: (n: { content: string; notificationId: Id<"notification_log"> } | null) => void;
  clearLastNotification: () => void;
};

export type AppState = ThemeSlice & OnboardingSlice & TogglesSlice & LastNotificationSlice;

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        setTheme: (t) => set({ theme: t }),

        colorThemeId: 'default',
        setColorThemeId: (id) => set({ colorThemeId: id }),

        previousTheme: null,
        setPreviousTheme: (t) => set({ previousTheme: t }),

        introSeen: false,
        setIntroSeen: (v) => set({ introSeen: v }),

        nightModeEnabled: true,
        setNightModeEnabled: (v) => set({ nightModeEnabled: v }),

        lastNotification: null,
        setLastNotification: (n) => set({ lastNotification: n }),
        clearLastNotification: () => set({ lastNotification: null }),
      }),
      {
        name: 'xolace-app',
        storage: createJSONStorage(() => zustandJSONStorage),
        partialize: (s) => ({
          theme: s.theme,
          colorThemeId: s.colorThemeId,
          previousTheme: s.previousTheme,
          introSeen: s.introSeen,
          nightModeEnabled: s.nightModeEnabled,
        }),
      }
    )
  )
);
