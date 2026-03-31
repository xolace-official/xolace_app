import CoreHaptics from '@/modules/native-core-haptics';
import type { HapticPatternData } from '@/modules/native-core-haptics';

import {
  processingBreath,
  gentlePresence,
  mirrorArrival,
  sessionComplete,
  resonanceToggle,
  pathChoice,
  textureSelect,
  typingBegin,
  softPress,
  affirmativePress,
  errorNotice,
  compassionateHold,
} from './haptics-patterns.ios';

// ── Generic helpers ──────────────────────────────────────────────────

function play(pattern: HapticPatternData): void {
  if (process.env.EXPO_OS !== 'ios') return;
  CoreHaptics.playPattern(pattern);
}

export function tap(intensity = 0.2, sharpness = 0.1): void {
  if (process.env.EXPO_OS !== 'ios') return;
  CoreHaptics.impact(sharpness, intensity);
}

// ── Named pattern functions ──────────────────────────────────────────

export function playProcessingBreath(): void {
  play(processingBreath);
}

export function playGentlePresence(): void {
  play(gentlePresence);
}

export function playMirrorArrival(): void {
  play(mirrorArrival);
}

export function playSessionComplete(): void {
  play(sessionComplete);
}

export function playResonanceToggle(): void {
  play(resonanceToggle);
}

export function playPathChoice(): void {
  play(pathChoice);
}

export function playTextureSelect(): void {
  play(textureSelect);
}

export function playTypingBegin(): void {
  play(typingBegin);
}

export function playSoftPress(): void {
  play(softPress);
}

export function playAffirmativePress(): void {
  play(affirmativePress);
}

export function playErrorNotice(): void {
  play(errorNotice);
}

export function playCompassionateHold(): void {
  play(compassionateHold);
}

// ── Dynamic play-by-name ─────────────────────────────────────────────

const patternMap = {
  processingBreath,
  gentlePresence,
  mirrorArrival,
  sessionComplete,
  resonanceToggle,
  pathChoice,
  textureSelect,
  typingBegin,
  softPress,
  affirmativePress,
  errorNotice,
  compassionateHold,
} as const;

export type HapticName = keyof typeof patternMap;

export function playHaptic(name: HapticName): void {
  play(patternMap[name]);
}
