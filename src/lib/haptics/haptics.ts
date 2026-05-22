// Cross-platform haptics via react-native-pulsar (Android + web).
// iOS uses CoreHaptics via haptics.ios.ts (Expo platform extension).
import { Presets } from 'react-native-pulsar';
import type { BreathPhase, HapticName } from './haptics.types';
export type { BreathPhase, HapticName };

const isWeb = process.env.EXPO_OS === 'web';

function run(fn: () => void): void {
  if (!isWeb) fn();
}

// ── Generic tap ──────────────────────────────────────────────────────

export function tap(_intensity?: number, _sharpness?: number): void {
  run(() => Presets.flick());
}

// ── Named pattern functions ──────────────────────────────────────────

export function playProcessingBreath(): void {
  run(() => Presets.breath());
}

export function playGentlePresence(): void {
  run(() => Presets.feather());
}

export function playMirrorArrival(): void {
  run(() => Presets.herald());
}

export function playSessionComplete(): void {
  run(() => Presets.bloom());
}

export function playResonanceToggle(): void {
  run(() => Presets.chirp());
}

export function playPathChoice(): void {
  run(() => Presets.cadence());
}

export function playTextureSelect(): void {
  run(() => Presets.flick());
}

export function playTypingBegin(): void {
  run(() => Presets.thud());
}

export function playSoftPress(): void {
  run(() => Presets.push());
}

export function playAffirmativePress(): void {
  run(() => Presets.strike());
}

export function playErrorNotice(): void {
  run(() => Presets.wobble());
}

export function playCompassionateHold(): void {
  run(() => Presets.pendulum());
}

export function playSoftenPulse(): void {
  run(() => Presets.sway());
}

export function playOnboardingEntrance(): void {
  run(() => Presets.cascade());
}

export function playHomeEntrance(): void {
  run(() => Presets.thud());
}

// ── Breath phase haptics ─────────────────────────────────────────────
// Best-effort preset approximations. Duration-matched continuous envelopes
// (matching the iOS CoreHaptics implementation) are a planned Phase 2 upgrade
// using usePatternComposer inside BreathBeat.

export function playBreathPhase(phase: BreathPhase, _durationMs: number): void {
  run(() => {
    switch (phase) {
      case 'inhale':
        Presets.breath();
        return;
      case 'top':
        Presets.pip();
        return;
      case 'exhale':
        Presets.wave();
        return;
    }
  });
}

// ── Dynamic play-by-name ─────────────────────────────────────────────

const handlerMap: Record<HapticName, () => void> = {
  processingBreath: playProcessingBreath,
  gentlePresence: playGentlePresence,
  mirrorArrival: playMirrorArrival,
  sessionComplete: playSessionComplete,
  resonanceToggle: playResonanceToggle,
  pathChoice: playPathChoice,
  textureSelect: playTextureSelect,
  typingBegin: playTypingBegin,
  softPress: playSoftPress,
  affirmativePress: playAffirmativePress,
  errorNotice: playErrorNotice,
  compassionateHold: playCompassionateHold,
  onboardingEntrance: playOnboardingEntrance,
  homeEntrance: playHomeEntrance,
  softenPulse: playSoftenPulse,
};

export function playHaptic(name: HapticName): void {
  handlerMap[name]();
}
