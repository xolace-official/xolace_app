/**
 * PROTOTYPE — throwaway. Ticket #198 (visual & motion identity).
 *
 * Placeholder slide copy so the identity directions can be judged against
 * realistic density. The actual per-slide creative concepts are ticket #200 —
 * do not treat this copy as decided.
 */
import type { SymbolViewProps } from 'expo-symbols';

export type ProtoSlide = {
  id: string;
  /** Small editorial label above the line. */
  label: string;
  /** The promise line — the thing being shown. */
  line: string;
  /** One supporting sentence. */
  detail: string;
  /** SF Symbol / Material glyph name (per convention: expo-symbols, no custom SVG). */
  symbol: SymbolViewProps['name'];
  /**
   * Where the fire sits for this slide, 0..1 in screen space.
   * Variant A walks the light around one fire instead of switching colours.
   */
  glow: { x: number; y: number };
};

export const PROTO_SLIDES: ProtoSlide[] = [
  {
    id: 'vent',
    label: 'Vent',
    line: 'Say it out loud.\nNo one is listening.',
    detail: 'Speak or type it raw. It goes nowhere but here.',
    symbol: 'waveform',
    glow: { x: 0.25, y: 0.28 },
  },
  {
    id: 'reflect',
    label: 'Reflect',
    line: 'It shows you\nwhat you said.',
    detail: 'Not advice. A mirror — so the shape of it becomes visible.',
    symbol: 'sparkles',
    glow: { x: 0.5, y: 0.2 },
  },
  {
    id: 'xolacers',
    label: 'Xolacers',
    line: 'Strangers who\nfelt this too.',
    detail: 'Quiet voices from the dark. Anonymous, always.',
    symbol: 'person.2',
    glow: { x: 0.78, y: 0.34 },
  },
  {
    id: 'quotes',
    label: 'Quotes',
    line: 'Something to\ncarry with you.',
    detail: 'One line a day, chosen for where you actually are.',
    symbol: 'quote.opening',
    glow: { x: 0.5, y: 0.62 },
  },
  {
    id: 'plus',
    label: 'Xolace+',
    line: 'Go deeper\nwhen you want to.',
    detail: 'Longer memory, more tones, the whole timeline.',
    symbol: 'flame',
    glow: { x: 0.22, y: 0.7 },
  },
];
