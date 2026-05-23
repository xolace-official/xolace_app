import type { BreathPhase } from '@/src/lib/haptics'

// Fixed gap between the two shapes in pixels
export const GAP = 14

// Shape geometry — ratios of canvas dimensions
export const SHAPE = {
  top: {
    rest: { wRatio: 0.82, hRatio: 0.60, baseR: 54 },
    peak: { wRatio: 0.74, hRatio: 0.32, baseR: 40 },
  },
  bot: {
    rest: { wRatio: 0.74, hRatio: 0.20, baseR: 40 },
    peak: { wRatio: 0.86, hRatio: 0.54, baseR: 56 },
  },
} as const

// Per-corner radius multipliers — slight asymmetry gives each shape an organic stone quality.
// The bottom corners of the top shape and top corners of the bottom shape are slightly
// less rounded, making the "gap" feel like two stones resting against each other.
export const TOP_CORNERS = {
  topLeft:     { x: 0.95, y: 1.05 },
  topRight:    { x: 1.08, y: 0.95 },
  bottomRight: { x: 0.86, y: 0.88 },
  bottomLeft:  { x: 0.90, y: 0.86 },
} as const

export const BOT_CORNERS = {
  topLeft:     { x: 0.88, y: 0.86 },
  topRight:    { x: 0.86, y: 0.90 },
  bottomRight: { x: 1.08, y: 1.05 },
  bottomLeft:  { x: 1.05, y: 1.10 },
} as const

// Corner wobble during hold phase
export const WOBBLE_AMPLITUDE = 6
export const WOBBLE_DURATION_MS = 880

export const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe in',
  top: 'Hold',
  exhale: 'Breathe out',
}
