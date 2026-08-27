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
import {
  PLUS_OFFER_DISMISSAL_LIMIT,
  PLUS_OFFER_FULL_STOP_MS,
  type PlusOfferSurface,
} from '@/src/features/purchases/plus-offer-policy';

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
  /**
   * True while any home sheet (founder welcome, return welcome, follow-up,
   * monthly event) is open or armed to open. Transient — never persisted.
   * The reflect tour reads this so its coach marks don't render underneath a
   * sheet that is about to cover them.
   */
  homeSheetBlocking: boolean;
  setHomeSheetBlocking: (v: boolean) => void;
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
  /** One-time flag — once true, the "shake to send feedback" hint toast never shows again. */
  shakeHintSeen: boolean;
  setShakeHintSeen: (v: boolean) => void;
  /** `lastSessionAt` value the Return Welcome greeting was last shown against. Keys "once per return episode". */
  returnWelcomeSeenAt: number | null;
  setReturnWelcomeSeenAt: (n: number) => void;
  /** Id of the newest What's New entry the user has opened. Drives the menu's unseen badge. */
  lastSeenVersion: string | null;
  setLastSeenVersion: (v: string) => void;
  /** Menu item keys whose "new" glow has been acknowledged (item opened once). */
  seenMenuItems: string[];
  markMenuItemSeen: (key: string) => void;
  /** Highest streak day the user has seen the calendar reveal for. */
  lastAcknowledgedStreak: number;
  setLastAcknowledgedStreak: (n: number) => void;
  /** Awareness event slugs the user has already seen, with timestamps for pruning. */
  seenEventIds: { slug: string; seenAt: number }[];
  addToSeenEventIds: (slug: string) => void;
  /** Drops entries older than 13 months. Called on hook mount, not during render. */
  pruneSeenEventIds: () => void;
  /** Session prompt set when a monthly event with sessionPrompt is dismissed. Expires after 7 days. */
  pendingEventPrompt: { text: string; label?: string; expiresAt: number } | null;
  setPendingEventPrompt: (
    prompt: { text: string; label?: string; expiresAt: number } | null,
  ) => void;
  /**
   * Proactive Plus offer cadence state — inputs to `choosePlusOffer`. Device-local
   * like every other frequency cap in this app (resets on reinstall; accepted).
   * Last-dismissed epoch ms keyed by surface: a "no" silences the whole slot,
   * not just the moment that happened to be ranked first in it.
   */
  plusOfferLastDismissedAt: Partial<Record<PlusOfferSurface, number>>;
  /** Lifetime dismissals across all proactive surfaces. */
  plusOfferDismissalCount: number;
  /** When the 3-strike, 30-day full stop began. */
  plusOfferFullStopAt: number | null;
  /** Records a dismissal against one surface and rolls the full stop if it's the third. */
  recordPlusOfferDismissal: (surface: PlusOfferSurface) => void;
  /**
   * The session an offer was last shown in. The whole of "max one offer per
   * session" and "never two sessions in a row" rides on this one id: all three
   * trigger points write it and all three read it, so a moment that already
   * fired mid-session cannot also take the close-of-session slot.
   */
  plusOfferShownSessionId: string | null;
  recordPlusOfferShown: (sessionId: string | null) => void;
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
        homeSheetBlocking: false,
        setHomeSheetBlocking: (v) => set({ homeSheetBlocking: v }),

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
        shakeHintSeen: false,
        setShakeHintSeen: (v) => set({ shakeHintSeen: v }),
        returnWelcomeSeenAt: null,
        setReturnWelcomeSeenAt: (n) => set({ returnWelcomeSeenAt: n }),
        lastSeenVersion: null,
        setLastSeenVersion: (v) => set({ lastSeenVersion: v }),

        seenMenuItems: [],
        markMenuItemSeen: (key) =>
          set((s) =>
            s.seenMenuItems.includes(key)
              ? {}
              : { seenMenuItems: [...s.seenMenuItems, key] },
          ),

        lastAcknowledgedStreak: 0,
        setLastAcknowledgedStreak: (n) => set({ lastAcknowledgedStreak: n }),

        seenEventIds: [],
        addToSeenEventIds: (slug) =>
          set((s) =>
            s.seenEventIds.some((e) => e.slug === slug)
              ? {}
              : { seenEventIds: [...s.seenEventIds, { slug, seenAt: Date.now() }] },
          ),
        pruneSeenEventIds: () =>
          set((s) => {
            const threshold = new Date();
            threshold.setMonth(threshold.getMonth() - 13);
            return {
              seenEventIds: s.seenEventIds.filter(
                (e) => e.seenAt >= threshold.getTime(),
              ),
            };
          }),

        pendingEventPrompt: null,
        setPendingEventPrompt: (prompt) => set({ pendingEventPrompt: prompt }),

        plusOfferLastDismissedAt: {},
        plusOfferShownSessionId: null,
        recordPlusOfferShown: (sessionId) =>
          set({ plusOfferShownSessionId: sessionId }),
        plusOfferDismissalCount: 0,
        plusOfferFullStopAt: null,
        recordPlusOfferDismissal: (surface) =>
          set((s) => {
            const now = Date.now();
            // A full stop that has run its course clears the slate — otherwise
            // the very next dismissal would re-trigger it off a stale count.
            const lapsed =
              s.plusOfferFullStopAt !== null &&
              now - s.plusOfferFullStopAt >= PLUS_OFFER_FULL_STOP_MS;
            const count = (lapsed ? 0 : s.plusOfferDismissalCount) + 1;
            return {
              plusOfferLastDismissedAt: {
                ...s.plusOfferLastDismissedAt,
                [surface]: now,
              },
              plusOfferDismissalCount: count,
              plusOfferFullStopAt:
                count >= PLUS_OFFER_DISMISSAL_LIMIT
                  ? now
                  : lapsed
                    ? null
                    : s.plusOfferFullStopAt,
            };
          }),

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
          shakeHintSeen: s.shakeHintSeen,
          returnWelcomeSeenAt: s.returnWelcomeSeenAt,
          lastSeenVersion: s.lastSeenVersion,
          seenMenuItems: s.seenMenuItems,
          lastAcknowledgedStreak: s.lastAcknowledgedStreak,
          textureSetId: s.textureSetId,
          seenEventIds: s.seenEventIds,
          pendingEventPrompt: s.pendingEventPrompt,
          plusOfferLastDismissedAt: s.plusOfferLastDismissedAt,
          plusOfferShownSessionId: s.plusOfferShownSessionId,
          plusOfferDismissalCount: s.plusOfferDismissalCount,
          plusOfferFullStopAt: s.plusOfferFullStopAt,
        }),
      }
    )
  )
);
