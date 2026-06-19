# Changelog

All notable changes to Xolace are documented here.

---

## [1.6.0] - (2026-06-19)

### Added

- **Feedback Tray (shake-to-summon)** — a chrome-free way to talk back to us, with zero pixels on any screen until you summon it. Shake your phone anywhere in the app to float up a small tray over whatever you're doing: report a bug or suggest an idea, written into a single form with a bug | idea toggle. The tray is a self-contained surface with its own internal back-stack (menu → form → back) — it never touches app navigation and never routes to a real screen. It rides up with the keyboard, drags down or taps-the-backdrop to dismiss, and reads every color from theme tokens so it looks right across light, dark, and all five color themes. A blurred scrim sits behind it. Critically, the trigger is **state-aware**: a shake is honored in `idle`, on the mirror, and on every secondary screen, but suppressed during active articulation (`typing` / `typing-nudge` / `processing`) so it never interrupts you mid-thought. A one-time toast ("Shake your phone anytime to send feedback") makes it discoverable, then never repeats.
- **What's New** — a "What's new" row in the tray opens a warm, plain-language changelog of recent releases. An accent dot marks the row when there's an update you haven't seen yet; opening the list clears it. OTA updates are tracked with their own stable key (not the store version) so the badge logic stays correct across OTA patches.
- **Profile screen** — a personal, progressively-revealed reflection of your time in the app, reachable from the idle screen. It opens on an aurora-arc header with your name, when you started, and how many moments you've processed. As you accumulate sessions, more unfolds: a stat band (moments, current streak, your usual day), the emotions that show up most for you, and "mirror lines" that read back your mood shift and rhythm. Below an "your insights" divider sit early looks at deeper analytics — a week-intensity chart and the words you reach for — presented as teasers (softly fogged, no padlocks) with a one-tap waitlist to register interest in the full insight layer. Everything is gated by how much you've shared (1 / 3 / 5 sessions), so an empty profile never feels empty — it just shows what's there.

### Changed

- **Expo SDK 56 migration** — upgraded from SDK 55 to **Expo SDK 56**, bringing **React 19.2.3** and **React Native 0.85.3**, with all `expo-*` modules realigned to their SDK 56 versions. Notable companion bumps: `react-native-reanimated` 4.3.1, `react-native-worklets` 0.8.3, `react-native-gesture-handler` 2.31.1, `react-native-screens` 4.25.2, `react-native-safe-area-context` 5.7.0, `react-native-svg` 15.15.4, and `@shopify/react-native-skia` 2.6.2. HeroUI Native styling and the bottom-sheet package were bumped alongside.
- **Settings screen restructure** — settings was reorganized into grouped navigation rows with dedicated sub-screens and custom RadioGroup icons (see the settings-refactor work), tidying the surface ahead of the profile screen linking into it.

### Backend

- **`product_feedback` Convex table** — bug/idea submissions land in a new, dedicated table (kept separate from the emotional `feedback` table so product feedback never pollutes the longitudinal emotional dataset). Each row carries the kind, trimmed/length-bounded text, and structural context (app version, route, theme, platform). Owner scope is derived server-side via `requireAuth` — the client never passes a user id — and submission is rate-limited (`productFeedback`, 10/day per profile) since a shake-summoned form is easy to spam.
- **`insight_waitlist` Convex table** — registers interest when a user taps to unlock a teased insight (intensity history, words/language), so the full insight layer can be prioritized against real demand.

### Analytics

- Structural-only PostHog events (no free-text content): `feedback_tray_opened` (`{ source, route }`), `product_feedback_submitted` (`{ kind }`), and `whats_new_opened`.

---

## [1.5.0] - (2026-06-13)

### Added

- **Voice Vent** — a voice-first release ritual ("I released something real"). Reachable from the idle menu, it opens a full dark screen where you speak something heavy aloud and then watch it burn away. A Skia particle field (80–120 soft glowing particles, rendered on the UI thread) reacts to your voice in real time: ash-gray and still at rest, warming from center outward toward amber as your volume rises. Tapping stop runs a four-beat dissolution — compression inward, a white-amber flash, an uneven outward scatter, then one full second of silence. The dissolution is the emotional peak; only after it does a short 1–2 sentence acknowledgement (the "coda") fade in and speak aloud, before resolving to "Gone." and auto-returning home. A pinch-spread gesture during the burn jumps straight to the explosion — if the user chose to release, it's honored instantly.
- **First-time vent intro** — a sparse, slow version of the particle field behind the promise: "This is a space to say the unsaid. Your voice is never stored. It goes when you close." Gated on a `ventIntroSeen` Zustand toggle (persisted), shown once before the first vent.
- **Vent sound design** — a burning-paper crackle plays at the scatter beat (the emotional payload of the ritual), timed to fire after the compression + flash and entirely after the recorder has stopped, so it never disturbs the metering-driven particles.
- **Mic button states** — a 56–64px circle: a gently pulsing ring at idle, a solid warm-amber ring while recording (icon swaps to a stop square), fading to nothing as the burn begins.
- **Awareness Events** — a campfire-side way to acknowledge what a given month holds (e.g. Men's Mental Health Month). When an event is live, a detached bottom sheet greets the user on the reflect screen: a title, an optional cover image (skeleton placeholder while it loads, graceful fallback if it fails), a scrollable body under a pinned header and footer, and an optional external-link button in the header that opens the full article in an in-app browser. Events can carry an optional CTA (e.g. "Find support") that routes to an allowlisted in-app destination (currently crisis resources). Dismissing offers context-aware copy — "Not right now" when a CTA is present, "I see this" otherwise. The sheet only appears after the founder welcome sheet is dismissed and the reflect screen is focused, so prompts never compete.
- **Event session prompts** — when an event defines a `sessionPrompt`, dismissing the sheet (via any action) seeds the reflect idle screen with that prompt for up to 7 days. The reflect header swaps its headline to the event's prompt and shows an "event pill" (heart icon + event label, e.g. "This month") above the encouragement line — only during the day, and never while a Quiet Return prompt is active, so the two never collide. The prompt clears automatically the moment the user taps to write or after it expires, so it never lingers into an unrelated session.
- **`--event` theme color** — a dedicated rose/magenta "monthly awareness marker" color (`--event` / `--event-foreground`) added to the base light/dark themes and all five color themes (quiet, reverie, human, nightly, alpha), in both variants. Used by the event pill so the marker reads consistently across every theme.
- **`monthlyEvents` Convex table** — privacy-first, team-managed content table with `slug` (immutable seen-tracking key), `title`, `body`, optional `ctaLabel`/`ctaRoute`/`sessionPrompt`/`imageUrl`/`linkUrl`, `startDate`/`endDate` (ISO `YYYY-MM-DD`, compared client-side in local timezone), and `priority`. Indexed `by_slug` and `by_priority`. Reads go through an auth-gated `getActive` query; content is seeded via an idempotent `seed` internal mutation (safe to re-run, skips existing slugs).
- **Seen-event tracking + analytics** — dismissed events are remembered locally in Zustand (`seenEventIds` as `{ slug, seenAt }`) so an event never re-shows after it's been dismissed, even across force-quit. PostHog captures `awareness_event_shown`, `awareness_event_dismissed`, `awareness_event_cta_tapped`, and `awareness_event_link_tapped`. Dev tools gain a control to clear the pending event prompt.

### Privacy

- **Vent transcripts are never stored** — at any point in the pipeline. Audio is ephemeral: it's transcribed in-flight, used to generate the acknowledgement, and discarded. Only safety-flag metadata can persist. The intro screen's promise ("Your voice is never stored. It goes when you close.") is enforced end-to-end.

### Backend

- **Vent AI pipeline (`convex/vent.ts`)** — `processVentAudio` runs Scribe v2 speech-to-text → crisis check → a Claude Haiku acknowledgement (1–2 sentences, enriched with ElevenLabs audio tags like `[sighs]`/`[soft]` for warmth) → ElevenLabs TTS (`eleven_v3`, a "witnessed" voice). Every stage fails soft and returns `null` — the destruction animation always plays regardless of whether the AI succeeds. On-screen words have the audio tags stripped; the TTS keeps them.
- **Daily voice cap** — voice processing is gated behind a per-user daily cap (`ELEVENLABS_DAILY_CAP_MINUTES`, default 2) charged transactionally in `checkAndIncrementCap`, with a lazy per-day UTC reset. New `emotional_profiles` fields `ventDailyMinutesUsed` / `ventDailyResetAt`. The charge takes the larger of the client-claimed duration and the duration implied by payload size, so a tampered client can't under-report. A `capReached` flag lets the client distinguish "limit reached" from a genuine (silent) pipeline failure.
- **Crisis handling** — a keyword pre-filter is confirmed by OpenAI moderation (fail-safe: if moderation is unavailable, the crisis flag stands). Confirmed crisis returns a single static line ("you don't have to carry this alone") and never riffs over self-harm content; an idiomatic false positive ("end it… this sprint") is cleared by moderation.
- **Recording ceiling** — capped at 120s client-side to keep the m4a payload under Convex's 1MB `v.bytes()` limit (the daily cap is still charged by actual duration server-side). Also adds `getVentSessionToken` for issuing a short-lived ElevenLabs signed URL.

### Changed

- **`useAwarenessEvent` selection logic** — picks at most one event to show: filters to events whose date range includes today and that the user hasn't already seen, then sorts by `priority` (lowest number first) and `startDate`. Stale seen-entries are pruned on mount.

### Fixed

- **Seen-event retention now uses true calendar months** — `pruneSeenEventIds` previously approximated the 13-month retention window as `13 × 30` days (390 fixed days); it now subtracts 13 calendar months via `Date.setMonth`, so retention is exact regardless of month lengths.
- **`getActive` is auth-gated** — the events query now calls `requireAuth` before reading, for defense-in-depth. This content is only ever shown inside the authenticated app, so there's no reason to expose it publicly.

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
