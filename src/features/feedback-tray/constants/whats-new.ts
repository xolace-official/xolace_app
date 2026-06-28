import type { ComponentProps } from "react";
import type { SymbolView } from "expo-symbols";

type CrossPlatformSymbol = ComponentProps<typeof SymbolView>["name"];

export type WhatsNewHighlight = {
  icon: CrossPlatformSymbol;
  title: string;
  body: string;
};

export type WhatsNewEntry = {
  /**
   * Stable unique key used for seen-tracking. NOT the same as the version number
   * — OTA updates keep the store version, so each entry needs its own id
   * ([[feedback_ota_versioning]]).
   */
  id: string;
  /** Display label, e.g. "Version 1.6.0" or "OTA Update". */
  label: string;
  /** Human date string for display. */
  date: string;
  highlights: WhatsNewHighlight[];
};

/**
 * User-facing release notes, newest first. Kept warm and plain-language — this
 * is what the user sees, not the engineering CHANGELOG.md. Local for now;
 * a Convex-driven changelog is a P3 TODO.
 */
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "1.6.1",
    label: "OTA Update",
    date: "June 2026",
    highlights: [
      {
        icon: { ios: "hand.wave.fill", android: "waving_hand" },
        title: "Gentle check-ins",
        body: "When a moment feels unfinished, we'll quietly check back a day or so later to see how it's sitting. No pressure; just a soft door if you want it.",
      },
    ],
  },
  {
    id: "1.6.0",
    label: "Version 1.6.0",
    date: "June 2026",
    highlights: [
      {
        icon: { ios: "person.crop.circle.fill", android: "account_circle" },
        title: "Your profile",
        body: "A personal look at your moments, streak, and the emotions that show up most for you.",
      },
      {
        icon: { ios: "bubble.left.and.bubble.right.fill", android: "forum" },
        title: "Shake to talk to us",
        body: "Shake your phone anywhere in the app to report a bug or suggest an idea.",
      },
    ],
  },
  {
    id: "1.5.0",
    label: "Version 1.5.0",
    date: "June 2026",
    highlights: [
      {
        icon: { ios: "flame.fill", android: "local_fire_department" },
        title: "Voice Vent",
        body: "Speak something heavy aloud and watch it burn away. Your voice is never stored.",
      },
      {
        icon: { ios: "heart.fill", android: "favorite" },
        title: "Awareness moments",
        body: "Gentle, monthly acknowledgements of what you might be carrying.",
      },
    ],
  },
  {
    id: "1.4.0",
    label: "Version 1.4.0",
    date: "June 2026",
    highlights: [
      {
        icon: { ios: "paperplane.fill", android: "send" },
        title: "Trusted Bridge",
        body: "Turn what you felt into a message you can actually send to someone who matters.",
      },
    ],
  },
  {
    id: "1.3.0",
    label: "Version 1.3.0",
    date: "May 2026",
    highlights: [
      {
        icon: { ios: "quote.bubble.fill", android: "format_quote" },
        title: "Daily quotes",
        body: "A personalized line each day, distilled from your sessions. Never your raw words.",
      },
      {
        icon: { ios: "square.and.arrow.up", android: "share" },
        title: "Share a quote",
        body: "Send a quote out as a polished, theme-aware card.",
      },
    ],
  },
];

/** Id of the newest entry — what `lastSeenVersion` is compared against. */
export const LATEST_WHATS_NEW_ID: string | null = WHATS_NEW[0]?.id ?? null;

/** True when there's a newest entry the user hasn't opened yet. */
export const hasUnseenWhatsNew = (lastSeenVersion: string | null): boolean =>
  LATEST_WHATS_NEW_ID !== null && lastSeenVersion !== LATEST_WHATS_NEW_ID;
