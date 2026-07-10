import { router } from "expo-router";
import { create } from "zustand";

/**
 * Which locked surface opened the paywall — carried into the
 * paywall_opened / purchase_* PostHog events for funnel attribution.
 */
export type PaywallSurface =
  | "insight_teaser"
  | "week_intensity"
  | "settings_row"
  | "profile_row"
  | "premium_theme"
  | "premium_avatar"
  | "timeline_extended"
  | "mirror_tone"
  | "daily_quote"
  | "bridge_draft";

type PaywallState = {
  open: (surface: PaywallSurface) => void;
};

/**
 * Opens the paywall route. Analytics (paywall_opened / paywall_dismissed)
 * are captured inside the paywall screen, which has PostHog + session
 * context in scope. Uses the imperative `router` singleton since this is a
 * Zustand action, not a component.
 */
export const usePaywall = create<PaywallState>(() => ({
  open: (surface) => router.push({ pathname: "/(paywall)", params: { surface } }),
}));
