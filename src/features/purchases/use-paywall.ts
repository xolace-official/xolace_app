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
  | "mirror_tone";

type PaywallState = {
  isOpen: boolean;
  surface: PaywallSurface | null;
  open: (surface: PaywallSurface) => void;
  close: () => void;
};

/**
 * Global paywall visibility. Analytics (paywall_opened / paywall_dismissed)
 * are captured by PaywallSheet, which observes this store and has PostHog
 * + session context in scope.
 */
export const usePaywall = create<PaywallState>((set) => ({
  isOpen: false,
  surface: null,
  open: (surface) => set({ isOpen: true, surface }),
  close: () => set({ isOpen: false }),
}));
