import { useCallback, useMemo } from "react";
import { useClerk, useUser } from "@clerk/expo";
import { Uniwind, useUniwind } from "uniwind";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAppStore } from "@/store/store";
import { useAppTheme } from "@/context/app-theme-context";

export type ThemeMode = "system" | "light" | "dark";

export const SETTING_KEYS = {
  REDUCED_MOTION: "reduced_motion",
  GENTLE_REMINDERS: "gentle_reminders",
  CONTRIBUTE_ANONYMOUSLY: "contribute_anonymously",
} as const;

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
  const { toggles, setToggle, theme: storedTheme, setTheme: storeSetTheme } =
    useAppStore();
  const { currentTheme, isLight } = useAppTheme();
  const { hasAdaptiveThemes } = useUniwind();

  // ─── Convex mutations (fire-and-forget) ─────────────────────────────
  const updatePreferences = useMutation(api.preferences.update);
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

  // ─── Toggles ───────────────────────────────────────────────────────
  const reducedMotion = toggles[SETTING_KEYS.REDUCED_MOTION] ?? false;
  const gentleReminders = toggles[SETTING_KEYS.GENTLE_REMINDERS] ?? false;
  const contributeAnonymously =
    toggles[SETTING_KEYS.CONTRIBUTE_ANONYMOUSLY] ?? true;

  const setReducedMotion = useCallback(
    (v: boolean) => {
      setToggle(SETTING_KEYS.REDUCED_MOTION, v);
      updatePreferences({ reducedMotion: v });
    },
    [setToggle, updatePreferences],
  );

  const setGentleReminders = useCallback(
    (v: boolean) => {
      setToggle(SETTING_KEYS.GENTLE_REMINDERS, v);
      updatePreferences({
        notifications: {
          enabled: v,
          gentleReturn: v,
          patternNudge: false,
          milestone: false,
        },
      });
    },
    [setToggle, updatePreferences],
  );

  const setContributeAnonymously = useCallback(
    (v: boolean) => {
      setToggle(SETTING_KEYS.CONTRIBUTE_ANONYMOUSLY, v);
      updatePreferences({ autoContributeReflections: v });
    },
    [setToggle, updatePreferences],
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

    // Destructive actions
    performLogout,
    performDeleteData,
    performDeleteAccount,
  };
};
