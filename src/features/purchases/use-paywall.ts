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
  | "mirror_voice"
  | "daily_quote"
  | "bridge_draft"
  // The three proactive moments (#220 §5). Distinct from the reactive surfaces
  // above so the funnel can tell an offer the app made from a door the user
  // opened; the `moment` id rides on the card's own events.
  | "session_close"
  | "mirror_landed"
  | "profile_insight"
  // Post-signup intake, session 0 (#266). Its own offer screen fires
  // paywall_opened; the plans step under `(intake)/plans` reuses this surface.
  | "intake";

type PaywallState = {
  open: (surface: PaywallSurface) => void;
  close: () => void;
};

/**
 * Opens/closes the paywall route. Analytics (paywall_opened / paywall_dismissed)
 * are captured inside the paywall screen, which has PostHog + session
 * context in scope. Uses the imperative `router` singleton since this is a
 * Zustand action, not a component.
 *
 * `close` cannot assume a back stack: the route is reachable by deep link
 * (`xolace:///(paywall)`), and on a cold start from one the paywall is the root
 * entry — a bare `router.back()` no-ops there and strands the user in a
 * full-screen modal with no way out. Fall back to the reflect screen.
 *
 * The fallback must name `/(protected)` explicitly. `(onboarding)/index`,
 * `(paywall)/index` and `(protected)/index` all resolve to `/`, so a bare
 * `replace("/")` resolves within the *current* group and lands back on the
 * paywall.
 */
export const usePaywall = create<PaywallState>(() => ({
  open: (surface) => router.push({ pathname: "/(paywall)", params: { surface } }),
  close: () => (router.canGoBack() ? router.back() : router.replace("/(protected)")),
}));
