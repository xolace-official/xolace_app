# Changelog

All notable changes to Xolace are documented here.

---

## [1.2.0.0] - 2026-05-15

### Added

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
