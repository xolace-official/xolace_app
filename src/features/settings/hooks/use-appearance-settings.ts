import { useQuery } from "convex/react";
import { Uniwind } from "uniwind";
import { api } from "@/convex/_generated/api";
import { useAppStore } from "@/src/store/store";
import { useAppTheme } from "@/src/context/app-theme-context";
import { usePreferenceMutation } from "./use-preference-mutation";

export type ThemeMode = "system" | "light" | "dark";

export const useAppearanceSettings = () => {
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = usePreferenceMutation();
  const { theme: storedTheme, setTheme: storeSetTheme, colorThemeId, setColorThemeId } = useAppStore();
  const { currentTheme, isLight } = useAppTheme();
  const nightModeEnabled = useAppStore((s) => s.nightModeEnabled);
  const setNightModeEnabled = useAppStore((s) => s.setNightModeEnabled);

  const reducedMotion = preferences?.reducedMotion ?? false;
  const themeDisplay =
    storedTheme === "system" ? "System" : storedTheme === "light" ? "Light" : "Dark";

  const setThemeMode = (mode: ThemeMode) => {
    if (mode === "system") {
      Uniwind.setTheme("system" as never);
      storeSetTheme("system");
      updatePreferences({ theme: "system" });
      return;
    }
    const stripped = currentTheme.replace(/-light$/, "").replace(/-dark$/, "");
    const isBaseOnly = stripped === "light" || stripped === "dark";
    const nextTheme = isBaseOnly ? mode : (`${stripped}-${mode}` as never);
    Uniwind.setTheme(nextTheme);
    storeSetTheme(mode);
    updatePreferences({ theme: mode });
  };

  const setReducedMotion = (v: boolean) => {
    updatePreferences({ reducedMotion: v });
  };

  const setColorTheme = (themeId: string) => {
    const mode = storedTheme === "system" ? (isLight ? "light" : "dark") : storedTheme;
    const nextVariant = themeId === "default" ? mode : (`${themeId}-${mode}` as never);
    Uniwind.setTheme(nextVariant);
    setColorThemeId(themeId);
    updatePreferences({ colorTheme: themeId });
  };

  return {
    themeDisplay,
    storedTheme,
    setThemeMode,
    colorThemeId,
    setColorTheme,
    reducedMotion,
    setReducedMotion,
    nightModeEnabled,
    setNightModeEnabled,
  };
};
