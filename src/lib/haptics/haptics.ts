// No-op stubs for non-iOS platforms (Android, web).
// The iOS implementation lives in haptics.ios.ts (Expo platform resolution).

export type { HapticName } from './haptics.types';
import type { HapticName } from './haptics.types';

export function tap(_intensity?: number, _sharpness?: number): void {}
export function playProcessingBreath(): void {}
export function playGentlePresence(): void {}
export function playMirrorArrival(): void {}
export function playSessionComplete(): void {}
export function playResonanceToggle(): void {}
export function playPathChoice(): void {}
export function playTextureSelect(): void {}
export function playTypingBegin(): void {}
export function playSoftPress(): void {}
export function playAffirmativePress(): void {}
export function playErrorNotice(): void {}
export function playCompassionateHold(): void {}
export function playOnboardingEntrance(): void {}
export function playHomeEntrance(): void {}

export function playHaptic(_name: HapticName): void {}
