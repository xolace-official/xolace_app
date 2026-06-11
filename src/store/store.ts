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
import type { TextureSetId } from '@/src/features/reflect/texture-sets';

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
  founderWelcomeSeen: boolean;
  setFounderWelcomeSeen: (v: boolean) => void;
};

type TogglesSlice = {
  /** When true, SessionModeProvider auto-activates 3am Mode between 10pm–4am. */
  nightModeEnabled: boolean;
  setNightModeEnabled: (v: boolean) => void;
  /** One-time flag — once true, tone tip banner never shows again on this device. */
  toneTipSeen: boolean;
  setToneTipSeen: (v: boolean) => void;
  /** One-time flag — once dismissed, session-end notification nudge never shows again. */
  notifNudgeDismissed: boolean;
  setNotifNudgeDismissed: (v: boolean) => void;
  /** One-time flag — once true, reflect screen tour never shows again on this device. */
  reflectTourSeen: boolean;
  setReflectTourSeen: (v: boolean) => void;
  /** Feature flag — when false, bridge card is hidden and route is inaccessible. */
  bridgeEnabled: boolean;
  setBridgeEnabled: (v: boolean) => void;
  /** One-time flag — once true, bridge first-run intro modal never shows again. */
  bridgeIntroSeen: boolean;
  setBridgeIntroSeen: (v: boolean) => void;
  /** One-time flag — once true, vent first-run intro never shows again. */
  ventIntroSeen: boolean;
  setVentIntroSeen: (v: boolean) => void;
  /** Menu item keys whose "new" glow has been acknowledged (item opened once). */
  seenMenuItems: string[];
  markMenuItemSeen: (key: string) => void;
};

type PreferencesSlice = {
  textureSetId: TextureSetId;
  setTextureSetId: (id: TextureSetId) => void;
};

/** Ephemeral, not persisted. Tracks store version check state. */
type UpdateCheckSlice = {
  isVersionChecked: boolean;
  setIsVersionChecked: (v: boolean) => void;
  isNewVersionAvailable: boolean;
  setIsNewVersionAvailable: (v: boolean) => void;
};

/** Ephemeral, not persisted. Set when user taps a notification to open the app. */
type LastNotificationSlice = {
  lastNotification: { content: string; notificationId: Id<"notification_log"> } | null;
  setLastNotification: (n: { content: string; notificationId: Id<"notification_log"> } | null) => void;
  clearLastNotification: () => void;
};

export type AppState = ThemeSlice & OnboardingSlice & TogglesSlice & PreferencesSlice & UpdateCheckSlice & LastNotificationSlice;

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

        founderWelcomeSeen: false,
        setFounderWelcomeSeen: (v) => set({ founderWelcomeSeen: v }),

        nightModeEnabled: true,
        setNightModeEnabled: (v) => set({ nightModeEnabled: v }),

        toneTipSeen: false,
        setToneTipSeen: (v) => set({ toneTipSeen: v }),

        notifNudgeDismissed: false,
        setNotifNudgeDismissed: (v) => set({ notifNudgeDismissed: v }),

        reflectTourSeen: false,
        setReflectTourSeen: (v) => set({ reflectTourSeen: v }),

        bridgeEnabled: true,
        setBridgeEnabled: (v) => set({ bridgeEnabled: v }),
        bridgeIntroSeen: false,
        setBridgeIntroSeen: (v) => set({ bridgeIntroSeen: v }),
        ventIntroSeen: false,
        setVentIntroSeen: (v) => set({ ventIntroSeen: v }),

        seenMenuItems: [],
        markMenuItemSeen: (key) =>
          set((s) =>
            s.seenMenuItems.includes(key)
              ? {}
              : { seenMenuItems: [...s.seenMenuItems, key] },
          ),

        textureSetId: 'flat',
        setTextureSetId: (id) => set({ textureSetId: id }),

        isVersionChecked: false,
        setIsVersionChecked: (v) => set({ isVersionChecked: v }),
        isNewVersionAvailable: false,
        setIsNewVersionAvailable: (v) => set({ isNewVersionAvailable: v }),

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
          founderWelcomeSeen: s.founderWelcomeSeen,
          nightModeEnabled: s.nightModeEnabled,
          toneTipSeen: s.toneTipSeen,
          notifNudgeDismissed: s.notifNudgeDismissed,
          reflectTourSeen: s.reflectTourSeen,
          bridgeEnabled: s.bridgeEnabled,
          bridgeIntroSeen: s.bridgeIntroSeen,
          ventIntroSeen: s.ventIntroSeen,
          seenMenuItems: s.seenMenuItems,
          textureSetId: s.textureSetId,
        }),
      }
    )
  )
);
