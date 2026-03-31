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
  onboardingEntrance,
  homeEntrance,
} from './haptics-patterns.ios';

// ── Generic helpers ──────────────────────────────────────────────────

function play(pattern: HapticPatternData): void {
  console.log("play ", pattern)
  if (process.env.EXPO_OS !== 'ios') return;
  console.log("playPattern")
  CoreHaptics.playPattern(pattern).catch((e: unknown) => {
    console.warn('[haptics] playPattern failed:', e);
  });
}

export function tap(intensity = 0.2, sharpness = 0.1): void {
  if (process.env.EXPO_OS !== 'ios') return;
  CoreHaptics.impact(sharpness, intensity).catch((e: unknown) => {
    console.warn('[haptics] impact failed:', e);
  });
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

export function playOnboardingEntrance(): void {
  play(onboardingEntrance);
}

export function playHomeEntrance(): void {
  play(homeEntrance);
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
  onboardingEntrance,
  homeEntrance,
} as const;

export type HapticName = keyof typeof patternMap;

export function playHaptic(name: HapticName): void {
  play(patternMap[name]);
}
