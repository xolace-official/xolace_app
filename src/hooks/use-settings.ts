import { useCallback, useMemo } from "react";
import { useClerk, useUser } from "@clerk/expo";
import { Uniwind, useUniwind } from "uniwind";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { RetentionOption } from "@/src/components/settings/retention-picker-dialog";
import type { MirrorTone } from "@/src/components/settings/mirror-tone-picker-dialog";
import { useAppStore } from "@/src/store/store";
import { useAppTheme } from "@/src/context/app-theme-context";

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
  const { theme: storedTheme, setTheme: storeSetTheme } = useAppStore();
  const { currentTheme, isLight } = useAppTheme();
  const { hasAdaptiveThemes } = useUniwind();

  // ─── Convex (single source of truth for preferences) ──────────────
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = useMutation(
    api.preferences.update,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.preferences.get, {});
    if (current !== undefined) {
      localStore.setQuery(api.preferences.get, {}, { ...current, ...args });
    }
  });
  const requestDataWipe = useMutation(api.users.requestDataWipe);
  const requestDeletion = useMutation(api.users.requestDeletion);

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
  const themeDisplay = useMemo(() => {
    if (hasAdaptiveThemes) return "System";
    return isLight ? "Light" : "Dark";
  }, [hasAdaptiveThemes, isLight]);

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
  const gentleReminders = preferences?.notifications?.gentleReturn ?? false;
  const contributeAnonymously =
    preferences?.contributeByDefault ?? false;

  const setReducedMotion = useCallback(
    (v: boolean) => {
      updatePreferences({ reducedMotion: v });
    },
    [updatePreferences],
  );

  const setGentleReminders = useCallback(
    (v: boolean) => {
      const prev = preferences?.notifications;
      updatePreferences({
        notifications: {
          enabled: prev?.enabled ?? false,
          gentleReturn: v,
          patternNudge: prev?.patternNudge ?? false,
          milestone: prev?.milestone ?? false,
        },
      });
    },
    [updatePreferences, preferences],
  );

  const setContributeAnonymously = useCallback(
    (v: boolean) => {
      updatePreferences({ contributeByDefault: v });
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
      updatePreferences({ mirrorTone: tone });
    },
    [updatePreferences],
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
    try {
      await signOut();
    } catch {
      // Clerk will update its own auth state; ignore network errors
    }
  }, [signOut]);

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

    // Toggles
    reducedMotion,
    setReducedMotion,
    gentleReminders,
    setGentleReminders,
    contributeAnonymously,
    setContributeAnonymously,

    // Mirror tone
    mirrorTone,
    mirrorToneDisplay,
    setMirrorTone,

    // Data retention
    retention,
    retentionDisplay,
    setRetention,

    // Destructive actions
    performLogout,
    performDeleteData,
    performDeleteAccount,
  };
};
