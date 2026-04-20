/** Canonical list of haptic pattern names — single source of truth. */
export const hapticNames = [
  'processingBreath',
  'gentlePresence',
  'mirrorArrival',
  'sessionComplete',
  'resonanceToggle',
  'pathChoice',
  'textureSelect',
  'typingBegin',
  'softPress',
  'affirmativePress',
  'errorNotice',
  'compassionateHold',
  'onboardingEntrance',
  'homeEntrance',
  'softenPulse',
] as const;

export type HapticName = (typeof hapticNames)[number];
