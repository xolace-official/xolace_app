/**
 * Single source of truth for all available themes.
 * Used by the Appearance screen, preview cards, and SessionModeProvider.
 */

export type ThemeTier = 'free' | 'premium';

export type ThemeEntry = {
  id: string;
  name: string;
  tier: ThemeTier;
  variants: { light: string; dark: string };
  /** Hex color values for inline-style preview cards (no CSS variable resolution needed). */
  preview: { bg: string; fg: string; accent: string; surface: string; border: string };
  /** Hidden from the picker (e.g. nightly — controlled by SessionModeProvider). */
  hiddenFromPicker?: boolean;
  /** false for premium stubs that have no CSS file yet. */
  available?: boolean;
};

export const THEMES: ThemeEntry[] = [
  {
    id: 'default',
    name: 'Default',
    tier: 'free',
    variants: { light: 'light', dark: 'dark' },
    preview: {
      bg: '#19151f',
      fg: '#ede9f5',
      accent: '#b3a0e0',
      surface: '#201c2e',
      border: '#2c273c',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    tier: 'free',
    variants: { light: 'lavender-light', dark: 'lavender-dark' },
    preview: {
      bg: '#1a1422',
      fg: '#f5f2ff',
      accent: '#cc8af5',
      surface: '#271e34',
      border: '#332840',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    tier: 'free',
    variants: { light: 'mint-light', dark: 'mint-dark' },
    preview: {
      bg: '#0e1a11',
      fg: '#e8f5ec',
      accent: '#5de8a0',
      surface: '#142018',
      border: '#1c3022',
    },
  },
  {
    id: 'sky',
    name: 'Sky',
    tier: 'free',
    variants: { light: 'sky-light', dark: 'sky-dark' },
    preview: {
      bg: '#0d1420',
      fg: '#e5f0fa',
      accent: '#40c4f5',
      surface: '#131e2e',
      border: '#1a2c3e',
    },
  },
  {
    id: 'nightly',
    name: 'Nightly',
    tier: 'free',
    hiddenFromPicker: true,
    variants: { light: 'nightly-light', dark: 'nightly-dark' },
    preview: {
      bg: '#090810',
      fg: '#dddaec',
      accent: '#8b7db8',
      surface: '#100e1a',
      border: '#1a1826',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    tier: 'premium',
    available: false,
    variants: { light: 'ember-light', dark: 'ember-dark' },
    preview: {
      bg: '#100804',
      fg: '#f7e8d8',
      accent: '#e8834a',
      surface: '#1b0e07',
      border: '#2a1810',
    },
  },
  {
    id: 'moss',
    name: 'Moss',
    tier: 'premium',
    available: false,
    variants: { light: 'moss-light', dark: 'moss-dark' },
    preview: {
      bg: '#070e08',
      fg: '#e5f2e8',
      accent: '#5db87a',
      surface: '#0c1a0d',
      border: '#142814',
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    tier: 'premium',
    available: false,
    variants: { light: 'ink-light', dark: 'ink-dark' },
    preview: {
      bg: '#08070c',
      fg: '#ebebf0',
      accent: '#8890a8',
      surface: '#0e0d14',
      border: '#181820',
    },
  },
];

export const FREE_THEMES = THEMES.filter(
  (t) => t.tier === 'free' && !t.hiddenFromPicker
);
export const PREMIUM_THEMES = THEMES.filter((t) => t.tier === 'premium');
export const THEME_BY_ID: Record<string, ThemeEntry> = Object.fromEntries(
  THEMES.map((t) => [t.id, t])
);
