// Fallback haptics for non-iOS platforms (Android, web) using expo-haptics.
// The iOS implementation lives in haptics.ios.ts (Expo platform resolution)
// and uses CoreHaptics for richer patterns.
//
// On Android we prefer performAndroidHapticsAsync (uses the native haptics
// engine, no VIBRATE permission needed). On web we fall back to impactAsync
// which uses the Web Vibration API.

import * as Haptics from 'expo-haptics';

import type { BreathPhase, HapticName } from './haptics.types';
export type { BreathPhase, HapticName };

const isAndroid = process.env.EXPO_OS === 'android';

// ── Helpers ──────────────────────────────────────────────────────────

function androidHaptic(type: Haptics.AndroidHaptics): void {
  Haptics.performAndroidHapticsAsync(type).catch(() => {});
}

function impact(style: Haptics.ImpactFeedbackStyle): void {
  Haptics.impactAsync(style).catch(() => {});
}

function notification(type: Haptics.NotificationFeedbackType): void {
  Haptics.notificationAsync(type).catch(() => {});
}

// ── Generic tap ──────────────────────────────────────────────────────

export function tap(_intensity?: number, _sharpness?: number): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Context_Click);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Light);
  }
}

// ── Named pattern functions ──────────────────────────────────────────
// Complex iOS CoreHaptics patterns are approximated with the closest
// equivalent. Ambient/atmospheric patterns (processingBreath,
// gentlePresence, compassionateHold) are left as no-ops since neither
// expo-haptics nor Android haptics can produce subtle sustained effects.

export function playProcessingBreath(): void {}

export function playGentlePresence(): void {}

export function playMirrorArrival(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Confirm);
  } else {
    notification(Haptics.NotificationFeedbackType.Success);
  }
}

export function playSessionComplete(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Confirm);
  } else {
    notification(Haptics.NotificationFeedbackType.Success);
  }
}

export function playResonanceToggle(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Toggle_On);
  } else {
    Haptics.selectionAsync().catch(() => {});
  }
}

export function playPathChoice(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Segment_Tick);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function playTextureSelect(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Segment_Tick);
  } else {
    Haptics.selectionAsync().catch(() => {});
  }
}

export function playTypingBegin(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Keyboard_Press);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function playSoftPress(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Virtual_Key);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function playAffirmativePress(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Confirm);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function playErrorNotice(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Reject);
  } else {
    notification(Haptics.NotificationFeedbackType.Error);
  }
}

export function playCompassionateHold(): void {}

export function playSoftenPulse(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Context_Click);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function playOnboardingEntrance(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Gesture_Start);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Soft);
  }
}

export function playHomeEntrance(): void {
  if (isAndroid) {
    androidHaptic(Haptics.AndroidHaptics.Gesture_Start);
  } else {
    impact(Haptics.ImpactFeedbackStyle.Soft);
  }
}

// ── Breath phase haptics ─────────────────────────────────────────────
// expo-haptics can't produce duration-scaled continuous patterns, so
// this is a best-effort boundary tick. The iOS override provides the
// real swell/release curves.

export function playBreathPhase(phase: BreathPhase, _durationMs: number): void {
  if (isAndroid) {
    androidHaptic(
      phase === 'top'
        ? Haptics.AndroidHaptics.Segment_Tick
        : Haptics.AndroidHaptics.Context_Click,
    );
  } else {
    impact(Haptics.ImpactFeedbackStyle.Light);
  }
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
