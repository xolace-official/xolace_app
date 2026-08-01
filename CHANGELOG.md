# Changelog

All notable changes to Xolace are documented here.

---

## [1.8.0] - (2026-08-01)

### Added

- **Xolacers — talk to a real person** — the fire is no longer the only thing in the dark. A new **Connect** tab holds two things: **Chats** (your conversations, in every state) and **Xolacers** (the roster of people who've offered to listen). A xolacer is a trained peer, never a therapist, and every surface says so. You browse real profiles — photo, name, a line about why they're here, what they listen to, and their rating — then send a request. Nothing is sent until they accept; you can hold at most **2 pending requests** and **8 open conversations** at a time. Chats are one-to-one and text-only, with a safety strip in every thread and a route to crisis resources always one tap away. Conversations can be closed and later resumed, and closing one opens a **rating** screen so the roster stays honest.
- **Become a xolacer** — anyone can offer to listen. A guided five-step setup (photo → name → a short bio → up to three specialties → review) builds the profile other people will see, with a live progress meter and a plain "this is what people see; your real name and contact details are never shown" review step. Once published, an **Active / Away** toggle lets a xolacer step back without deleting anything — away means no new requests, existing chats untouched.
- **A person offered at the end of a session** — when a session ends on something a xolacer has declared they listen to, the close phase offers one named person instead of the usual Bridge card. Never both, never an algorithmic "matched for you" claim — just the fact of what that person said they're here for, with their face and rating. Tapping opens their profile; nothing is sent until you choose to reach out.
- **Block and report a Xolacer** — every thread and every Xolacer profile now carries a native overflow menu holding **Block** and **Report a concern**. Blocking freezes the conversation at the server, so Stream itself refuses sends from *both* sides — not just a change to what your own app displays. It's confirmed first, the confirmation says plainly that it can't be undone, and it can't: the conversation is closed as `blocked` and a blocked pair can never re-request. The blocked party is never told a block happened; they see the ordinary closed-state copy and the conversation then disappears from both lists. Nothing is deleted — the row, the history and the frozen channel all remain for moderation. Either side can block, including a xolacer who has already accepted, which previously had no exit at all. Blocked conversations are never offered a rating. Reporting a concern now records **who it is about** (and, from a thread, which conversation), so a moderator can act on it; reports are a distinct kind of feedback with their own moderation filter, their own 2-per-day budget so a safety report is never refused because you spent the day sending feature ideas, and an alertable event so a report reaches a human. The Bug/Idea toggle is gone from the concern form — someone reporting a person who frightened them should not be asked to file it as a feature suggestion. The old "Report a concern" text link at the bottom of a profile is removed; it sat in a crowded footer with a recorded mis-tap hazard. Together these meet App Store Review Guideline 1.2 for user-generated content.
- **New home tab (Discovery)** — the app now opens on a poster masthead with a daily quote card and a **Reflect** dock that keeps starting a session one tap away from anywhere. Tabs replace the old single-screen entry.
- **Reflection rank** — the timeline gains a percentile card showing how a reflection landed relative to the rest of the pool.

### Changed

- **Renamed "listeners" to "xolacers"** across every surface — the people who listen are Xolacers, and the language is consistent from the roster to the thread header to notifications.
- **Chats open on messages, not a skeleton** — the Stream connection and every channel in your list are warmed as soon as the Connect tab loads, so tapping a row lands you in the conversation. An offline strip appears instead of an empty thread when the connection drops.
- **Cold-start auth errors no longer red-screen** — a failure during the auth bootstrap now surfaces as a recoverable state rather than a crash.
- **Account deletion fixes** — several errors in the delete-account flow are resolved.
- **Daily quotes** — refreshed generator and card.

### Backend

- **`convex/xolacerChat.ts` + Stream integration** — profile publishing and photo upload, the roster/directory query, the request → accept/decline → resume → rate lifecycle (bounded by `MAX_PENDING_REQUESTS` / `MAX_OPEN_CONVERSATIONS`), short-lived Stream token minting, a sweep for stale conversations, and Stream user purging on account deletion. The whole feature sits behind a server-side `status.enabled` flag, so a deployment with it off renders an empty state rather than a broken tab.
- **`sessionSuggestion`** — reads the Understanding already on the session (no new model call, per the Constitution rule) to decide whether the close phase has a xolacer to offer; returns `null` rather than throwing on a bad session, and a lookup failure can never cost the classification write. `chooseCloseOffer` is a pure, tested rule guaranteeing the suggestion and the Bridge card are never on screen together, with a bounded hold so a stalled query still falls through to the Bridge.
- **Blocking + concern reports** (`convex/lib/conversationBlock.ts`, `convex/xolacerChat.ts`, `convex/productFeedback.ts`) — a pure, tested module owns the three block-derived decisions (the block plan, the blocked predicate, and rating eligibility), so list-hiding and rating suppression cannot drift apart. `blockConversation` freezes the Stream channel **first** and writes the row second: if the write fails after a successful freeze the channel is frozen while the row still reads open — confusing but safe, and corrected by calling again, whereas the reverse order would leave a row claiming a block the server is not enforcing. A failed freeze aborts the whole operation. Either participant may block, with no role gate; non-participants are rejected by the existing guard. Blocking an already-blocked conversation is a no-op that makes no second Stream call, but a row closed for any *other* reason is still blockable — only `blocked` and `xolacer_left` stop a pair re-requesting, so noop-ing on all of `closed` would report success and change nothing. Product feedback gains a `concern` kind with optional subject-profile and conversation attribution, its own 2-per-day fixed-window rate-limit bucket selected by kind in both the submit mutation and the can-submit query, and a structural analytics event carrying only *whether* a subject was attached — no free text, no ids. All schema changes are additive (a widened union plus two optional fields).
- **Specialty taxonomy** (`convex/lib/specialties.ts`) — shared source of truth for what a xolacer can declare and how it's phrased to a reader, with test coverage.

---

## [1.7.0] - (2026-07-14)

### Added

- **Premium themes (Xolace+)** — the five real Plus palettes ship, replacing the `ember` / `moss` / `ink` placeholders that had no CSS behind them: **Emerald** (deep green jewel tone), **Rosé** (soft rose gold), **Platinum** (cool steel minimalism), **Velvet** (wine and burgundy), and **Noir** (black and gold). Each has a full light + dark variant declaring the same token set as the base theme. They appear in Settings → Appearance beside the free themes; non-subscribers see them locked and tapping routes to the paywall. Preview-card colors are derived from each theme's own dark-variant tokens rather than hand-picked, so the card matches what the theme actually renders. Premium is **palette only** — all themes keep Space Grotesk, since the per-theme display fonts the designs called for (Recoleta, Canela, Neue Montreal) require paid embedding licenses.
- **Lapsed-subscription theme reset** — `colorThemeId` is persisted locally and re-applied on cold start before the entitlement is known, so a lapsed subscriber would otherwise keep a Plus theme indefinitely. `usePremiumThemeReconciler` (mounted from `RootProvider`) resets to the default theme once the entitlement resolves to not-Plus, and clears the night-mode theme stash so the premium theme isn't revived by the morning restore. Note this **does** discard the choice, unlike the voice preference, which is preserved across a lapse.

- **Custom voice (Xolace+)** — Plus members can now choose the voice that speaks their mirror *and* their vent coda, from a small curated cast: **Sage** (older, unhurried storyteller), **Wren** (warm, soft-spoken), **Vesper** (calm and grounded), and **Ash** (low, gravelly, close to the fire). The picker lives in Settings → Mirror as a new "Voice" section beneath Tone. **Auto** stays the free default — the mirror keeps using your tone-mapped voice and the vent keeps its Witnessed voice. Every named voice carries a play button that previews it (a fixed line, *"I'm here. Take whatever time you need."*) — playable even before you subscribe, since hearing the voice is the point. Free users tapping a voice are routed to the paywall. See `docs/voice-naming.md` for the naming rationale.

- **Cognition Layer: episodic & semantic memory** — the app now remembers you across sessions instead of re-deriving who you are from scratch each time. Every mirror-generating session is composited into an episodic memory (stored in a per-profile vector namespace) so relevant past moments can be recalled during mirror generation, not just the immediately preceding turn. Alongside this, a **semantic profile** — a versioned, AI-written narrative covering recurring themes, emotional signatures, and emotional trajectory — is now built per person and included in mirror prompts. A new "Personal memory" toggle in Settings → Data (on by default) lets anyone opt out; disabling it stops new episodic/semantic writes without touching history already gathered under the Constitution's data rules.
- **Reflection Agent (Phase 3): light pass + consolidation** — the semantic profile updates itself in two tiers, off the critical path. A **light pass** (Haiku) runs after every completed session: it bootstraps a v1 profile on someone's first qualifying session, or patches the existing trajectory in place afterward — cheap, frequent, trajectory-only. A **consolidation pass** (Sonnet, tool-use loop) runs on a longer gate: it gathers evidence from recent sessions and commits a new full profile version (recurring themes, emotional signatures, and trajectory together), advancing the profile's version pointer. Both passes respect the privacy/data-wipe guard used by the rest of the Cognition Layer, and a version can be rolled back via `revertToVersion` without losing prior history.

### Changed

- **Session completion is now durable** — completing a session (finishing the solo exercise, the peer-reflection screen, or choosing "I just needed to say it") now flips the session to `completed` at the moment that work ends, *before* navigating to the session-end screen — not when the user later taps something on session-end. This means closing the app on session-end can no longer strand a session at `path_selected` / `path_in_progress`. Post-session enrichment (mood check, peer-pool contribution toggle) is now recorded separately, as an optional, best-effort patch onto an already-completed session — so skipping it (or closing the app) never costs you the completed state. The peer-pool anonymizer job is now guarded against double-firing if feedback is submitted more than once.
- **Abandoned-session cron reconciliation** — since `path_selected` / `path_in_progress` are now transient (a session should only be caught there if the app died mid-navigation), the abandoned-session sweep reconciles sessions stranded in those states to `completed` (path not finished) instead of `abandoned`, since the mirror was already confirmed by that point.

### Backend

- **`convex/lib/voices.ts`** — new single source of truth for TTS voices: the Plus `VOICE_CATALOG` (client-facing slugs → ElevenLabs ids, which never leave the server), the tone-default map, the vent default, and `resolveVoiceId`. The mirror (`ai/tts.ts`) and vent (`vent.ts`) pipelines now resolve through it. The stored preference is a **slug**, never a raw voice id.
- **Generation-time premium fence** — the voice is gated both at write (`preferences.update`) and again when audio is generated (`process.ts` / `clarify.ts` pass the slug only when `isPremium`; the vent pipeline reads `preferences.getResolvedVoiceSlug`, which re-checks entitlement). A lapsed subscription silently falls back to the default voice **without wiping the saved choice**, so it returns intact on renewal.
- **`finalizeCompletion` (convex/sessions.ts)** — single source of truth for flipping a session terminal and firing the post-session job tail (profile stats update, Reflection Agent trigger, follow-up gate). Called from `completePath`, `completeSession`, and the abandoned-session reconciliation path.
- **`recordPostSessionFeedback`** — new mutation for optional post-session mood/contribution, replacing the fields that used to live on `completePath`'s args. For backward compatibility, `completePath` still accepts `contributedReflection` / `postSessionMood` (deprecated) from 1.6.x store clients and applies them through the same guarded path, and is idempotent when the session is already `completed` (e.g. cron-reconciled) — so deploying this backend ahead of store review can't strand old clients on the session-end screen.
- **`semantic_profiles` refactor** — `createVersion` reworked; new `updateTrajectory` supports both bootstrap and in-place patch, with the same wipe-guard as the trusted `createVersion` path. `emotional_profiles.lastConsolidationAt` tracks the consolidation gate; cleared by `dataWipe` alongside existing profile-version purging.
- **Tone adaptation (Phase 4, Loop #1)** — the semantic profile's "what lands" / calibration section now writes itself, so the mirror learns each person's response style over time instead of treating tone as a fixed label. It is **deterministic** (no model call, per the Constitution rule): rule-code reads the longitudinal signal the pipeline already captures — confirmation outcomes, mirror lengths, tone tallies, post-session mood — and emits a short directive only when the evidence is conclusive (claim strength from confirm rate, mirror-length preference, best-landing tone, and an accompaniment-vs-resolution posture), staying silent on thin or middling signal. It runs as a final durable step of the consolidation workflow, on the same 5-sessions / 7-days cadence, patching calibration in place onto the current profile version through a new sanctioned `writeCalibrationInternal` path (wipe-guarded, with a v1 bootstrap). The mirror articulator already reads this section, so no prompt change was needed. The best-landing-*tone* directive stays dormant for now (today `toneUsed` echoes the user's preference, so there's no cross-tone signal yet); the other calibration directives are live.
- **Uncertainty routing (Phase 4, Loop #2)** — the mirror now adapts its **claim strength** to how sure the read actually is, instead of asserting every mirror with the same confidence. It is **deterministic** (rule-code, never agentic — the hot path stays System 1 forever): a new `routeUncertainty` gate reads the classifier's own `primaryEmotionConfidence` × `specificity` and picks one of three postures — *tentative* (low/low: offer the mirror as a naming that invites correction, easy to say "not quite" to), *confident* (high/high: name it precisely, no hedging), or *measured* (the normal path). The articulator renders a matching Claim Strength block that composes with Loop #1's longitudinal calibration — the calibration is the prior about this person, the routing is the evidence about this moment. It runs on both the initial mirror and the refinement pass (where a "not quite" turn can never carry a confident posture — it floors to measured). Claim strength is a pure function of confidence and specificity, both already in `emotional_metadata`, so nothing new is persisted; it is recorded on the `mirror_delivered` / `clarify_delivered` analytics events for the eval harness. Doubles as the Plus model-tiering lever (deferred until that infra lands).
- **Memory relevance feedback (Phase 4, Loop #3)** — episodic memories now earn their place in the mirror instead of accumulating as flat noise. Each session carries a salience weight (`episodicImportance`, 0.2–1) mirrored into the RAG vector's native importance, which scales how strongly that memory surfaces in future searches. When a later mirror **lands** (`confirmed`) with a memory in its `episodicMatchKeys`, that memory's weight is bumped; when the user **gives up** on the mirror (`gave_up`), it decays — growth gentler than decay, floored so a memory sinks but is never erased (`refined`/`abandoned` are too noisy to attribute, so they're left alone). This is **rule-code, off the hot path**: the confirmation tap returns immediately and a scheduled background action does the re-embed. Research on `@convex-dev/rag` 0.7.5 showed importance has no in-place setter — every change re-embeds — so the weight lives in `emotional_metadata` as a cheap, transactional source of truth that's re-applied on every (re-)ingest, and the (bounded, K≈3) re-embed is paid only when a weight actually moves. This is why Understanding records `episodicMatchKeys`.
- **Rate limits** for the light and consolidation passes, so the Reflection Agent can't be triggered into a runaway loop.
- **`patternSummary` split** for targeted usage — the classifier and mirror generator now request differently-scoped summaries instead of sharing one general-purpose blob.
- Minor RAG fixes across `episodicMemory.ts`, `rag.ts`, and `reflectionsRag.ts`.

---

## [1.6.1] - OTA Update (2026-06-27)

### Added

- **Follow-Up Check-In** — sessions that leave something unresolved now trigger a warm check-in card a day or so later. The AI classifier flags sessions that qualify (escalation, grief/shame at high intensity, unconfirmed mirrors, or a `gave_up` — where the AI couldn't reflect you back); a Haiku-generated card text, written per-session and referencing the actual moment, surfaces in a bottom sheet the next time you open the app. The sheet asks one question ("how's it sitting now?") with tier-aware response chips: acute/crisis cards surface only "Still sitting with it" / "Feeling lighter" (anything more would read glib at 45 minutes); elevated and standard cards add "Got heavier" and "I worked through it". A separate "Let it out" doorway routes to Voice Vent for those who need to speak rather than tap. A resources link appears on cards derived from escalation sessions. Tapping any chip logs the response and closes the sheet gracefully.
- **Weight-tiered follow-up cadence** — check-in timing adapts to what was shared. Acute (crisis): first ping at 45 min, second at +4 h, expires at 48 h. Elevated (grief/shame intensity ≥ 7, `gave_up`, elevated safeguard): 12 h / +1 d / 7 d. Standard: 24 h / +3 d / 14 d. Push notifications for Elevated and Standard include the card text; Acute pushes use presence-anchored copy that references *when* something was processed without naming the wound.
- **Follow-up section on the Profile screen** — active and recently resolved check-in cards are visible in the Profile screen's new "Follow-Ups" section, so you can return to a card even if you dismissed the sheet early or missed the push.
- **Supersede policy** — a new qualifying session cancels the active follow-up workflow and starts a fresh one, but only when the new session's weight tier is equal to or higher than the active tier. A casual standard session cannot silently cancel an active crisis check-in. Superseded cards remain visible in the Profile (labelled "unresolved, no check-in coming") until explicitly dismissed.

### Backend

- **`follow_up_cards` Convex table** — stores per-session check-in cards (`profileId`, `sessionId`, `tier`, `cardText`, `status`: pending → ready → resolved/expired/superseded, push timestamps, and response). Indexed `by_profile_created` and `by_profile_status`.
- **`startFollowUpWorkflow` / `followUpCadence`** — durable `@convex-dev/workflow` orchestrates the sleep-and-nudge ladder. Sleep durations are passed as `workflow.start` args (not in-body constants) so cadence tuning never reshapes the workflow journal. At most one active follow-up per profile; idempotent `status === "pending"` guard prevents double-fires on multi-device foreground events.
- **`followUpCardWriter` prompt** — Haiku action writes the card text off the critical path after session completion, referencing the mirror and classifier output. Falls back to a static `FALLBACK_FOLLOWUP_CARD` on model outage so safety-relevant follow-ups are never silently dropped.
- **`follow_up` notification type** — `notifications.ts` gains a dedicated `followUpNudge` rate-limit bucket (separate from `gentle_return` / `pattern_nudge`) so follow-up pushes never starve or are starved by other nudge types. Follow-up notifications are gated only by `notifications.enabled` — no per-type toggle at this stage.
- **`requiresFollowUp` classifier flag** — finalized at session completion (not mirror delivery), because `gave_up` is only known after the clarify loop closes. Stored on `emotional_metadata` alongside other classifier output; the operational gate lives on `sessions`.
- **Eval coverage** — `requiresFollowUp.eval.test.ts` covers ~15–20 labeled inputs (live Haiku, `bun:test`) to catch prompt regressions.

### Changed

- **Activity variant** — minor copy and layout adjustments on the session-end activity screen.
- **`auth.ts`** — minor internal fix.

---

## [1.6.0] - Released (2026-06-19)

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
