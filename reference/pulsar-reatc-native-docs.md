### Pulsar docs and Presets

The Pulsar React Native SDK (react-native-pulsar) exposes haptic feedback through three building blocks: Presets, usePatternComposer, and useRealtimeComposer. All preset functions and hook methods are worklet-compatible for use with Reanimated.

Requirements
React Native 0.71+
New Architecture enabled
Installation
Latest available version: 1.5.0

Expo
npm
Terminal window
npx expo install react-native-pulsar

Then run prebuild to generate the native project files:

Terminal window
npx expo prebuild

Presets
A collection of ready-to-use haptic patterns. All preset functions are worklet-compatible and can be called directly inside Reanimated worklets.

import { Presets } from 'react-native-pulsar';

Built-in presets
Method	Description
afterglow()	A three-beat phrase that dissolves gently, ideal for soft endings or gradually quieting feedback.
aftershock()	A firm opening that settles calmly, ideal for transitions needing a strong start and a gentle finish.
alarm()	Relentless and urgent, best for critical errors or emergencies that require immediate attention.
anvil()	The full weight of a massive collision, conveys sheer physical force and momentum.
applause()	A growing wave of appreciation, ideal for celebratory moments or social approval.
ascent()	The rush of leveling up, evoking the classic RPG reward of growth and progression.
balloonPop()	Mounting suspense that bursts into release, perfect for countdowns or suspenseful reveals.
barrage()	An overwhelming storm of rapid impacts, suited for maxing out a meter or total sensory overload moments.
bassDrop()	Two grounded thumps with a tonal descent, suited for distinct double-confirmation feedback.
batter()	An unrestrained explosion of rage, suited for catastrophic errors or total loss of control.
bellToll()	Three notes that soften as they land, suited for closing interactions or softening after a strong start.
blip()	A composed, subtle heads-up, ideal for non-critical warnings that should not interrupt the user.
bloom()	A quiet confirmation of completion, ideal for subtle task completions or non-intrusive positive reinforcement.
bongo()	Two balanced bursts of three, suited for structured multi-step or paired sequence feedback.
boulder()	Deep and weighty without sharpness, great for heavy object impacts or grounded confirmation feedback.
breakingWave()	Two measured steps leading into a stronger landing, ideal for escalating confirmations or staged actions.
breath()	Slow, calming in-and-out rhythm, you feel it like a gentle inhale and exhale.
breathing()	Calm and unobtrusive, ideal for background processing that should not disturb the user.
buildup()	An energizing crescendo of rising intensity, ideal for charging actions or building anticipation.
burst()	The tension-and-release of a sneeze, imitates the involuntary build and explosion.
buzz()	An unmistakable hard rejection, suited for critical errors, access denied, or blocked actions.
cadence()	A natural two-beat rhythm with a subtle textural shift, suitable for double-tap confirmations.
cameraShutter()	The satisfying click of capturing a moment, ideal for photo capture or scan confirmation.
canter()	A three-beat rhythm with natural variation, suited for multi-step feedback where each step has character.
cascade()	A long sequence that unwinds from intensity to calm, ideal for complex multi-phase transitions or step-by-step completions.
castanets()	A crisp, decisive pair of sharp taps, ideal for double-confirmation or back-to-back interaction feedback.
catPaw()	A calm, warm pair of taps, ideal for gentle confirmations or soft paired acknowledgements.
charge()	The electric buildup of a countdown, perfect for race starts or any go moment.
chime()	A warm, friendly double-tap, ideal for incoming messages or chat notifications.
chip()	Sharp, authoritative, and precise, suited for confirmations that demand clarity and definition.
chirp()	Light-hearted and cheerful, ideal for positive micro-interactions or small wins.
clamor()	Impossible to ignore, suited for critical warnings, emergency alerts, or safety-critical states.
clasp()	The satisfying snap of acquiring a target, ideal for lock-on, cursor snap-to, or radar acquisition.
cleave()	Signals an irreversible, high-stakes action for deletes, removes, or anything the user cannot undo.
coil()	Rising tension that releases into certainty, ideal for long-press activation or charge-complete feedback.
coinDrop()	A playful cascade of coins, ideal for reward moments, payment confirmations, or in-app purchases.
combinationLock()	The ritual of cracking a code, ideal for combination inputs or multi-step secure unlocking.
crescendo()	A rising build that peaks with energy, ideal for charge-up moments or building anticipation.
dewdrop()	A quiet confirmation of success, ideal for operations that completed without needing attention.
dirge()	Heavy and fading like a dying heartache, best for conveying grief, loss, or deep sorrow.
dissolve()	A gentle, soothing fade, ideal for calm relief after a mild challenge or successful low-stakes action.
dogBark()	Two forceful low bursts like a sharp bark, ideal for alert sounds or short punchy notification moments.
drone()	Flat and going nowhere, communicates idle waiting, disengagement, or nothing happening.
engineRev()	The thrill of revving to full throttle, ideal for racing games or mechanical acceleration feedback.
exhale()	Tension releasing into calm, ideal for completing a stressful task or resolving an error.
explosion()	A catastrophic detonation that echoes into rumble, ideal for game destruction events or dramatic impacts.
fadeOut()	A graceful drift toward silence, ideal for dismissals or transitions that should feel calm and natural.
fanfare()	A short burst of triumph, ideal for achievement unlocked, rank-ups, or moments that deserve a cheer.
feather()	A gentle, non-disruptive nudge, ideal for low-priority reminders.
finale()	A countdown that closes with emphasis, ideal for timer completions or countdown-finished alerts.
fingerDrum()	Three casual, even taps, ideal for low-key acknowledgements or non-urgent rhythm patterns.
firecracker()	Two maximum-force strikes demanding immediate response, suited for urgent double-confirmations or critical alerts.
fizz()	Bubbling with joy, ideal for success celebrations or upbeat positive feedback.
flare()	A mind-blowing jolt, ideal for overwhelming surprise or impossible-to-believe reveals.
flick()	A light, quick tap with minimal presence, ideal for chips, tags, and filters.
flinch()	A shock to the senses, ideal for unexpected alerts or startling reveals.
flourish()	Triumphant and expansive, ideal for achievement unlocked or major task completions.
flurry()	The thrill of a combo streak, ideal for hit combos, chain multipliers, or rapid-fire scoring.
flush()	The involuntary heave of disgust, ideal for aversion reactions or gross-out moments in playful UI contexts.
gallop()	A natural four-beat rhythm, suited for multi-step processes or organic rhythmic feedback.
gavel()	Two weighty, deliberate taps, suited for decisive double-step actions or bold acknowledgement feedback.
glitch()	The haptic feel of a system glitching, ideal for data corruption, errors, or intentional glitch aesthetics.
guitarStrum()	A rich, resonant strike that lingers, ideal for musical interactions or warm confirmation moments.
hail()	An unpredictable, relentless barrage, ideal for weather events or disorienting overload feedback.
hammer()	The insistent urgency of a fist on a door, ideal for forceful alerts or escalating persistent notifications.
heartbeat()	The familiar lub-dub of life and tension, perfect for health apps or anxious waiting moments.
herald()	Two gentle knocks building to a decisive third, ideal for staged confirmations with a clear conclusion.
hoofBeat()	Two warm, grounded taps, ideal for mellow double confirmations or soft paired feedback.
ignition()	Three beats that sharpen with each hit, ideal for staged confirmations or escalating emphasis.
impact()	The instant punch of impact, perfect for collision events or taking a hit in games.
jolt()	The most intense hit possible, suited for critical alerts or any moment that demands absolute impact.
keyboardMechanical()	The satisfying two-stage snap of a mechanical key, great for precision typing or keyboard simulations.
keyboardMembrane()	A soft, muffled press, best for simulating the quiet feel of a membrane keyboard.
knell()	A commanding last-chance signal, ideal for final reminders or deadline-critical alerts.
knock()	A polite knock announcing arrival, ideal for gentle attention requests or non-urgent presence alerts.
lament()	The sinking finality of defeat, captures the deflating feeling of a game-over moment.
latch()	The clear feel of something switching off, communicates deactivation or opting out.
lighthouse()	Steady and bias-free, suitable for neutral status updates or steady-state notifications.
lilt()	Warm and personal, ideal for direct messages or social notifications from people you know.
lock()	The satisfying click of locking into place, ideal for locking, latching, or secure-confirmation interactions.
lope()	A galloping bounce with swagger, ideal for adventurous or playful UI moments.
march()	Like an encouraging pat on the back, ideal for motivational confirmations or achievement feedback.
metronome()	Balanced and unemotional, ideal for neutral confirmations, pagination steps, or generic two-step feedback.
murmur()	Two soft, quiet taps, ideal for subtle double-step interactions or unobtrusive confirmations.
nudge()	A polite, unobtrusive double tap that announces a notification without being intrusive.
passingCar()	The whoosh of something passing at speed, ideal for vehicle pass-by or motion-blur effects.
patter()	Three mild, unforced taps, ideal for low-key acknowledgements or non-urgent triple feedback.
peal()	Firm and measured, conveys that something needs attention soon without triggering panic.
peck()	An ultra-short, precise tap, perfect for small icon buttons.
pendulum()	A rhythmic swing that gradually settles, ideal for winding-down moments or calm settling effects.
ping()	A precise, definitive click, ideal for list selections or any interaction where clarity of choice matters.
pip()	A light, sparkling burst, ideal for in-game collectibles or power-up feedback.
piston()	Two forceful, immediate strikes, ideal for commanding double-confirmations or high-energy paired actions.
plink()	A neutral heads-up suited as a baseline for informational notifications.
plummet()	The terrifying pause before impact, ideal for drop effects or dramatic collision moments.
plunk()	Understated but present, suitable for subdued feedback that still has noticeable weight.
poke()	Someone specifically called your name, ideal for mentions, tags, or direct-attention notifications.
pound()	Impossible to ignore, ideal for critical alerts or notifications that cannot wait.
powerDown()	A steady deceleration to silence, communicates shutdown, power-off, or deactivation.
propel()	A confident forward push communicating that a form or action has been decisively submitted.
pulse()	A gentle, steady pulse that quietly signals ongoing activity without demanding attention.
pummel()	Escalating rage that peaks at full force, suited for blocked actions, critical failures, or frustrated moments.
push()	A quieter click that supports without competing, ideal for secondary actions.
radar()	The focused sweep of active scanning, ideal for network requests or polling states.
rain()	Soft and unpredictable, ideal for ambient atmospheric effects or organic ambient notifications.
ramp()	The joy of growing stronger, ideal for level-up moments or rank promotion celebrations.
rap()	A clean double-knock that announces an alert quietly, ideal for non-urgent in-app notifications.
ratchet()	A firm, assertive triple beat, suited for strong confirmations or emphatic acknowledgements.
rebound()	A strong opening that softens on the second hit, ideal for double-tap confirmations.
ripple()	A strong hit that radiates outward in softening waves, ideal for touch ripples or impact echo effects.
rivet()	Three sharp, assertive beats, suited for triple-step confirmations or high-confidence feedback.
rustle()	A gentle heads-up that does not demand immediate action, ideal for mild warnings.
shockwave()	The pressure wave of a nearby explosion, ideal for detonations, force fields, or dramatic impacts.
snap()	A firm snap that conveys a locked-in selection, perfect for toggles, switches, or confirming a choice.
sonar()	The eureka moment, ideal for conveying the satisfying rush of finding what you were looking for.
spark()	The snap of electric ignition, ideal for discharge effects, ignition moments, or quick-fire activation.
spin()	A crisp, mechanical rhythm communicating repeating progress, great for looping or spinner states.
stagger()	Woozy and disorienting, ideal for confusion, error overload, or hit-stun effects.
stamp()	Calm and decisive, communicates acceptance without drama, suited for dialog confirmations.
stampede()	Four deep, measured thumps, suited for grounded step-by-step confirmation feedback.
stomp()	Three deep, grounded beats, suitable for unhurried triple confirmations or calm rhythmic emphasis.
stoneSkip()	Three firm taps with a softening finish, suited for decisive but composed triple confirmations.
strike()	A confident, decisive strike that delivers a clear and satisfying response for the main call-to-action.
summon()	A commanding signal that refuses to be ignored, ideal for incoming calls or urgent attention-demand moments.
surge()	An irrepressible swell of delight, ideal for reaction moments or expressions of pure joy.
sway()	Reassuring and rhythmic, ideal for calming or encouraging feedback.
sweep()	The rhythmic pulse of active searching, ideal for search operations or background polling states.
swell()	A patient nudge that quietly escalates, ideal for reminders that build attention without anxiety.
syncopate()	A lively three-beat rhythm with mixed texture, ideal for multi-step confirmations or animated feedback.
throb()	An accelerated heartbeat that signals something is wrong, ideal for pre-danger tension or warning states.
thud()	A soft, warm acknowledgement, ideal for opening a menu or drawer.
thump()	Confident and present without being harsh, useful for bold feedback that avoids aggression.
thunder()	The raw power of a thunderstorm, ideal for dramatic reveals or moments of overwhelming force.
thunderRoll()	A dramatic arc of mounting intensity, ideal for thunderstorm effects or climactic UI transitions.
tickTock()	The steady pulse of time, ideal for timing feedback, countdowns, or metronome-style interactions.
tidalSurge()	Two waves of escalating intensity, suited for compound actions or impactful paired confirmations.
tideSwell()	A long wave-like arc that rises and falls, ideal for extended ambient effects or fluid UI transitions.
tremor()	Pure, heavy rumble with no sharpness, ideal for seismic events or maximum-weight impact simulations.
trigger()	The decisive moment of release, ideal for weapon discharge, trigger confirmation, or releasing a charged gesture.
triumph()	Pure triumph, conveys the overwhelming joy of a major win or achievement.
trumpet()	A joyful flourish that peaks in triumph, ideal for celebrations or milestone completions.
typewriter()	The nostalgic thud of a vintage typewriter, perfect for retro keyboard or analog-feel experiences.
unfurl()	The unmistakable thrill of discovery, evoking the iconic joy of opening a treasure chest.
vortex()	An irresistible pull into the unknown, ideal for drain animations or dramatic disappearing transitions.
wane()	A lazy, dismissive fade, fitting for sarcastic or indifferent UI moments.
warDrum()	Three steady drum-like beats, ideal for grounded triple confirmations or structured repetitive feedback.
waterfall()	A rush of energy that spills and softens, ideal for clearing actions or flowing state transitions.
wave()	Gentle and non-interrupting, communicates ongoing activity without breaking the user's focus.
wisp()	A barely-there touch, best for ghost or outline buttons that should feel subtle and unobtrusive.
wobble()	A gentle correction without alarm, ideal for minor validation errors or soft negative feedback.
woodpecker()	Mechanical and relentless, ideal for repetitive automated sequences where precision is key.
zipper()	The familiar drag and snap of a zipper closing, ideal for closure interactions or drawer animations.
Show less
Example

import { Presets } from 'react-native-pulsar';

Presets.hammer();

System presets
Common system presets
Platform-specific haptic feedback styles, common across iOS and Android.

Method	Description
impactHeavy()	UIImpactFeedbackGenerator.heavy
impactLight()	UIImpactFeedbackGenerator.light
impactMedium()	UIImpactFeedbackGenerator.medium
impactRigid()	UIImpactFeedbackGenerator.rigid
impactSoft()	UIImpactFeedbackGenerator.soft
Show 4 more
Example

import { Presets } from 'react-native-pulsar';
import { Gesture } from 'react-native-gesture-handler';

const tap = Gesture.Tap().onEnd(() => {
  Presets.System.impactMedium();
});

Android-specific system presets
Additional system haptic feedback styles that are only available on Android.

Method	Description
calendarDate()	HapticFeedbackConstants.CALENDAR_DATE
clockTick()	HapticFeedbackConstants.CLOCK_TICK
confirm()	HapticFeedbackConstants.CONFIRM
contextClick()	HapticFeedbackConstants.CONTEXT_CLICK
dragCrossing()	HapticFeedbackConstants.DRAG_CROSSING
Show 32 more
Example

import { Presets } from 'react-native-pulsar';

Presets.System.Android.primitiveLowTick();

usePatternComposer
A React hook for composing and playing a custom Pattern. The pattern is parsed on mount and whenever it changes. Resources are released automatically on unmount.

const { play, parse, isParsed } = usePatternComposer(pattern);

Parameters
pattern (optional)
Type: Pattern

A haptic pattern to parse on mount. When provided, the pattern is parsed automatically and re-parsed whenever the value changes. Resources are released on unmount.

Returns
play()
Plays the parsed pattern.

stop()
Stops the active pattern.

parse(pattern: Pattern)
Parses and replaces the current pattern.

isParsed()
Returns true if a pattern has been parsed and is ready to play.

Example
import { usePatternComposer } from 'react-native-pulsar';
import { Gesture } from 'react-native-gesture-handler';

const pattern = {
  discretePattern: [
    { time: 0, amplitude: 1, frequency: 0.5 },
    { time: 100, amplitude: 0.5, frequency: 0.5 },
  ],
  continuousPattern: {
    amplitude: [
      { time: 0, value: 0 },
      { time: 200, value: 1 },
      { time: 400, value: 0 },
    ],
    frequency: [
      { time: 0, value: 0.3 },
      { time: 400, value: 0.8 },
    ],
  },
};

function MyComponent() {
  const composer = usePatternComposer(pattern);

  const tap = Gesture.Tap().onEnd(() => {
    composer.play();
  });

  return <GestureDetector gesture={tap}>...</GestureDetector>;
}

useRealtimeComposer
A React hook for real-time haptic control. Provides live amplitude and frequency modulation, useful for gesture-driven or continuously evolving haptic experiences. Haptics stop automatically on unmount.

const { set, playDiscrete, stop, isActive } = useRealtimeComposer();

Parameters
useRealtimeComposer doesn’t take any parameters.

Returns
set(amplitude: number, frequency: number)
Updates the ongoing haptic with new amplitude and frequency values.

playDiscrete(amplitude: number, frequency: number)
Plays a single discrete haptic event.

stop()
Stops the active haptic.

isActive()
Returns true if a haptic is currently playing.

Example
import { useRealtimeComposer } from 'react-native-pulsar';
import { Gesture } from 'react-native-gesture-handler';

function MyComponent() {
  const realtime = useRealtimeComposer();

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const amplitude = Math.min(Math.abs(e.velocityY) / 1000, 1);
      realtime.set(amplitude, 0.5);
    })
    .onEnd(() => {
      realtime.stop();
    });

  return <GestureDetector gesture={pan}>...</GestureDetector>;
}

useAdaptiveHaptics
A React hook that plays haptics from a cross-platform AdaptivePreset. It automatically selects the correct configuration for the current platform (iOS or Android). Each platform can provide either a custom Pattern or a native preset function.

const { play } = useAdaptiveHaptics(preset: AdaptivePreset);

Parameters
preset: AdaptivePreset
An object with ios and android keys. Each value is either a Pattern object or a function that triggers a native preset directly.

type AdaptivePresetConfig = (() => void) | Pattern;

type AdaptivePreset = {
  ios: AdaptivePresetConfig;
  android: AdaptivePresetConfig;
};

Returns
play()
Plays the haptic for the current platform. If the platform config is a function, it is called directly. If it is a Pattern, it is played via the pattern composer.

Example
import { useAdaptiveHaptics, Presets } from 'react-native-pulsar';

const adaptivePreset = {
  ios: Presets.Success,      // native iOS preset function
  android: {                 // custom pattern for Android
    discretePattern: [
      { time: 0, amplitude: 1, frequency: 0.5 },
      { time: 150, amplitude: 0.6, frequency: 0.4 },
    ],
    continuousPattern: {
      amplitude: [],
      frequency: [],
    },
  },
};

function MyComponent() {
  const haptics = useAdaptiveHaptics(adaptivePreset);

  return (
    <Button onPress={haptics.play} title="Tap me" />
  );
}

Settings
Global configuration for the Pulsar SDK. All methods are available on the Settings object.

import { Settings } from 'react-native-pulsar';

Method	Description
Settings.enableHaptics(state: boolean)	Enable or disable all haptic feedback
Settings.enableSound(state: boolean)	Enable or disable audio simulation
Settings.enableCache(state: boolean)	Enable or disable preset caching
Settings.clearCache()	Clear the preset cache
Settings.preloadPresets(presetNames: string[])	Preload presets by name for faster playback
Settings.stopHaptics()	Stop all currently playing haptics
Settings.shutDownEngine()	Shut down the haptic engine
Settings.getHapticsSupportLevel()	Returns the device’s HapticSupport level
Settings.forceHapticsSupportLevel(level)	(Android only) Override the detected support level. Intended for testing/debugging fallback behavior.
Settings.enableImpulseCompositionMode(state: boolean)	(Android only) Enable or disable impulse composition mode
Settings.setRealtimeComposerStrategy(strategy)	(Android only) Set the strategy used by the realtime composer
Example
import { Settings } from 'react-native-pulsar';

// Preload frequently used presets
Settings.preloadPresets(['Fanfare', 'Explosion', 'Heartbeat']);

// Disable haptics temporarily
Settings.enableHaptics(false);

// Check device support
const support = Settings.getHapticsSupportLevel();

HapticSupport
The haptic capability level of the current device, returned by Settings.getHapticsSupportLevel().

import { HapticSupport } from 'react-native-pulsar';

enum HapticSupport {
  NO_SUPPORT = 0,
  LIMITED_SUPPORT = 1,
  STANDARD_SUPPORT = 2,
  ADVANCED_SUPPORT = 3,
}

On Android, Settings.forceHapticsSupportLevel(level) uses these exact numeric enum values when selecting the fallback path. If you force a mode while validating custom patterns, make sure you pass the exported HapticSupport enum rather than app-local aliases.

Example
import { Settings, HapticSupport, Presets } from 'react-native-pulsar';

const support = Settings.getHapticsSupportLevel();

if (support >= HapticSupport.STANDARD_SUPPORT) {
  Presets.dogBark();
}

Types
Pattern
Describes a complete haptic pattern with discrete pulses and continuous envelope curves.

type Pattern = {
  discretePattern: Array<{
    time: number; // Milliseconds from pattern start
    amplitude: number; // Intensity (0-1)
    frequency: number; // Sharpness (0-1)
  }>;
  continuousPattern: {
    amplitude: Array<{
      time: number; // Milliseconds from pattern start
      value: number; // Amplitude value (0-1)
    }>;
    frequency: Array<{
      time: number; // Milliseconds from pattern start
      value: number; // Frequency value (0-1)
    }>;
  };
};

Use discretePattern for distinct taps and impacts. Use continuousPattern envelopes to shape a sustained haptic over time.

HapticSupport
enum HapticSupport {
  NO_SUPPORT = 0,
  LIMITED_SUPPORT = 1,
  STANDARD_SUPPORT = 2,
  ADVANCED_SUPPORT = 3,
}

RealtimeComposerStrategy
Android-only. Controls how useRealtimeComposer simulates continuous haptics, since Android has no native continuous haptic API. Pass one of these values to Settings.setRealtimeComposerStrategy().

import { RealtimeComposerStrategy } from 'react-native-pulsar';

enum RealtimeComposerStrategy {
  ENVELOPE = 0,
  PRIMITIVE_TICK = 1,
  PRIMITIVE_COMPLEX = 2,
  ENVELOPE_WITH_DISCRETE_PRIMITIVES = 3,
}

Value	Description
ENVELOPE	Approximation based on the Envelope API. Allows control over amplitude and frequency, but the signal oscillates and can be unstable. Available on Android API 36+.
PRIMITIVE_TICK	Approximation using the Composition API TICK primitive at varying intervals. Amplitude is controllable; frequency is simulated by the timing between ticks. Signal is discrete rather than continuous.
PRIMITIVE_COMPLEX	Similar to PRIMITIVE_TICK, but uses multiple primitives depending on the requested frequency.
ENVELOPE_WITH_DISCRETE_PRIMITIVES	Default. Hybrid strategy. Uses the Envelope API for continuous events (API 36+) and composition primitives for discrete events (API 33+). Best of both worlds when both event types are used.
Example

import { Settings, RealtimeComposerStrategy } from 'react-native-pulsar';

Settings.setRealtimeComposerStrategy(RealtimeComposerStrategy.PRIMITIVE_COMPLEX);




### Some Articles that talk about haptics

* 1

Haptics Is Music: How to Design Haptic Patterns That Feel Right
Krzysztof Piaskowy
Krzysztof Piaskowy
•
Apr 23, 2026
•
5 min read
Sound is air vibrating, touch is skin vibrating. The same physical phenomenon, two different channels of perception. It’s not a metaphor, but literally the same mechanism, with just a different membrane receiving it.

I never used to think haptics was important — until I experienced ones that fit perfectly with an app's visual design. It completely changed how I think about it. I went from feeling like I'd never have time to focus on haptics, to realizing just how important and beneficial it is

That shift — from treating haptics as an afterthought to treating it as a design layer — is something I’d like to cover in this article. And the fastest way to make that shift is to stop thinking about vibrations and start thinking about… music.

What haptics and music actually share
If you look at music, it's not just about melody. Rhythm and timing carry a lot of the emotional weight. A fast pattern feels urgent, a slow one feels calm, and sudden pause can hit harder than any note.

Research backs this up: a 2022 study published in Scientific Reports found that the perception of rhythm is genuinely shared between hearing and touch. The detection thresholds for rhythmic gradients are the same across both modalities. Your brain processes them through the same mechanism, just via different input.

That's good news, but there's also something else.

A speaker operates across 20 Hz to 20,000 Hz. The haptic engine in your phone works in a much narrower band — roughly 80 to 300 Hz, where Pacinian receptors dominate. Below that range (16–32 Hz), vibrations produce a “flutter” sensation — a series of distinct rhythmic beats. Above it, it becomes a continuous vibration. As you see, very different feelings, very little room to maneuver between them.

The metal mass inside an LRA motor has inertia, so you can't bend it like a guitar string. Smooth glissandos, complex chords, rich harmonic texture — none of that translates. Unfortunately, the physical constraints are real.

So what does translate? Rhythm, tempo, dynamics, silence. These are the tools you actually have.

Designing haptic patterns: what translates from music
Rhythm is timing and gaps between impulses. Regular patterns feel safe and confirming, while syncopated or irregular ones introduce surprise, energy — or signal that something went wrong. A success confirmation is typically a clean double pulse, but an error is faster, less even. You feel the difference before you process it.

Tempo is how quickly a sequence plays out. Fast patterns read as urgent — an incoming call, a critical alert, but slow patterns signal resolution — a timer completing, a long process finishing. It mirrors how the nervous system responds to auditory tempo through entrainment, the process by which rhythm synchronizes physiological response.

Dynamics — crescendo and diminuendo — work in haptics as changes in intensity over time. EEG research has shown that haptic patterns with adaptive intensity and rhythm are significantly more effective at evoking emotion than flat, constant vibration. Pull-to-refresh is a good example in the wild: the feedback builds as you pull, then releases. That arc means something, it mirrors the action.

Articulation maps to the perceived hardness of the impulse. A sharp impulse produces a distinct click, while a soft one feels ambient, subtle, harder to isolate. Sharp = confirmation, click, decision point. Soft = background, ambient, secondary feedback.

Silence is not the absence of haptics. In music, a pause is a compositional element — it creates tension, marks transitions, gives weight to what comes before and after. The same applies here — the gap between two pulses is part of the pattern.

Principles for designing haptic feedback that feels right
A few notes that follow from all of this:

Design the pause, not just the pulse
The spacing between impulses is often what determines whether a pattern reads as success or error. Two pulses close together feel like urgency, but the same two pulses with a longer gap between them feel like resolution. Same hardware with a completely different meaning.

Match intensity to stakes
In music, fortissimo loses its power if you use it on every note. The same is true here. Reserve strong feedback for high-stakes moments — payments, irreversible actions, critical alerts. If everything vibrates equally, nothing stands out.

Think in sequences, not single buzzes
A single impulse is a sound, a sequence is a sentence. The pattern is what carries meaning — the number of pulses, the rhythm, the spacing, the intensity arc. One buzz tells the user nothing, but a composed sequence tells them exactly what happened.

Congruence matters more than you think
When haptics, sound, and animation disagree, users feel friction — even if they can't name why. When they work together, the experience feels polished and trustworthy. This is the multisensory equivalent of visual consistency. 

Test on the device
This sounds obvious, but it isn't: an LRA in an iPhone 15 is a different experience from the motor in a mid-range Android. Patterns that feel precise and satisfying on one device can feel muddy or weak on another. There's no substitute for feeling it in your own hands.

You're already a composer
Every developer who's ever added a vibration to an app has made compositional choices — even if they didn't think of it that way. Single buzz or double? Short gap or long? Strong or subtle? Those decisions shape how the interaction feels.

Knowing the vocabulary, importance of duration, frequency and emotions evoked doesn't make it harder, but rather deliberate and smarter.

That's the idea behind Pulsar — a free, open-source haptic library for React Native, Swift, and Kotlin with 150+ ready-to-use presets. You can browse them, preview them with audio in the browser, and test them on your actual device before shipping anything. Bonus point: Pulsar lets you filter haptic variables to find exactly what fits your use case, so composing great haptic experiences is easier than ever. If you want more control, the API lets you build custom patterns from scratch.


* 2

How Haptic Feedback Affects Sales, Trust, and Product Perception
Krzysztof Piaskowy
Krzysztof Piaskowy
•
May 14, 2026
•
7 min read
Many app creators don’t even think of haptics as a UX layer at all, and only add it at the end of an interaction if there’s time left.

The data tells a different story – one that proves that haptics are often underestimated and neglected, while being an impactful business factor. Vibration patterns in mobile apps affect how much users buy and how trustworthy a product feels. Actually, it impacts more business-related decisions than you probably can expect. If you're deciding where to invest development time, these facts are worth knowing before the next planning cycle.

Not familiar with how haptic feedback works?
We covered the basics – the hardware, the APIs, and why it's in every modern smartphone.

How haptic feedback affects the brain
Firstly, let’s look at the mechanism – because it explains why the effects are as consistent as they are.

Mobile vibrations work as a secondary reward. Your brain learns to associate a specific vibration with a specific outcome, and over time it starts to anticipate it. Hampton & Hildebrand found that the optimal timing for triggering a positive reward response is around 400 ms – not too short to register, but not long enough to feel intrusive. Both extremes reduce the effect. In the same study, users in the vibration condition outperformed those receiving audio feedback, who in turn outperformed those receiving only visual feedback. The effect held across different types of interactions. In short: the more physical the feedback, the stronger the effect.

This is why a well-timed buzz feels satisfying in a way that's hard to put into words – touch signals reach the primary somatosensory cortex within milliseconds. It's a learned response – and once users are conditioned to expect it, its absence is immediately noticeable. That conditioning is already happening. Every app that gets haptics right is raising the bar for every app that doesn't.

How haptic feedback affects sales
Researchers have also measured what happens when you add vibration feedback to a shopping app. Users with haptic feedback added on average 1.5 more items per order to their final basket than those in the visual-only condition – and more than those who received audio feedback. Average basket totals were higher too.

The mechanism behind it looks like this: haptics reinforce the sense that an action succeeded. That feeling of completion, “it worked”, reduces hesitation and drives the next tap – it’s strongly connected to dopamine rush. That’s the difference between a checkout flow that feels solid and one that feels like you're not sure if it registered. In high-friction moments like payments or form submissions, that difference really matters.

A recent study found that haptic feedback in AR shopping apps increases trust in the retailer and purchase intent – particularly among users with a high need for tactile interaction. The pattern is consistent: feedback that confirms an action has completed makes users more willing to take the next one.

There's another dimension to this. Online shopping can feel impersonal – a transaction without a human on the other side. A study published in the Journal of Consumer Research found that haptic feedback increases the sense of social presence in digital interactions, making what would otherwise feel like an impersonal exchange feel more natural and human. Users perform better on tasks when haptic feedback is present, and the mechanism is exactly this: the interaction feels less like talking to a machine.

How haptic feedback shapes product perception
The effect of haptic feedback extends beyond completing a transaction.

A study published in Psychology & Marketing found that vibrotactile feedback in mobile shopping apps increases anticipated satisfaction with a purchase. The mechanism is specific: vibration creates a sense of control over the product during the interaction, which translates into a stronger feeling of ownership – and higher expected satisfaction with the outcome.

Racat’s research points in the same direction: haptic feedback in AR shopping apps increases trust in the retailer and perceived usefulness of the app, particularly among users with a high need for tactile interaction.

Both articles point to the same underlying dynamic: an interaction that feels physical and confirmed leaves users feeling better about what they just did – and about the product they're doing it with.
 

Designing great haptic feedback doesn’t have to start from scratch.
Meet Pulsar – a free, open-source haptics library for React Native, Swift, Kotlin, Kotlin Multiplatform, and Flutter. 150+ ready-to-use presets, Live Preview for testing on a real device, and a custom API for custom patterns, already waiting for you to try in our composer.

How haptic feedback reduces errors
There's also a less obvious business case for haptics – one that shows up in error rates. A study from the IEEE World Haptics Conference found that haptics keyclick feedback on touchscreen keyboards increased typing speed and reduced error rates across all tested feedback conditions. Notably, audio feedback alone wasn't as effective – haptics outperformed it on every measure.

What’s also important, better feedback helps users interact more accurately. Fewer errors means less frustration and more completed flows. In any app where users are entering data – forms, payments, search, authentication – this is a conversion argument as much as a UX one. The feedback confirms each action as it happens, which keeps users moving forward instead of second-guessing themselves.

This extends beyond keyboards. Rhonda Hadi and Ana Valenzuela found that haptic alerts improve consumer performance on related tasks. The effect is driven by an increased sense of social presence. Without haptic feedback, digital interactions can feel impersonal and detached. With it, users are more engaged and less likely to disengage mid-task.

There's also a less obvious thing – one that shows haptics as a tool for responsible design. Digital payments have removed the physical act of handing over money, which research suggests reduces the psychological “pain of payment” and leads to overspending. A 2021 study found that adding low-intensity vibration feedback at the moment of payment partially restores that sense of loss and reduces willingness to overspend. For banking and fintech apps, that's a different kind of argument for haptics – a nudge toward more responsible financial behavior.

How haptic feedback expands your audience
Wide accessibility tends to appear in product conversations as a compliance checkbox. The more useful question is: who are you leaving out without it?

For users with visual or hearing impairments, haptic feedback is often one of the primary information channels. A scoping review covering 28 studies found haptic technology to be an effective navigation tool for blind and low-vision users. A systematic review spanning two decades of HCI research confirms haptics assistive tools support navigation, graphical understanding, and education for this group. For users with motor impairments, research shows haptic feedback consistently improves task performance and completion times.

The European Accessibility Act and WCAG guidelines are already pushing multi-modal feedback toward a baseline standard. Getting ahead of that now is easier than retrofitting it later – and it opens the product to user groups who otherwise can't use it fully.

The business and accessibility cases point to the same conclusion: haptic feedback is becoming a fundamental layer of inclusive digital products.

Where the haptics market is heading
According to Market Research Future's industry forecast, the haptics interface market is projected to exceed $100 billion by 2035, at a 32% annual growth rate. That number reflects where hardware investment, platform development, and user expectations are all moving – and they’re moving in the same direction, at the same time.

Apple and Google built haptics into the core of their design systems for exactly this reason: users notice the absence before they notice the presence. That baseline expectation is already set. The question for any product team is whether they're meeting it or falling behind it.

Where to go from here?
As you see, the argument for investing in haptic feedback is something more than “it feels nice”. When it's done well, users buy more, stay longer, make fewer errors, and trust the product more. The research points consistently in one direction across e-commerce, advertising, and accessibility.

Implementation used to be a multi-sprint project, but with our haptics library, it’s not anymore. Pulsar is free and tailored to React Native, Swift, Kotlin, Kotlin Multiplatform and Flutter. It contains 150+ ready-to-use presets, a Live Preview feature for testing on a real device before shipping anything, and an API for custom patterns if you need more control.