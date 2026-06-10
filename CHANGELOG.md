# Changelog

All notable changes to Xolace are documented here.

---

## [1.4.0.1] - OTA Update (2026-06-10)

### Added

- **`mood_unsure` feedback** — contextual bottom sheet appears when a user taps "unsure" on the session-end mood check (throttled to once per 24 h). Four option cards: "Felt okay while here", "Still processing", "Too many things at once", and "Something else" with optional free text (max 300 chars). Backend: new `canAskUnsureContextual` query and `mood_unsure` type added to the `feedback` table and `submit` mutation.
- **Unified update bottom sheet** — new `UpdateBottomSheet` component replaces native `Alert.alert()` for both OTA-ready and new-store-version prompts. Both modes share one sheet with copy tuned to the context ("Refresh Now" for OTA, "Download Now" for store updates) and a dismissible "Later" option.

### Changed

- **`mood_heavier` feedback redesigned as a bottom sheet** — `HeavierFeedbackPrompt` is now driven by a dedicated `FeedbackSheet` bottom sheet with a `FlameIntensitySelector` for expressing intensity level, replacing the previous inline card in the session-end activity variant.
- **Clarify mirror-miss feedback uses option cards** — removed the raw `TextInput` ("What was off? optional") from `ClarifyState`. Mirror-miss feedback now surfaces through a `ClarifyFeedbackCard` tap target that opens a `ClarifyFeedbackSheet` with four predefined options ("Wrong emotion", "Too surface level", "Close but not quite", "Missed the main thing"). `mirror_miss` submissions now require `selectedOption` rather than free text.
- **`useVersionCheck` / `useOtaUpdate` refactored to callbacks** — both hooks now accept `onVersionChecked` / `onUpdateReady` callback props instead of owning their own `Alert` calls. The root layout is now the single owner of update state and drives `UpdateBottomSheet` from there; hooks only signal readiness.
- **Session-end activity CTA migrated to `Button`** — the mood-check continue/skip button in `ActivityVariant` now uses HeroUI Native `Button variant="outline"` instead of a raw `PressableFeedback`.

---

## [1.4.0.0] - (2026-06-01)

### Added

- **Trusted Bridge** — turns what you felt in a session into a message you can actually send to someone who matters. Reachable from a suggested card on the session-end screen. A one-time intro explains the promise and privacy model, then you name who you're writing to (name, relationship, and how you address them); the AI drafts a message shaped around your session's emotional context via Anthropic. You edit the draft inline and share it through the native share sheet, or step away with "Not right now" — nothing sends itself. Privacy-first: recipient details are used only to generate the draft and are never stored. Intro-seen and feature-enabled state persist via Zustand; PostHog captures bridge open/dismiss and share events.

### Changed

- **React Compiler memoization cleanup** — removed all manual `useMemo`, `useCallback`, and `memo()` calls used purely for performance across ~45 files; the React Compiler (`reactCompiler: true`) handles memoization automatically via `useMemoCache`. Retained intentional exceptions: context provider `value` objects, `useCallback` on `useEffect` deps, and `memo()` on components with `"use no memo"` directives. ESLint rules `react-perf/jsx-no-new-object-as-prop` and `react-perf/jsx-no-new-array-as-prop` disabled as false positives under the compiler.
- **Reanimated shared value API migration** — migrated all `.value` reads and writes on Reanimated shared values to the React Compiler-compatible `.get()` / `.set()` API across 19 files (`auth-bg`, `animated-row`, `menu-buttons`, `menu-trigger`, `ember-orb`, `mood-card`, `mood-marquee`, `paths-preview`, `peers-preview`, `reflect-preview`, `share-preview`, `circle-progress`, `quotes-screen`, `breathing-orb`, `mic-button`, `contributed-confirmation`, `paced-orb`, `haptic-beat`, `use-menu-state`). Menu toggle uses functional setter `(prev) => !prev` for atomic UI-thread read-compute-write.
- **Dialog state reset pattern** — `SpaceNameDialog` and `FeedbackDialog` now use a mount/unmount inner component pattern (`{isOpen && <Form />}`) instead of `useEffect` to reset form state on open. State initializes from props on mount; no cascading renders.
- **CLAUDE.md best practices** — documented React Compiler memoization rules and Reanimated `.get()`/`.set()` guidance to prevent regressions in future agent sessions.

### Fixed

- **Solo "Done" bounced to home instead of session-end** — the sit-with-this screen was calling `completePath()` before navigating, flipping the session to a terminal state. With no active session, the session-end "no active session" guard fired `router.replace('/')` and bounced the user home. It now defers completion to the session-end screen (matching the peer and exit paths), navigating to `session-end?path=solo&completed=true|false` and threading the finished-vs-exited-early flag through so completion records the correct outcome.
- **Bridge card bounced to home instead of the bridge screen** — `completeAndBridge` completes the session (turning it terminal) and then pushes the trusted-bridge screen; because session-end stays mounted underneath, its "no active session" guard raced and `router.replace('/')`'d on top of the pushed bridge. A latent race since the bridge was added, made deterministic once the bridge screen grew heavier. Fixed by claiming navigation (`navigatedRef.current = true`) before the push, so the guard's `navigateHome()` no-ops.

---

## [1.4.0.0] - (2026-05-29)

### Added

- **Reflect screen tour guide** — a one-time, 4-step popover tour that greets new users on the idle reflect screen. Each step anchors to a key input element: the write area, the mic button, the texture word tags, and the word-set tabs. Steps advance on any tap; a Skip button exits at any point. The tour only starts after the founder welcome sheet is dismissed, so the two never compete. Night Mode users see 3 steps (word-set tabs are hidden at night). Tour completion and skip events are captured in PostHog (`tour_started`, `tour_completed`, `tour_skipped`). State is persisted via Zustand so the tour never repeats. Navigating away mid-tour (e.g. tapping the Help button in the header) auto-dismisses the tour cleanly via a navigation blur listener.

### Fixed

- **Help button in reflect header** — a "Help" button (crisis resources shortcut) now appears in the native stack header on the reflect screen's idle state only; it is invisible in all other states (typing, processing, mirror, etc.). The header is transparent with no visible bar — the button floats at the top-right. Tapping it navigates to the crisis resources screen.

### Changed

- **Session-end close screen** — removed the ambient ember glow circle behind the "Have more? I'm here." and "Done" buttons on both the activity and exit variants; the close phase is now clean and uncluttered.
- **Session-end acknowledge screen** — mascot illustration (`jump-love-bgremove`) now fills the upper space of the acknowledge phase on both the activity and exit variants, replacing the empty void. Text sits below the mascot, bumped to `text-3xl` for more presence. Placeholder for the upcoming looping mascot video (requires a future store release).
- **Session-end offer screen** — title size increased to `text-3xl`; subtitle copy updated to "Someone out there might be carrying something just like this."
- **Contributed confirmation screen** — replaced placeholder with an ember particle animation (7 particles, staggered timing, single `progress` shared value pattern) rising above a soft glow. Message and Done button fade in sequentially.
- **Mirror tone badge** — now reads `toneUsed` from the session record rather than the user's current tone preference setting. The badge reflects the tone that actually generated the mirror, not what the user has set today.

### Fixed

- **White background flash on navigation** — `ThemeProvider` now detects all dark theme variants (`quiet-dark`, `nightly-dark`, `reverie-dark`, etc.) by checking `theme.includes('dark')` instead of strict equality; fixes the white flash when navigating between screens on any non-base dark theme.
- **Push token fetch crash on 503** — `getExpoPushTokenAsync` is now wrapped in a try/catch; a transient Expo service error no longer surfaces as an unhandled promise rejection. The token registers normally on the next launch.

---

## [1.3.0.0] - App Store release (2026-05-22)

### Added

- **Daily quotes** — a personalized AI-generated quote delivered each day, distilled from your session patterns without ever reading raw input; privacy-first with idempotency checks and separate curated/session-derived paths
- **Quote reactions** — heart-burst reaction on your daily quote
- **Quote sharing** — share quotes as a polished card (glass effect, gradient, campfire mascot, theme-aware palette) via native share sheet; supports image save and SMS
- **Weekly quote notifications** — scheduled push notifications surface your weekly quote at the right moment
- **Session-end notification nudge** — lightweight prompt at session end to enable notifications so quotes land reliably
- **Quote preference setup** — onboarding sheet to configure quote delivery preferences
- **Mirror tone tracking** — tone is tracked across the session and displayed as a badge on the mirror; "witnessed" added as a new mirror tone
- **"Witnessed" TTS support** — read-aloud is now available for the witnessed mirror tone using the same voice as the adaptive tone

- **Android haptics** — Android now has full premium haptic feedback via `react-native-pulsar`. Previously Android had no haptics (expo-haptics was a no-op on the devices we support); every emotional moment in the app now has a distinct, intentional feel on both platforms
- **Haptic identity across 13+ moments** — each key interaction has a unique pattern: mirror arrival (`herald` — 3-beat crescendo), session complete (`bloom`), processing breath (`breath`), form submit (`propel`), error state (`wobble`), escalation/crisis mount (`peal`), peer reflections mount (`murmur`), quote reactions differentiated (`chirp` for resonates, `wane` for not today), per-mood session-end feedback (`chirp`/`plink`/`plunk`/`murmur`), anonymous contribution confirmation (`dewdrop`), carousel slide advance (`flick`), theme selection (`sonar`), menu open/close differentiated (`thud`/`flick`)
- **Preset preloading** — 13 frequently-used presets are warmed at app boot so the first haptic on any critical path (mirror arrival, submit) fires without latency
- **Duration-matched breath haptics** — the sit-with-this breathing exercise now uses `usePatternComposer` continuous patterns that swell and release in exact sync with the orb animation (inhale: 0.35→1.0 over 3–4 s, exhale: 1.0→0.0 over 6–8 s) instead of single-shot preset approximations

### Changed

- `react-native-pulsar` replaces `expo-haptics` as the Android/web haptic layer; iOS continues to use CoreHaptics for non-breath patterns
- Updated breathing animation in exercises to be more natural

---

## [1.2.0.0] - OTA Update (2026-05-20)

### Fixed

- **Error state heading** — replaced "Something didn't go as expected." with "Take a breath." across all error types (rate limit, generic, session expired); better fits the app's emotional tone
- **Crisis resources disclaimer** — corrected "BetterHelp cannot vouch…" to "Xolace Inc cannot vouch…"
- **Ghana phone number format** — fixed malformed `2332-444-71279` to correctly split country code as `233-2-444-71279`
- **Founder welcome copy** — "We will love to walk this journey" → "We'd love to walk this journey"; "on" → "at"; added `+233` country code to WhatsApp/SMS number for international users
- **Mirror tone badge colors** — replaced hardcoded Tailwind color classes (`text-purple-400`, etc.) with theme-aware CSS variables (`text-tone-poetic`, etc.); tone colors now adapt correctly across all 6 themes (alpha, quiet, reverie, human, nightly, and base)

---

## [1.2.0.0] - App Store release (2026-05-15)

### Added

- **Crisis resources screen** — standalone "Get Help Now" screen with country-aware emergency numbers and hotlines for 5 countries (Ghana, US, UK, Australia, Canada). Includes a one-tap emergency call button, country selector (bottom sheet), staggered resource list, and a disclaimer footer with a correction email link. All `Linking.openURL` calls are guarded and surface failures via toast.
- **Help button on idle screen** — a quiet warning-palette pill ("Help") in the top-right of the reflect idle state navigates to the crisis resources screen. Uses a lifebuoy SF Symbol. Label is "Help" not "Crisis" to lower the activation threshold.
- **`ResourceItem` shared component** — `src/components/shared/resource-item.tsx` extracted for reuse across crisis screen and escalation state. Handles phone/url/email (tappable with `PressableFeedback`) and text (non-tappable) resource types, with per-index stagger animation.
- **`LSApplicationQueriesSchemes`** — added `tel` and `mailto` to `app.config.ts` iOS infoPlist to ensure `Linking.canOpenURL` works correctly on all iOS versions.

- **Feedback mechanism** — four feedback types to understand where the product is losing users:
  - `general` — "Send feedback" dialog in Settings → Support section; rate-limited to 5 submissions per 24h
  - `mood_heavier` — contextual prompt at session end when user selects "heavier" mood; throttled to once per 24h; three option cards with optional "Something else" free-text field
  - `mirror_miss` — fire-and-forget field in the Clarify state; captures what was off with the AI mirror without blocking the user's flow
  - `gave_up` — fire-and-forget card in the Gave Up state; three options surfacing why the user stopped
- **Feedback Convex backend** — new `feedback` table with `by_profile` and `by_profile_and_type_and_created` indexes; `canAskContextual` and `canSubmitGeneral` queries; `submit` mutation with per-type server-side validation and rate limiting via `@convex-dev/rate-limiter`
- **"Have more? I'm here." link** — now uses accent color at 60% opacity (matching "your timeline") so it reads as interactive without pressure
- **Data lifecycle** — feedback records deleted on data wipe and account deletion

### Changed

- `canSubmitGeneral` uses `@convex-dev/rate-limiter` component (`generalFeedback: fixed window, 5/day`) instead of a manual table scan
- `activity-variant.tsx` wrapped in `ScrollView` to handle heavier feedback prompt without overflow
- `use-reflection-machine.ts` now exposes `turnsCount` for use as `turnIndex` in mirror-miss feedback
- **Animation layer migrated to `react-native-ease`** — replaced `react-native-reanimated` entering/exiting presets (`FadeIn`, `FadeInDown`, `FadeOut`) with declarative `EaseView` across 33 components; covers onboarding, auth, reflect states, sit-with-this, peer-reflection, and session-end screens; exit animations (feedback cards, notification banner, pre-roll card) converted to `visible`/`mounted` state pattern with `onTransitionEnd`

---

## [1.1.0.0] - App Store release (2026-05-12)

### Added

- **Voice input** — speak your reflection instead of typing; voice is transcribed automatically
- **Mirror read-aloud** — after the mirror is delivered, it can be heard in a voice that matches the tone you're in
- **Mirror navigation during clarify** — users can navigate back to the previous mirror while clarifying so they're always working from what was said

### Changed

- **Onboarding rebuilt** — smoother animations and a clearer sense of what Xolace is before logging in
- Bug fixes and polish

---

## [1.0.0.0] - 2026-05-13

Initial release. Core reflect loop, session end, timeline, settings, onboarding, and authentication.
