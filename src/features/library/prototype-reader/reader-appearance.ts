/**
 * PROTOTYPE — throwaway (#401). The config the reader hands
 * react-native-enriched-markdown: face × size × spacing × surface. In-memory
 * only; persistence is a later decision.
 */
import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_400Regular_Italic,
  AtkinsonHyperlegibleNext_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import { Literata_400Regular, Literata_400Regular_Italic, Literata_700Bold } from '@expo-google-fonts/literata';
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_700Bold } from '@expo-google-fonts/newsreader';
import {
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import { useCSSVariable } from 'uniwind';

type Face = { label: string; note: string; regular: string; italic: string; bold: string };

const sys = Platform.select({ ios: 'Georgia', default: 'serif' });

export const FACES = {
  literata: {
    label: 'Literata',
    note: 'Made for long reading on screens',
    regular: 'Literata_400Regular',
    italic: 'Literata_400Regular_Italic',
    bold: 'Literata_700Bold',
  },
  sourceSerif: {
    label: 'Source Serif',
    note: 'Crisp, a little more modern',
    regular: 'SourceSerif4_400Regular',
    italic: 'SourceSerif4_400Regular_Italic',
    bold: 'SourceSerif4_700Bold',
  },
  newsreader: {
    label: 'Newsreader',
    note: 'Warm, editorial',
    regular: 'Newsreader_400Regular',
    italic: 'Newsreader_400Regular_Italic',
    bold: 'Newsreader_700Bold',
  },
  atkinson: {
    label: 'Atkinson Hyperlegible',
    note: 'Every letter easy to tell apart',
    regular: 'AtkinsonHyperlegibleNext_400Regular',
    italic: 'AtkinsonHyperlegibleNext_400Regular_Italic',
    bold: 'AtkinsonHyperlegibleNext_700Bold',
  },
  // Already in the app — zero new fonts if one of these reads well enough.
  // Neither has an italic loaded, so emphasis falls back to a synthesized slant.
  spaceGrotesk: {
    label: 'Space Grotesk',
    note: 'The app’s own face (already loaded)',
    regular: 'SpaceGrotesk_400Regular',
    italic: 'SpaceGrotesk_400Regular',
    bold: 'SpaceGrotesk_700Bold',
  },
  poppins: {
    label: 'Poppins',
    note: 'Already bundled, no italic',
    regular: 'Poppins-Regular',
    italic: 'Poppins-Regular',
    bold: 'Poppins-Bold',
  },
  system: { label: 'System serif', note: 'The #395 stand-in', regular: sys, italic: sys, bold: sys },
} satisfies Record<string, Face>;

export type FaceKey = keyof typeof FACES;

export function useReaderFonts() {
  const [loaded] = useFonts({
    Literata_400Regular,
    Literata_400Regular_Italic,
    Literata_700Bold,
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_700Bold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_700Bold,
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_400Regular_Italic,
    AtkinsonHyperlegibleNext_700Bold,
  });
  return loaded;
}

/** Base sizes before the OS text size multiplies them; the body is never capped. */
export const SIZES = [16, 17, 18, 20, 22, 24] as const;
export const SPACINGS = { snug: 1.4, normal: 1.55, loose: 1.75 } as const;
export type Spacing = keyof typeof SPACINGS;

export const SURFACES = {
  app: 'Match app',
  paper: 'Paper',
  sepia: 'Sepia',
  night: 'Night',
} as const;
export type SurfaceKey = keyof typeof SURFACES;

export type Appearance = { face: FaceKey; size: number; spacing: Spacing; surface: SurfaceKey };

export const DEFAULT_APPEARANCE: Appearance = { face: 'literata', size: 18, spacing: 'normal', surface: 'app' };

/** bg / ink / muted for a surface; "app" follows the active app theme. */
export function useSurface(surface: SurfaceKey) {
  const prefix = surface === 'app' ? null : `--color-reader-${surface}`;
  const bg = String(useCSSVariable(prefix ? `${prefix}-bg` : '--color-background'));
  const ink = String(useCSSVariable(prefix ? `${prefix}-ink` : '--color-foreground'));
  const muted = String(useCSSVariable(prefix ? `${prefix}-muted` : '--color-muted'));
  return { bg, ink, muted };
}

/** Reads the (possibly scoped, see `SurfaceScope`) tokens, so it follows the surface for free. */
export function useMarkdownStyle(a: Appearance): MarkdownStyle {
  const ink = String(useCSSVariable('--color-foreground'));
  const muted = String(useCSSVariable('--color-muted'));
  const accent = String(useCSSVariable('--color-accent'));
  const f = FACES[a.face];
  const lh = Math.round(a.size * SPACINGS[a.spacing]);
  const headSize = Math.round(a.size * 1.2);
  return {
    paragraph: { fontFamily: f.regular, fontSize: a.size, lineHeight: lh, color: ink, marginBottom: Math.round(a.size * 0.9) },
    h2: {
      fontFamily: f.bold,
      fontSize: headSize,
      lineHeight: Math.round(headSize * 1.3),
      color: ink,
      marginBottom: 12,
    },
    strong: { fontFamily: f.bold, fontWeight: 'normal' },
    // A face without a real italic keeps the synthesized one.
    em: { fontFamily: f.italic, fontStyle: f.italic === f.regular ? 'italic' : 'normal' },
    link: { color: accent, underline: true },
    blockquote: { fontFamily: f.italic, fontSize: a.size, lineHeight: lh, color: muted, borderColor: muted, borderWidth: 2, gapWidth: 14 },
    list: { fontFamily: f.regular, fontSize: a.size, lineHeight: lh, color: ink, bulletColor: muted, itemSpacing: 6 },
  };
}
