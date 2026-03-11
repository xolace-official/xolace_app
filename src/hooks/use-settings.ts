import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Uniwind, useUniwind } from "uniwind";
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
 * — toggle preferences (Zustand persisted)
 * — theme mode display + switching (Uniwind + Zustand)
 * — sign-in method (Clerk external accounts)
 * — log-out with confirmation
 */
export const useSettings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { toggles, setToggle, theme: storedTheme, setTheme: storeSetTheme } =
    useAppStore();
  const { currentTheme, isLight } = useAppTheme();
  const { hasAdaptiveThemes } = useUniwind();

  // ─── Sign-in method ──────────────────────────────────────────────────────
  const signInMethod = useMemo(() => {
    if (!user) return "—";
    const ext = user.externalAccounts?.[0];
    if (!ext) return "Email";
    const provider = (ext.provider ?? "").toLowerCase();
    if (provider.includes("apple")) return "Apple";
    if (provider.includes("google")) return "Google";
    return "Email";
  }, [user]);

  // ─── Theme display ────────────────────────────────────────────────────────
  const themeDisplay = useMemo(() => {
    if (hasAdaptiveThemes) return "System";
    return isLight ? "Light" : "Dark";
  }, [hasAdaptiveThemes, isLight]);

  // ─── Theme switching ──────────────────────────────────────────────────────
  /**
   * Switch between System / Light / Dark while preserving any active
   * colour-theme (lavender, mint, sky, …).
   */
  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      if (mode === "system") {
        Uniwind.setTheme("system" as never);
        storeSetTheme("system");
        return;
      }

      // Derive the colour-theme base from the current Uniwind theme string.
      // e.g. "lavender-dark" → "lavender", "light" / "dark" → use bare name
      const stripped = currentTheme
        .replace(/-light$/, "")
        .replace(/-dark$/, "");
      const isBaseOnly = stripped === "light" || stripped === "dark";

      const nextTheme = isBaseOnly
        ? mode
        : (`${stripped}-${mode}` as never);

      Uniwind.setTheme(nextTheme);
      storeSetTheme(mode);
    },
    [currentTheme, storeSetTheme],
  );

  // ─── Toggles ─────────────────────────────────────────────────────────────
  const reducedMotion = toggles[SETTING_KEYS.REDUCED_MOTION] ?? false;
  const gentleReminders = toggles[SETTING_KEYS.GENTLE_REMINDERS] ?? false;
  const contributeAnonymously =
    toggles[SETTING_KEYS.CONTRIBUTE_ANONYMOUSLY] ?? true;

  const setReducedMotion = useCallback(
    (v: boolean) => setToggle(SETTING_KEYS.REDUCED_MOTION, v),
    [setToggle],
  );
  const setGentleReminders = useCallback(
    (v: boolean) => setToggle(SETTING_KEYS.GENTLE_REMINDERS, v),
    [setToggle],
  );
  const setContributeAnonymously = useCallback(
    (v: boolean) => setToggle(SETTING_KEYS.CONTRIBUTE_ANONYMOUSLY, v),
    [setToggle],
  );

  // ─── Log out ─────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch {
              // Clerk will update its own auth state; ignore network errors
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [signOut]);

  // ─── Delete data ─────────────────────────────────────────────────────────
  const handleDeleteData = useCallback(() => {
    Alert.alert(
      "Delete all my data",
      "This will permanently erase all your sessions, reflections, and emotional history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: () => {
            // TODO: call Convex mutation to delete user data
            console.warn("delete-data: not yet implemented");
          },
        },
      ],
      { cancelable: true },
    );
  }, []);

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

    // Actions
    handleLogout,
    handleDeleteData,
  };
};
