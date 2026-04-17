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
    id: 'quiet',
    name: 'Quiet Space',
    tier: 'free',
    variants: { light: 'quiet-light', dark: 'quiet-dark' },
    preview: {
      bg: '#0d1920',
      fg: '#f7fbfb',
      accent: '#6bbfc5',
      surface: '#141f28',
      border: '#1c2d36',
    },
  },
  {
    id: 'reverie',
    name: 'Reverie',
    tier: 'free',
    variants: { light: 'reverie-light', dark: 'reverie-dark' },
    preview: {
      bg: '#0f0b16',
      fg: '#f8f5ff',
      accent: '#bf7de0',
      surface: '#181022',
      border: '#211530',
    },
  },
  {
    id: 'human',
    name: 'Human Connection',
    tier: 'free',
    variants: { light: 'human-light', dark: 'human-dark' },
    preview: {
      bg: '#1a1008',
      fg: '#fbf8f5',
      accent: '#e87255',
      surface: '#221508',
      border: '#2e1c0a',
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
