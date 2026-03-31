import type { HapticPatternData } from '@/modules/native-core-haptics';

/**
 * Xolace haptic patterns — designed for emotional processing.
 * Low intensity, low sharpness baseline. Patterns feel like breath, not buzzes.
 */

// ── Presence Patterns ────────────────────────────────────────────────

/** Mirrors BreathingOrb's inhale/exhale. Plays once on processing-state mount. */
export const processingBreath: HapticPatternData = {
  events: [
    {
      eventType: 'hapticContinuous',
      time: 0.0,
      eventDuration: 3.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.1 },
        { parameterID: 'hapticSharpness', value: 0.1 },
      ],
    },
  ],
  parameterCurves: [
    {
      parameterID: 'hapticIntensityControl',
      relativeTime: 0.0,
      controlPoints: [
        { relativeTime: 0.0, value: 0.3 },
        { relativeTime: 0.75, value: 0.8 },
        { relativeTime: 1.5, value: 1.0 },
        { relativeTime: 2.25, value: 0.8 },
        { relativeTime: 3.0, value: 0.0 },
      ],
    },
  ],
};

/** Softest acknowledgment. Idle-state entry, onboarding transitions. */
export const gentlePresence: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.2 },
        { parameterID: 'hapticSharpness', value: 0.1 },
      ],
    },
  ],
};

// ── Validation Patterns ──────────────────────────────────────────────

/** Three-beat crescendo. "You've been heard." Peak haptic moment. Mirror-state mount. */
export const mirrorArrival: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.15 },
        { parameterID: 'hapticSharpness', value: 0.1 },
      ],
    },
    {
      eventType: 'hapticTransient',
      time: 0.1,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.3 },
        { parameterID: 'hapticSharpness', value: 0.15 },
      ],
    },
    {
      eventType: 'hapticTransient',
      time: 0.2,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.5 },
        { parameterID: 'hapticSharpness', value: 0.2 },
      ],
    },
  ],
};

/** Two-beat period. Session-end mount. */
export const sessionComplete: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.4 },
        { parameterID: 'hapticSharpness', value: 0.15 },
      ],
    },
    {
      eventType: 'hapticContinuous',
      time: 0.2,
      eventDuration: 0.3,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.3 },
        { parameterID: 'hapticSharpness', value: 0.1 },
      ],
    },
  ],
  parameterCurves: [
    {
      parameterID: 'hapticIntensityControl',
      relativeTime: 0.2,
      controlPoints: [
        { relativeTime: 0.0, value: 1.0 },
        { relativeTime: 0.3, value: 0.0 },
      ],
    },
  ],
};

/** Warm transient for peer resonance toggle. */
export const resonanceToggle: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.35 },
        { parameterID: 'hapticSharpness', value: 0.15 },
      ],
    },
  ],
};

// ── Transition Patterns ──────────────────────────────────────────────

/** Two-beat commitment. Path-selection button presses. */
export const pathChoice: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.25 },
        { parameterID: 'hapticSharpness', value: 0.15 },
      ],
    },
    {
      eventType: 'hapticTransient',
      time: 0.08,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.4 },
        { parameterID: 'hapticSharpness', value: 0.2 },
      ],
    },
  ],
};

/** Naming a feeling — slightly crisp. Texture tag toggles. */
export const textureSelect: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.25 },
        { parameterID: 'hapticSharpness', value: 0.2 },
      ],
    },
  ],
};

/** Placing your hand on a surface. Tap-to-type press. */
export const typingBegin: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.2 },
        { parameterID: 'hapticSharpness', value: 0.15 },
      ],
    },
  ],
};

// ── Micro-interactions ───────────────────────────────────────────────

/** Default button press. Dismiss, navigation, secondary actions. */
export const softPress: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.2 },
        { parameterID: 'hapticSharpness', value: 0.1 },
      ],
    },
  ],
};

/** Primary action press. "That's it", "Let it out", OAuth sign-in. */
export const affirmativePress: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.35 },
        { parameterID: 'hapticSharpness', value: 0.15 },
      ],
    },
  ],
};

// ── Utility Patterns ─────────────────────────────────────────────────

/** Sharp double-tap. Error-state mount. Distinct from emotional vocabulary. */
export const errorNotice: HapticPatternData = {
  events: [
    {
      eventType: 'hapticTransient',
      time: 0.0,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.35 },
        { parameterID: 'hapticSharpness', value: 0.4 },
      ],
    },
    {
      eventType: 'hapticTransient',
      time: 0.06,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.35 },
        { parameterID: 'hapticSharpness', value: 0.4 },
      ],
    },
  ],
};

/** Deeply round fade. Gave-up state mount. "Even this is okay." */
export const compassionateHold: HapticPatternData = {
  events: [
    {
      eventType: 'hapticContinuous',
      time: 0.0,
      eventDuration: 0.5,
      parameters: [
        { parameterID: 'hapticIntensity', value: 0.25 },
        { parameterID: 'hapticSharpness', value: 0.05 },
      ],
    },
  ],
  parameterCurves: [
    {
      parameterID: 'hapticIntensityControl',
      relativeTime: 0.0,
      controlPoints: [
        { relativeTime: 0.0, value: 1.0 },
        { relativeTime: 0.3, value: 0.6 },
        { relativeTime: 0.5, value: 0.0 },
      ],
    },
  ],
};
