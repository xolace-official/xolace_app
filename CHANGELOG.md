# Changelog

All notable changes to Xolace are documented here.

---

## [1.3.0.0] - OTA Update (2026-05-22)

### Added

- **Daily quotes** — a personalized AI-generated quote delivered each day, distilled from your session patterns without ever reading raw input; privacy-first with idempotency checks and separate curated/session-derived paths
- **Quote reactions** — heart-burst reaction on your daily quote
- **Quote sharing** — share quotes as a polished card (glass effect, gradient, campfire mascot, theme-aware palette) via native share sheet; supports image save and SMS
- **Weekly quote notifications** — scheduled push notifications surface your weekly quote at the right moment
- **Session-end notification nudge** — lightweight prompt at session end to enable notifications so quotes land reliably
- **Quote preference setup** — onboarding sheet to configure quote delivery preferences
- **Mirror tone tracking** — tone is tracked across the session and displayed as a badge on the mirror; "witnessed" added as a new mirror tone
- **"Witnessed" TTS voice** — dedicated read-aloud voice for the witnessed mirror tone

- **Android haptics** — Android now has full premium haptic feedback via `react-native-pulsar`. Previously Android had no haptics (expo-haptics was a no-op on the devices we support); every emotional moment in the app now has a distinct, intentional feel on both platforms
- **Haptic identity across 13+ moments** — each key interaction has a unique pattern: mirror arrival (`herald` — 3-beat crescendo), session complete (`bloom`), processing breath (`breath`), form submit (`propel`), error state (`wobble`), escalation/crisis mount (`peal`), peer reflections mount (`murmur`), quote reactions differentiated (`chirp` for resonates, `wane` for not today), per-mood session-end feedback (`chirp`/`plink`/`plunk`/`murmur`), anonymous contribution confirmation (`dewdrop`), carousel slide advance (`flick`), theme selection (`sonar`), menu open/close differentiated (`thud`/`flick`)
- **Preset preloading** — 13 frequently-used presets are warmed at app boot so the first haptic on any critical path (mirror arrival, submit) fires without latency
- **Duration-matched breath haptics** — the sit-with-this breathing exercise now uses `usePatternComposer` continuous patterns that swell and release in exact sync with the orb animation (inhale: 0.35→1.0 over 3–4 s, exhale: 1.0→0.0 over 6–8 s) instead of single-shot preset approximations

### Changed

- `react-native-pulsar` replaces `expo-haptics` as the Android/web haptic layer; iOS continues to use CoreHaptics for non-breath patterns

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
