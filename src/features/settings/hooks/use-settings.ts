import { useCallback, useMemo } from "react";
import { useClerk, useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { Uniwind } from "uniwind";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { RetentionOption } from "@/src/features/settings/components/retention-picker-dialog";
import type { MirrorTone } from "@/src/features/settings/components/mirror-tone-picker-dialog";
import { useAppStore } from "@/src/store/store";
import { useAppTheme } from "@/src/context/app-theme-context";
import { requestPushToken } from "@/src/lib/use-notifications";

export type ThemeMode = "system" | "light" | "dark";

/**
 * Encapsulates all settings screen state and handlers:
 * — toggle preferences (Zustand persisted + fire-and-forget Convex sync)
 * — theme mode display + switching (Uniwind + Zustand + Convex)
 * — sign-in method (Clerk external accounts)
 * — destructive action handlers (logout, data wipe, account deletion)
 */
export const useSettings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const {
    theme: storedTheme,
    setTheme: storeSetTheme,
    colorThemeId,
    setColorThemeId,
  } = useAppStore();
  const { currentTheme, isLight } = useAppTheme();

  // ─── Convex (single source of truth for preferences) ──────────────
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = useMutation(
    api.preferences.update,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.preferences.get, {});
    if (current !== undefined) {
      // Merge notifications once so multiple sub-field args combine instead
      // of clobbering each other. Matches backend order: args.notifications
      // is applied first, then sub-field merges win on top.
      const hasNotificationsChange =
        args.notifications !== undefined ||
        args.notificationReach !== undefined ||
        args.notificationQuietWindow !== undefined ||
        args.notificationTimezone !== undefined;

      const mergedNotifications = hasNotificationsChange
        ? {
            ...(args.notifications ?? current.notifications),
            ...(args.notificationReach !== undefined && { reach: args.notificationReach }),
            ...(args.notificationQuietWindow !== undefined && {
              quietWindow: args.notificationQuietWindow ?? undefined,
            }),
            ...(args.notificationTimezone !== undefined && { timezone: args.notificationTimezone }),
          }
        : undefined;

      localStore.setQuery(api.preferences.get, {}, {
        ...current,
        ...(args.theme !== undefined && { theme: args.theme }),
        ...(args.reducedMotion !== undefined && { reducedMotion: args.reducedMotion }),
        ...(args.mirrorTone !== undefined && { mirrorTone: args.mirrorTone }),
        ...(args.contributeByDefault !== undefined && { contributeByDefault: args.contributeByDefault }),
        ...(args.dataRetentionPreference !== undefined && { dataRetentionPreference: args.dataRetentionPreference }),
        ...(args.preferredInputType !== undefined && { preferredInputType: args.preferredInputType }),
        ...(args.colorTheme !== undefined && { colorTheme: args.colorTheme }),
        ...(args.spaceName !== undefined && { spaceName: args.spaceName ?? undefined }),
        ...(args.spaceNamePromptDismissed !== undefined && { spaceNamePromptDismissed: args.spaceNamePromptDismissed }),
        ...(mergedNotifications !== undefined && { notifications: mergedNotifications }),
      });
    }
  });
  const requestDataWipe = useMutation(api.users.requestDataWipe);
  const requestDeletion = useMutation(api.users.requestDeletion);
  const registerToken = useMutation(api.notifications.registerToken);
  const removeToken = useMutation(api.notifications.removeToken);

  // ─── Reach & Quiet Window ────────────────────────────────────────────
  const reach = (preferences?.notifications?.reach ?? "warm") as "warm" | "direct" | "quiet";

  const quietWindow = preferences?.notifications?.quietWindow ?? null;

  const setReach = useCallback(
    (next: "warm" | "direct" | "quiet") => {
      updatePreferences({ notificationReach: next });
    },
    [updatePreferences],
  );

  const setQuietWindow = useCallback(
    (window: { dontReachBefore: number; dontReachAfter: number } | null) => {
      updatePreferences({ notificationQuietWindow: window });
    },
    [updatePreferences],
  );

  const syncTimezone = useCallback(async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) {
        await updatePreferences({ notificationTimezone: timezone });
      }
    } catch {
      // Non-blocking
    }
  }, [updatePreferences]);

  // ─── Sign-in method ──────────────────────────────────────────────────
  const signInMethod = useMemo(() => {
    if (!user) return "—";
    const ext = user.externalAccounts?.[0];
    if (!ext) return "Email";
    const provider = (ext.provider ?? "").toLowerCase();
    if (provider.includes("apple")) return "Apple";
    if (provider.includes("google")) return "Google";
    return "Email";
  }, [user]);

  // ─── Theme display ──────────────────────────────────────────────────
  // Use storedTheme (Zustand) as the source of truth, not Uniwind's runtime
  // hasAdaptiveThemes — that flips to false when setColorTheme applies a
  // concrete variant like 'lavender-dark', even when the user's mode is system.
  const themeDisplay = useMemo(() => {
    if (storedTheme === 'system') return "System";
    return storedTheme === 'light' ? "Light" : "Dark";
  }, [storedTheme]);

  // ─── Theme switching ────────────────────────────────────────────────
  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      if (mode === "system") {
        Uniwind.setTheme("system" as never);
        storeSetTheme("system");
        updatePreferences({ theme: "system" });
        return;
      }

      const stripped = currentTheme
        .replace(/-light$/, "")
        .replace(/-dark$/, "");
      const isBaseOnly = stripped === "light" || stripped === "dark";

      const nextTheme = isBaseOnly
        ? mode
        : (`${stripped}-${mode}` as never);

      Uniwind.setTheme(nextTheme);
      storeSetTheme(mode);
      updatePreferences({ theme: mode });
    },
    [currentTheme, storeSetTheme, updatePreferences],
  );

  // ─── Toggles (derived from Convex preferences) ─────────────────────
  const reducedMotion = preferences?.reducedMotion ?? false;
  const gentleReminders = preferences?.notifications?.enabled ?? false;
  const contributeAnonymously =
    preferences?.contributeByDefault ?? false;

  const setReducedMotion = useCallback(
    (v: boolean) => {
      updatePreferences({ reducedMotion: v });
    },
    [updatePreferences],
  );

  const setGentleReminders = useCallback(
    async (enabled: boolean) => {
      // Master toggle: all notification types follow the single switch.
      // Spread existing preferences to preserve reach/quietWindow/timezone.
      const current = preferences?.notifications;
      updatePreferences({
        notifications: {
          enabled,
          gentleReturn: enabled,
          patternNudge: enabled,
          milestone: enabled,
          reach: current?.reach ?? "warm",
          quietWindow: current?.quietWindow,
          timezone: current?.timezone,
        },
      });

      if (enabled) {
        try {
          // Request OS permission (no-op if already granted) and register token
          const token = await requestPushToken();
          if (!token) {
            // Permission denied or non-device — revert the optimistic update
            updatePreferences({
              notifications: {
                enabled: false,
                gentleReturn: false,
                patternNudge: false,
                milestone: false,
                reach: current?.reach ?? "warm",
                quietWindow: current?.quietWindow,
                timezone: current?.timezone,
              },
            });
            return;
          }
          await registerToken({ pushToken: token });
        } catch {
          // Registration failed — revert so UI reflects the real state
          updatePreferences({
            notifications: {
              enabled: false,
              gentleReturn: false,
              patternNudge: false,
              milestone: false,
              reach: current?.reach ?? "warm",
              quietWindow: current?.quietWindow,
              timezone: current?.timezone,
            },
          });
        }
      } else {
        // Unregister token so no push is delivered while disabled.
        // Best-effort — server preferences are already false so no
        // notifications will be sent even if this call fails.
        try {
          await removeToken();
        } catch {
          // Ignore — server-side notifications are already disabled
        }
      }
    },
    [updatePreferences, registerToken, removeToken, preferences],
  );

  const setContributeAnonymously = useCallback(
    (v: boolean) => {
      updatePreferences({ contributeByDefault: v });
    },
    [updatePreferences],
  );

  // ─── Color theme ────────────────────────────────────────────────────
  const setColorTheme = useCallback(
    (themeId: string) => {
      // Reuse the stripping/reassembly pattern from setThemeMode.
      // Determine the current light/dark suffix from storedTheme.
      const mode =
        storedTheme === 'system'
          ? (isLight ? 'light' : 'dark')
          : storedTheme;
      const nextVariant =
        themeId === 'default' ? mode : (`${themeId}-${mode}` as never);
      Uniwind.setTheme(nextVariant);
      setColorThemeId(themeId);
      updatePreferences({ colorTheme: themeId });
    },
    [storedTheme, isLight, setColorThemeId, updatePreferences],
  );

  // ─── Space name ─────────────────────────────────────────────────────
  const spaceName = preferences?.spaceName;

  const setSpaceName = useCallback(
    async (next: string | null) => {
      await updatePreferences({ spaceName: next });
    },
    [updatePreferences],
  );

  // ─── Mirror tone ───────────────────────────────────────────────────
  const mirrorTone: MirrorTone = preferences?.mirrorTone ?? "adaptive";

  const mirrorToneDisplay = useMemo(() => {
    return mirrorTone.charAt(0).toUpperCase() + mirrorTone.slice(1);
  }, [mirrorTone]);

  const setMirrorTone = useCallback(
    (tone: MirrorTone) => {
      posthog.capture('tone_changed', { tone });
      updatePreferences({ mirrorTone: tone });
    },
    [updatePreferences, posthog],
  );

  // ─── Data retention ──────────────────────────────────────────────────
  const retention: RetentionOption =
    preferences?.dataRetentionPreference ?? "indefinite";

  const retentionDisplay = useMemo(() => {
    if (retention === "indefinite") return "Indefinite";
    if (retention === "6_months") return "6 months";
    return "1 year";
  }, [retention]);

  const setRetention = useCallback(
    (value: RetentionOption) => {
      updatePreferences({ dataRetentionPreference: value });
    },
    [updatePreferences],
  );

  // ─── Destructive actions ────────────────────────────────────────────
  const performLogout = useCallback(async () => {
    posthog.capture('user_signed_out');
    posthog.reset();
    try {
      await signOut();
    } catch {
      // Clerk will update its own auth state; ignore network errors
    }
  }, [signOut, posthog]);

  const performDeleteData = useCallback(async () => {
    await requestDataWipe();
  }, [requestDataWipe]);

  const performDeleteAccount = useCallback(async () => {
    await requestDeletion();
    try {
      await signOut();
    } catch {
      // Best-effort sign out after deletion request
    }
  }, [requestDeletion, signOut]);

  return {
    // Account
    signInMethod,

    // Appearance
    themeDisplay,
    setThemeMode,
    storedTheme,
    colorThemeId,
    setColorTheme,

    // Toggles
    reducedMotion,
    setReducedMotion,
    gentleReminders,
    setGentleReminders,
    contributeAnonymously,
    setContributeAnonymously,

    // Space name
    spaceName,
    setSpaceName,

    // Mirror tone
    mirrorTone,
    mirrorToneDisplay,
    setMirrorTone,

    // Data retention
    retention,
    retentionDisplay,
    setRetention,

    // Notifications — Reach & Quiet Window
    reach,
    setReach,
    quietWindow,
    setQuietWindow,
    syncTimezone,

    // Destructive actions
    performLogout,
    performDeleteData,
    performDeleteAccount,
  };
};
