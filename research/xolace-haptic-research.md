# Xolace Haptic Research
## Pulsar Migration + Android Parity

---

## Why This Matters More Than You Think

Haptics on Xolace are not decoration. They are the **fourth sense layer** of the product —
the one that makes the mirror feel like it actually touched you, that makes processing feel
like breathing, that makes session-end feel like you actually completed something real. iOS
users have been experiencing a rich custom CoreHaptics vocabulary since day one. Android users
have been getting `Confirm`, `Toggle_On`, and silence. That is not a parity problem — it is
a product integrity problem.

The Pulsar reference article says it plainly: research found haptic feedback users outperformed
audio-only users, who outperformed visual-only users. On every measure. For Xolace this is
not about sales conversion — it is about whether the app actually *works emotionally* on Android.
You cannot have a campfire that only warms half the people sitting around it.

---

## The Current State

### iOS (CoreHaptics via custom native module)
A custom haptic vocabulary exists in `src/lib/haptics/haptics-patterns.ios.ts` with 17 named
patterns. These are expressive, duration-matched, emotionally intentional. They work.

### Android (expo-haptics fallback in `haptics.ts`)
Six patterns are **complete no-ops**: `playProcessingBreath`, `playGentlePresence`,
`playCompassionateHold` (and indirectly the breath phase patterns). The rest map to generic
system primitives that carry no emotional specificity:
- `playMirrorArrival` → `Confirm` (a single system confirmation, nothing like the 3-beat crescendo)
- `playSessionComplete` → `Confirm`
- `playResonanceToggle` → `Toggle_On`
- `playBreathPhase` → `Context_Click` (a single generic tick for a 4–8 second breathing phase)

### Pulsar (partially adopted)
`react-native-pulsar` is already installed and used in two files:
- `quotes-screen.tsx`: `Presets.flick()` on close button
- `quote-card.tsx`: `Presets.ping()` on heart and "not today" reactions

The foundation is there. Pulsar runs on both platforms with a single API. The migration
path is clear.

---

## The Migration Strategy

**Phase 1 — Parity**: Replace the Android no-ops and weakest approximations with Pulsar Presets
that match the emotional register of each iOS pattern. Every Xolace moment should *feel the same*
on both platforms.

**Phase 2 — Enhancement**: Migrate the iOS custom patterns to Pulsar `usePatternComposer` where
Pulsar's cross-platform `Pattern` type can reproduce what CoreHaptics does. This removes the
dependency on the custom native module entirely.

**Phase 3 — New moments**: Add haptics to the UI interactions that currently have none but deserve one.

---

## Complete Haptic Map

### Existing Moments — Missing or Broken Android

---

#### 1. Mirror Arrival
**Location**: `features/reflect/components/states/mirror-state.tsx:47` — fires on `useEffect` mount  
**Current iOS**: Three-beat crescendo (0.0s → 0.1s → 0.2s), intensity building from 0.5 → 0.7 → 0.95  
**Current Android**: `Haptics.NotificationFeedbackType.Success` — a single system notification buzz  
**The problem**: The mirror arriving is the most sacred moment in the entire app. The whole session
builds toward it. iOS users feel it arrive in three ascending heartbeats. Android users feel a
notification buzz — the same one that tells you your password reset worked.  
**Pulsar fix**: `Presets.herald()` — "Two gentle knocks building to a decisive third, ideal for staged
confirmations with a clear conclusion." This matches the exact structure of the iOS pattern: escalating
beats that resolve with intention.  
**Custom option via `usePatternComposer`**: Reproduce the exact iOS pattern with a `discretePattern`
of three events at 0ms / 100ms / 200ms with amplitudes 0.5 / 0.7 / 0.95 and frequency 0.25 / 0.35 / 0.50.
This gives identical feel on both platforms.

---

#### 2. Processing Breath
**Location**: `features/reflect/components/states/processing-state.tsx:36` — fires on `useEffect` mount  
**Current iOS**: Custom `hapticContinuous` event, 3 seconds, intensity curve swelling from 0.3 → 1.0 → 0.0
(mirrors the BreathingOrb's visual rhythm)  
**Current Android**: **No-op. Complete silence.**  
**The problem**: Processing is where the AI is reading you. The breathing orb is alive on screen.
The visual is doing its job. Android users feel nothing — just watch a ball pulse with zero
physical confirmation that something is happening. The haptic here is what makes it feel like
the app is *with* you in the wait, not just loading.  
**Pulsar fix**: `Presets.breath()` — "Slow, calming in-and-out rhythm, you feel it like a gentle
inhale and exhale." This is an exact semantic match.  
**Custom option**: Use `usePatternComposer` with a `continuousPattern` envelope that rises over
1.5s and falls over 1.5s — matched to the BreathingOrb's visual. The iOS pattern already
documents the exact control points.

---

#### 3. Session Complete
**Location**: `features/session-end/components/session-end-screen.tsx:26` — fires when `isLoading`
clears  
**Current iOS**: Two-beat pattern: transient at 0.75 intensity + continuous fade-out over 300ms  
**Current Android**: `Haptics.NotificationFeedbackType.Success`  
**The problem**: "You showed up for yourself today." Android users get a notification buzz. The
moment deserves more weight — a sense of landing, of arriving, of something completing.  
**Pulsar fix**: `Presets.bloom()` — "A quiet confirmation of completion, ideal for subtle task
completions or non-intrusive positive reinforcement." The emotional register matches exactly.  
**Alternative**: `Presets.dissolve()` — "A gentle, soothing fade, ideal for calm relief after a
mild challenge or successful low-stakes action." Also fits.

---

#### 4. Compassionate Hold (Gave Up)
**Location**: `features/reflect/components/states/gave-up-state.tsx:21` — fires on `useEffect` mount  
**Current iOS**: Custom `hapticContinuous` event, 500ms, intensity curve: 1.0 → 0.6 → 0.0.
Round, fading, "even this is okay"  
**Current Android**: **No-op. Complete silence.**  
**The problem**: The gave-up state is designed to hold the user who couldn't find words. The copy
says "Sometimes words can't quite capture what we feel — and that's okay." The iOS haptic lands
with warmth and then lets go — physically enacting "it's okay." Android users get nothing. The moment
is hollow.  
**Pulsar fix**: `Presets.pendulum()` — "A rhythmic swing that gradually settles, ideal for winding-down
moments or calm settling effects." Or `Presets.fadeOut()` — "A graceful drift toward silence, ideal for
dismissals or transitions that should feel calm and natural." Either communicates release without alarm.  
**Custom option**: `usePatternComposer` with a `continuousPattern` that peaks and decays — reproducing
the iOS curve directly.

---

#### 5. Breath Phase Haptics (Sit With This exercise runner)
**Location**: `features/sit-with-this/components/paced-orb.tsx` — fires `onPhaseTransition` callbacks  
**Handled in**: `features/sit-with-this/components/runner/beats/breath-beat.tsx:35`  
**Current iOS**: Duration-matched continuous patterns. Inhale: swell from 0.35 → 1.0 over N seconds.
Top hold: single transient. Exhale: decay from 1.0 → 0.0 over N seconds.  
**Current Android**: `Context_Click` for each phase boundary — a generic tick.  
**The problem**: The breathing exercise is the centerpiece of the Solo path. For it to work as
regulation (not just animation), the haptic must *breathe with you*. A generic tick at each phase
boundary tells the body nothing. A swell that rises during inhale and falls during exhale tells
the body everything.  
**Pulsar fix**:  
- **Inhale**: `usePatternComposer` with a `continuousPattern` amplitude envelope that rises over
the full inhale duration (4000ms for physiological sigh). Frequency 0.3 throughout.  
- **Top hold** (physiological sigh only): `Presets.breathTopHold` → `Presets.pip()` (a brief
energetic pop) or single `discretePattern` transient at amplitude 0.5  
- **Exhale**: `usePatternComposer` with an amplitude envelope that decays from 1.0 → 0.0 over
the exhale duration (6000–8000ms). Frequency 0.15.  
This is the one case in the app where `useRealtimeComposer` could also work — updating amplitude
in real time as the orb animation progresses.

---

#### 6. HapticBeat (Sit With This — soften pulse)
**Location**: `features/sit-with-this/components/runner/beats/haptic-beat.tsx:35`  
**Current iOS**: `softenPulse` — custom continuous event, 800ms, intensity curve bell-shaped:
0.4 → 1.0 → 0.0  
**Current Android**: `Context_Click` — a generic tick  
**The problem**: The HapticBeat fires when the exercise runner lands on a "hold space" beat — a
moment of stillness with a pulsing dot. The iOS pattern produces a warm, round swell that physically
communicates "be here." Android users get a small tick.  
**Pulsar fix**: `Presets.pulse()` — "A gentle, steady pulse that quietly signals ongoing activity
without demanding attention." Or `Presets.sway()` — "Reassuring and rhythmic, ideal for calming
or encouraging feedback." Either matches the emotional intent of the beat.

---

### Existing Moments — Differentiation Problems

---

#### 7. Quote Reactions — "Resonates" vs "Not Today"
**Location**: `features/quotes/components/quote-card.tsx:50,54`  
**Current (both)**: `Presets.ping()` — same haptic for both reactions  
**The problem**: These two gestures have opposite emotional valence. "Resonates" is connection,
recognition, warmth — a heart tap. "Not today" is gentle deflection, protection, "I'm not ready
for this." They should feel different in your hand.  
**Pulsar fix**:  
- **Resonates**: `Presets.chirp()` — "Light-hearted and cheerful, ideal for positive
micro-interactions or small wins." Warm, bright, quick. Or `Presets.pip()` — "A light, sparkling
burst, ideal for in-game collectibles." When the heart bursts with animation, match the energy.  
- **Not today**: `Presets.wane()` — "A lazy, dismissive fade, fitting for sarcastic or indifferent
UI moments." Or `Presets.murmur()` — "Two soft, quiet taps, ideal for subtle double-step interactions."
A gentle withdrawal rather than a selection.

---

#### 8. "That's It" (Mirror Confirmation) — Primary CTA Weight
**Location**: `features/reflect/components/states/mirror-state.tsx:141`  
**Current**: `playAffirmativePress()` → Android `Confirm`  
**The problem**: "That's it" is arguably the highest-stakes button press in the app. The user
is saying yes, you saw me correctly. The current Android haptic is the same weight as any other
confirm. iOS gets a custom 0.8 intensity transient. Neither is emphatic enough for the moment.  
**Pulsar fix**: `Presets.strike()` — "A confident, decisive strike that delivers a clear and
satisfying response for the main call-to-action." This is explicitly designed for primary CTA
confirmation and has more presence than `affirmativePress`. Worth upgrading on both platforms.

---

#### 9. Night Mode Toggle
**Location**: `features/settings/components/screens/AppearanceScreen.tsx`  
**Current**: `playSoftPress()` → generic light impact  
**The problem**: Night mode is a significant state change — it shifts the emotional register of
the entire app. The haptic should communicate "something is switching."  
**Pulsar fix**: `Presets.snap()` — "A firm snap that conveys a locked-in selection, perfect for
toggles, switches, or confirming a choice." This is literally what Pulsar describes snap as being
designed for.

---

### New Moments — Currently No Haptic

---

#### 10. Escalation State Mount (Crisis Flag)
**Location**: `features/reflect/components/states/escalation-state.tsx` — no haptic on mount  
**Why it needs one**: The escalation screen is triggered when the AI detects the user may be in
crisis. It appears as a shift — the emotional register changes completely. There is currently no
physical signal that something important has happened. The user reads a visual change but their
body receives nothing.  
**Pulsar haptic**: `Presets.peal()` — "Firm and measured, conveys that something needs attention
soon without triggering panic." This is precise: not an alarm, not a casual tap. It signals
importance without causing distress — exactly right for a crisis-adjacent moment where the goal
is calm attention, not fear.  
**Implementation**: Fire on component mount, before the copy has loaded in. The haptic announces
the shift before the words do.

---

#### 11. Anonymous Contribution Confirmed
**Location**: `features/session-end/components/contributed-confirmation.tsx` — no haptic  
**Why it needs one**: When a user decides to share their distilled reflection anonymously so it
might help a stranger — that is an act of generosity. The most quietly meaningful action in the
app. It currently happens silently.  
**Pulsar haptic**: `Presets.dewdrop()` — "A quiet confirmation of success, ideal for operations
that completed without needing attention." This is a private, warm signal — not celebratory,
not loud. The contribution wasn't made for applause. The haptic matches.

---

#### 12. Timeline Entry Card Tap
**Location**: `features/timeline/components/timeline-entry-card.tsx` — no haptic  
**Why it needs one**: The timeline is where users revisit past sessions. Tapping a session entry
is like opening a page in a journal — quiet but deliberate. Currently silent.  
**Pulsar haptic**: `Presets.ping()` — "A precise, definitive click, ideal for list selections or
any interaction where clarity of choice matters." Already in use on the quotes screen. Consistent
and appropriate here.

---

#### 13. Onboarding Frame Steps — Per-Step Reveal
**Location**: `features/onboarding/components/step-reveal.tsx` — each step has a timed reveal  
**Why it needs one**: The FrameScreen reveals Xolace's three principles one by one with timed
delays. These are moments of understanding arriving. The visual stagger is intentional. A physical
counterpart would make each arrival feel like it *lands*.  
**Pulsar haptic**: `Presets.feather()` — "A gentle, non-disruptive nudge, ideal for low-priority
reminders." One soft pulse per step as it fades in. Barely there — just enough to mark the arrival.  
**Implementation note**: Fire in `StepReveal` via a `useEffect` tied to the `isVisible` state.
Stagger the haptic slightly after the animation fires, not before.

---

#### 14. "Let It Out" Submit (Primary reflect CTA)
**Location**: `components/shared/pill-button.tsx` — used as the submit CTA in IdleState and TypingState  
**Why it needs one**: "Let it out" is the moment the user sends their reflection. It's the commit
point — the bridge from private to processed. Currently `PillButton` has no haptic of its own
(the caller provides one where it's wired). In typing state specifically, `onSubmit` → the chain
calls `playAffirmativePress()` inside `PillButton`'s own press? No — looking at `TypingState`,
the submit fires `onSubmit` which is `handleSubmit` in the machine, no haptic at all.  
**Actually**: The `PillButton` in the idle scaffold submit does fire via `onScaffoldSubmit` which
also doesn't play a haptic. The typing state's "Let it out" `onSubmit` also goes direct to machine
dispatch with no haptic. **This means there's no haptic on the primary submit in typing state.**  
**Pulsar haptic**: `Presets.propel()` — "A confident forward push communicating that a form or
action has been decisively submitted." The description is almost word-for-word what this button does.

---

#### 15. Clarify State Mount ("Not Quite" / "Say More")
**Location**: `features/reflect/components/states/clarify-state.tsx` — no haptic on mount  
**Why it needs one**: Entering clarify means the mirror missed. The user said "not quite" or
"say more." It's a mild setback but also a continuation — the app is still with them, just trying
again. This state change deserves a physical signal.  
**Pulsar haptic**: `Presets.wobble()` — "A gentle correction without alarm, ideal for minor
validation errors or soft negative feedback." Not aggressive — just a mild "let's try again" wobble.

---

#### 16. Peer Reflection Screen Mount
**Location**: `features/peer-reflection/components/screen/PeerReflectionScreen.tsx` — no mount haptic  
**Why it needs one**: The moment you arrive in the peer reflections screen — where you see strangers
who felt what you felt — is emotionally loaded. It's the campfire's "quiet voices from the darkness."
There should be a physical sense of entering a shared space.  
**Pulsar haptic**: `Presets.murmur()` — "Two soft, quiet taps, ideal for subtle double-step
interactions or unobtrusive confirmations." Two quiet beats — like hearing two other heartbeats
in the dark.

---

#### 17. Mood Check Selection (Session End)
**Location**: `features/session-end/components/activity-variant.tsx:99` — uses `playTextureSelect()`  
**Currently has**: `playTextureSelect()` — good, this is intentional  
**Gap**: The "lighter" selection should feel different from "heavier". All four moods currently
use the same haptic.  
**Pulsar fix**:  
- **Lighter**: `Presets.chirp()` — light, upward energy  
- **Same**: `Presets.plink()` — "A neutral heads-up suited as a baseline for informational notifications"  
- **Heavier**: `Presets.plunk()` — "Understated but present, suitable for subdued feedback that
still has noticeable weight" — physically heavier  
- **Unsure**: `Presets.murmur()` — soft and noncommittal

---

#### 18. Menu Open/Close Differentiation
**Location**: `features/idle-menu/menu-trigger.tsx:29`  
**Currently has**: `playSoftPress()` for both open and close  
**Gap**: Opening and closing a drawer are different acts. Opening: something is revealed.
Closing: something is tucked away.  
**Pulsar fix**:  
- **Open**: `Presets.thud()` — "A soft, warm acknowledgement, ideal for opening a menu or drawer."
(Pulsar literally describes this use case)  
- **Close**: `Presets.flick()` — "A light, quick tap with minimal presence." Quick dismissal.

---

#### 19. Theme Change
**Location**: `features/settings/components/AppearanceScreen.tsx:24`  
**Currently has**: `playSoftPress()`  
**The problem**: Switching theme is a visual transformation — the whole app shifts color. A soft
press doesn't communicate that something significant changed.  
**Pulsar haptic**: `Presets.sonar()` — "The eureka moment, ideal for conveying the satisfying rush
of finding what you were looking for." A theme switch is discovery — you're finding the version
of the app that feels like you.

---

#### 20. Crisis Resource Link Tap
**Location**: `features/reflect/components/states/escalation-state.tsx:36`  
**Currently has**: `playSoftPress()`  
**The problem**: Tapping a crisis resource (a phone number, a URL to a helpline) is a high-stakes
action. The haptic should be distinct from a navigation tap.  
**Pulsar haptic**: `Presets.herald()` — firm and staged. The user is about to reach out. The
physical signal should have weight, not be a whisper.

---

## The Breath Exercise: The Crown Jewel

The breathing exercise in Sit With This is where Pulsar's `usePatternComposer` can do something
expo-haptics never could on Android: duration-matched continuous haptic envelopes.

### Implementation Pattern

```typescript
// For each breath phase, compose a duration-matched pattern
const inhalePattern = (durationMs: number): Pattern => ({
  discretePattern: [],
  continuousPattern: {
    amplitude: [
      { time: 0, value: 0.35 },
      { time: durationMs * 0.7, value: 0.9 },
      { time: durationMs, value: 1.0 },
    ],
    frequency: [
      { time: 0, value: 0.15 },
      { time: durationMs, value: 0.15 },
    ],
  },
});

const exhalePattern = (durationMs: number): Pattern => ({
  discretePattern: [],
  continuousPattern: {
    amplitude: [
      { time: 0, value: 1.0 },
      { time: durationMs * 0.5, value: 0.5 },
      { time: durationMs, value: 0.0 },
    ],
    frequency: [
      { time: 0, value: 0.12 },
      { time: durationMs, value: 0.12 },
    ],
  },
});
```

This is what the iOS implementation already does with CoreHaptics. Pulsar's `Pattern` type is
structurally identical. The migration is transliteration, not rewrite. And it will work on Android.

---

## iOS Custom Module Migration Readiness

| iOS Pattern | Pulsar Equivalent | Confidence |
|---|---|---|
| `processingBreath` | `Presets.breath()` or custom `Pattern` | High |
| `gentlePresence` | `Presets.feather()` | High |
| `mirrorArrival` | `Presets.herald()` or custom `Pattern` | High |
| `sessionComplete` | `Presets.bloom()` | High |
| `resonanceToggle` | `Presets.chirp()` | High |
| `pathChoice` | `Presets.cadence()` | Medium |
| `textureSelect` | `Presets.flick()` | High |
| `typingBegin` | `Presets.thud()` | Medium |
| `softPress` | `Presets.push()` | High |
| `affirmativePress` | `Presets.strike()` | High |
| `errorNotice` | `Presets.wobble()` (soft) or `Presets.buzz()` (hard) | High |
| `compassionateHold` | `Presets.pendulum()` or custom `Pattern` | Medium |
| `onboardingEntrance` | custom `Pattern` (3 pulses + continuous fade) | High |
| `homeEntrance` | `Presets.thud()` + `Presets.breathing()` sequence | Medium |
| `softenPulse` | `Presets.sway()` or `Presets.pulse()` | High |
| `breathInhalePattern` | custom `Pattern` (continuous envelope) | High |
| `breathTopHold` | `Presets.pip()` | High |
| `breathExhalePattern` | custom `Pattern` (continuous envelope) | High |

The patterns where custom `Pattern` is listed are ones where the emotional specificity is
worth preserving exactly. Pulsar's `usePatternComposer` accepts the same control-point structure
as the iOS patterns — the data can be moved directly.

---

## Priority Order

**Immediate (Android is broken, not just worse)**
1. `processingBreath` → `Presets.breath()` (currently silent on Android)
2. `compassionateHold` → `Presets.pendulum()` (currently silent on Android)
3. `gentlePresence` → `Presets.feather()` (currently silent on Android)
4. Breath exercise phases → `usePatternComposer` with duration envelopes (currently single ticks)
5. `mirrorArrival` → `Presets.herald()` or custom (currently a notification buzz)

**High value (significantly better experience)**
6. `sessionComplete` → `Presets.bloom()`
7. "Let it out" submit haptic → `Presets.propel()`
8. Escalation state mount → `Presets.peal()`
9. Quote reactions differentiated → `Presets.chirp()` / `Presets.wane()`
10. "That's it" → `Presets.strike()`

**Meaningful additions**
11. Anonymous contribution confirmed → `Presets.dewdrop()`
12. Timeline entry tap → `Presets.ping()`
13. Clarify state mount → `Presets.wobble()`
14. Peer reflection screen mount → `Presets.murmur()`
15. Menu open/close differentiation → `Presets.thud()` / `Presets.flick()`
16. Theme change → `Presets.sonar()`
17. Night mode toggle → `Presets.snap()`
18. Onboarding step reveals → `Presets.feather()`
19. Mood check differentiation (lighter/heavier/same/unsure)

---

## A Note on Preloading

From the Pulsar docs:
```typescript
Settings.preloadPresets(['breath', 'herald', 'bloom', 'pendulum', 'strike', 'propel', 'ping', 'chirp', 'wobble', 'peal', 'dewdrop']);
```

Any preset used in a high-frequency path (processing state, breath exercise phases, mirror arrival)
should be preloaded at app start. Preloading eliminates the first-play latency which would break
the synchronization between animation and haptic.

---

## Summary

The current haptic system is excellent on iOS. On Android it ranges from diminished to absent at
the most important moments. Pulsar solves this with a unified API that produces real, expressive,
emotionally-tuned haptics on both platforms. The migration is:

1. Replace the `haptics.ts` fallback file with Pulsar Presets — no new architecture needed
2. Migrate the 5 no-op patterns to their Pulsar equivalents
3. Replace the weakest approximations (mirrorArrival, sessionComplete) with proper Presets
4. Add the breath exercise haptic using `usePatternComposer` with duration-matched envelopes
5. Add new moments that currently have none (submit, escalation, contribution)

Xolace's haptic identity — warm, present, never aggressive — has a natural home in Pulsar.
`herald`, `bloom`, `breath`, `pendulum`, `strike`, `propel`. These aren't random library calls.
They're the emotional vocabulary the app already has, now speaking both languages.
