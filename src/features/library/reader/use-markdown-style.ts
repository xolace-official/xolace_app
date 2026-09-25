import { useThemeColor } from 'heroui-native';
import type { MarkdownStyle } from 'react-native-enriched-markdown';
import { useCSSVariable } from 'uniwind';

/**
 * The entry body's look, built from the active theme's tokens so it follows
 * every theme switch (#386). This is the "Classic" reading mode from #401 —
 * the app's own face, ~1.55 line spacing, the theme's own page. The Aa sheet
 * (a later ticket) swaps this for a per-mode style.
 */
export function useMarkdownStyle(): MarkdownStyle {
  const [foreground, muted, accent, border, surface] = useThemeColor([
    'foreground',
    'muted',
    'accent',
    'border',
    'surface-secondary',
  ]);
  const [regular, bold] = (useCSSVariable(['--font-normal', '--font-bold']) as string[]).map(String);

  const heading = { fontFamily: bold, color: foreground, marginTop: 20, marginBottom: 8 };
  return {
    paragraph: { fontFamily: regular, fontSize: 18, lineHeight: 28, color: foreground, marginBottom: 16 },
    h1: { ...heading, fontSize: 26, lineHeight: 32 },
    h2: { ...heading, fontSize: 22, lineHeight: 28 },
    h3: { ...heading, fontSize: 19, lineHeight: 26 },
    strong: { fontFamily: bold, fontWeight: 'normal', color: foreground },
    em: { color: foreground },
    link: { color: accent, underline: true },
    list: {
      fontFamily: regular,
      fontSize: 18,
      lineHeight: 28,
      color: foreground,
      bulletColor: muted,
      markerColor: muted,
      marginBottom: 16,
      itemSpacing: 6,
    },
    blockquote: {
      fontFamily: regular,
      fontSize: 17,
      lineHeight: 26,
      color: foreground,
      backgroundColor: surface,
      borderColor: border,
      borderWidth: 3,
      borderRadius: 12,
      padding: 12,
      gapWidth: 12,
      marginBottom: 16,
    },
    thematicBreak: { color: border, marginTop: 8, marginBottom: 24 },
  };
}
