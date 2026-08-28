# R1 — Implicit vs explicit data coverage + retention signal audit

Research for wayfinder ticket [#230](https://github.com/xolace-official/xolace_app/issues/230),
child of map #229 (post-signup onboarding: founder message + early paywall +
segmentation questionnaire). Readers: T1 (final question set), T3 (data model).

Primary sources only: `convex/schema.ts`, `convex/ai/`, `convex/jobs/`,
`docs/cognition-layer-architecture.md`, `docs/confidence-aware-mirroring.md`,
and live PostHog (project 396459) via `mcp__posthog__exec`.

---

## 0. The one-line answer

Xolace derives a rich emotional model **from the first `rawInput` onward** —
emotion, granularity, intensity, life-domain, temporal orientation, the user's
own words, articulacy, processing style, usage rhythm, "what tone lands". None
of that exists at the moment onboarding runs (session 0), and the deep
narrative layer (`semantic_profiles`) doesn't exist until 5 sessions / 7 active
days. What Xolace **cannot ever derive** is *why the person came*, *what they
already do to cope outside the app*, *how they found us*, and any *series*
signal. Those four are the real onboarding payload; most of the founder's other
candidates are things a first session measures better than a self-report would.

Retention instrumentation is decent on the **behavioural** side (core-loop
funnel, weekly cohort retention, follow-up cards, abandoned-session cron) and
almost empty on the **segment** side: PostHog has exactly one cohort (internal
users), no acquisition attribution, and near-bare person properties.

---

## 1. Coverage table — candidate onboarding question → is it already derivable?

"How soon" is measured from account creation. "S1" = available after the first
completed reflection.

| Candidate question | Derivable? | From where | How soon |
|---|---|---|---|
| Display name / what to call you | **No** — nothing holds a real name; `users` is deliberately empty of anything personal (`schema.ts:36-39`). A warm auto-default is generated (`preferences.displayName` ← `lib/displayName.generateDisplayName`, `users.ts:93`). | `preferences.displayName`, `preferences.spaceName` (`schema.ts:295-309`) | Auto-default at signup; real name never |
| Why are you here / what do you want from Xolace (intent) | **No** | closest proxies are behavioural and lagging: `sessions.pathChosen` (solo/peers/exit), `sessions.entryType`, `emotional_metadata.thematicTags` | proxies at S1; true intent never |
| How aware are you of what you feel (emotion-awareness type) | **Yes** | `emotional_metadata.specificity` 1-10 is *exactly* this scale — "I feel bad"=1 → "furious at my mother for making my graduation about her boyfriend"=10 (`ai/prompts/classifier.ts:97-102`). Reinforced by `primaryEmotionConfidence`, `initialConfidence`, `sessions.freezeOccurred`/`freezeDuration`, `entryType` (`word_cloud`/`body_scan` are low-articulacy by design), `rawInputLength`. Narrated later in `semantic_profiles.emotionalSignatures`. | S1 (single reading); stable by ~S3-5 |
| Talker vs not-a-talker | **Yes (proxy)** | `sessions.rawInputLength`, `sessions.inputDuration`, `session_turns` count / `userFeedback: "say_more"` usage, `preferences.preferredInputType` (explicit text/voice), calibration "mirror length preference" (`ai/reflectionAgent/calibrationSignals.ts:132-150`) | S1-2; no single stored flag |
| How do you currently process emotions | **Partially** | in-app behaviour is derived: `emotional_metadata.temporalContext` (past/present/future), `thematicTags`, `sessions.pathChosen`, `emotional_profiles.typicalUsagePattern` (day+hour, `jobs/profileStats.ts:104-146`, needs ≥5 sessions), `semantic_profiles.recurringThemes`/`emotionalSignatures`. **External** coping (journalling, friends, therapy, bottling it up) is never visible. | in-app: S1→consolidation; external: never |
| How did you find Xolace (acquisition source) | **No** | PostHog person props are geoip + device + `auth_provider` + `first_sign_in_date` only (§3). No UTM, no referrer, no install attribution, no acquisition cohort. `users.authProvider` (apple/google) is the only channel-ish field. | never (with current wiring) |
| Series branch — seen it / rating / want-access | **No — zero data** | grep for `series`/`episode`/`watch.*rating` across `src/` and `convex/schema.ts` returns nothing. No such feature exists. Nearest existing pattern: `insight_waitlist` intent capture (`schema.ts:1441-1446`). | never; net-new |

### What the system knows implicitly (inventory, for T3)

- **`emotional_profiles`** (`schema.ts:97-182`) — `sessionCount`, `firstSessionAt`,
  `lastSessionAt`, `averageSessionDuration`, `currentStreak`, `longestStreak`,
  `dominantEmotionTags` (top 3-5 emotions, `profileStats.ts:72-92`),
  `frequentWords` (recurring user words + counts, count>1 only),
  `typicalUsagePattern` (`{dayOfWeek, hourOfDay}`, null until 5+ sessions),
  `currentSemanticProfileId`, `lastConsolidationAt`, `ventDailyMinutesUsed`.
- **`sessions`** (`schema.ts:355-620`) — `state` machine (10 states incl.
  `abandoned`, `error` → drop-off point), `entryType` (open_prompt / guided_entry
  / body_scan / word_cloud / voice), `rawInput` + `rawInputLength`,
  `inputDuration` (ms first-keystroke→submit; "flooding vs deliberating"),
  `freezeOccurred` + `freezeDuration` (30 s+ pre-articulation stall),
  `toneUsed`, `confirmationState` (confirmed / refined / gave_up / abandoned),
  `pathChosen`, `postSessionMood` (lighter/same/heavier/unsure),
  `escalationTriggered`, `safeguardLevel`, `timeOfDay`, `dayOfWeek`,
  `sessionMode` (day/night), `sessionDuration`, `requiresFollowUp`, `gapNamed`.
- **`session_turns`** (`schema.ts:635-661`) — every "not quite" / "say more"
  loop: `userFeedback`, `userInput`, `revisedMirrorText`.
- **`emotional_metadata`** = the per-session **Understanding**
  (`schema.ts:675-840`; `convex/understanding.ts`) — `primaryEmotion`
  (13-value: anger/sadness/grief/fear/anxiety/joy/love/surprise/disgust/shame/
  guilt/confusion/numbness), `primaryEmotionConfidence`, `granularLabel`,
  `secondaryEmotion`, `intensity` 1-10, `specificity` 1-10,
  `thematicTags` (work/relationships/family/identity/health/finances/purpose/
  self-worth/loss/change/conflict/isolation/achievement/creativity/trauma/
  abuse/neglect), `userLanguageTags` (verbatim), `temporalContext`, `riskFlag`,
  `safeguardTrigger`, `episodicMatchKeys`, `episodicTopScore`,
  `initialConfidence` (presence = "this session was refined"), `profileVersion`,
  `followUpReason`, `suggestedSpecialty`.
- **`semantic_profiles`** (`schema.ts:1629-1655`; `convex/semanticProfiles.ts`)
  — AI-written narrative, append-only versions, Reflection-Agent-only:
  `recurringThemes`, `emotionalSignatures` ("anger usually masks fear; goes
  quiet rather than escalating"), `calibration` (what tone/length lands),
  `trajectory`. **Null until first consolidation** — 5 new sessions OR 7 active
  days, whichever first (`cognition-layer-architecture.md` §3, decision log #7).
- **Episodic memory** — `@convex-dev/rag`, `namespace = emotionalProfileId`,
  per-session composite (raw text + mirror + distilled + metadata line),
  ingested post-mirror (`cognition-layer-architecture.md` §1.1).
- **`preferences`** (`schema.ts:196-336`) — explicit settings, not derived:
  `mirrorTone`, `voice`, `preferredInputType`, `contributeByDefault`,
  `dataRetentionPreference`, `personalMemoryEnabled`, `spaceName`,
  `displayName`, `avatarId`, `quotes.themes`, `registerComplaint`.

### Cold-start reality (session 0 → 1)

`convex/ai/context.ts` `buildSessionContext` returns `isFirstSession`
(`profile.sessionCount === 0`), a last-5 sessions/metadata window (empty),
and `semanticProfile: null`. The classifier gets a "be slightly more
conservative with confidence" note (`classifier.ts:141`); the articulator gets
"be slightly warmer" (`ai/prompts/articulator.ts:126`). **At onboarding time
the implicit model is genuinely empty** — every field in the inventory above is
zero/undefined until the user has processed something.

---

## 2. Founder's candidate questions — survival filter

| Question | Verdict | One-line recommendation |
|---|---|---|
| **username** | must-ask (partial) | **Keep, but optional/skippable** — a warm auto-default already exists (`generateDisplayName`); make this "confirm or change", and keep it distinct from `spaceName` (what you call the fire). |
| **intention / expectation** | must-ask | **Keep — top priority.** The single most non-derivable, highest-leverage answer; it reframes the first session and is the backbone of segmentation. |
| **emotion-awareness type** | derivable from S1, **but keep** (founder override) | **Keep the direct ask.** At session 0 there is no implicit signal at all, and `emotional_metadata.specificity` only stabilises by ~S3-5. The self-report is the only read on whether this person shares openly or holds back, from the first screen. `specificity` then *confirms/refines* it over sessions rather than removing the need to ask up front. |
| **talker vs not-a-talker** | derivable proxy (S1-2) | **Fold into the emotion-awareness question, not standalone.** `rawInputLength`, `inputDuration`, `say_more` usage, `preferredInputType` cover it behaviourally; both questions read as "does this person like to share", so T1 to decide if they collapse into one. |
| **how they currently process emotions** | partial | **Keep a trimmed version** — only the *external* part ("what do you do now — journal, talk to someone, keep it in?"). Drop anything about in-app behaviour; that's measured. |
| **how they found Xolace** | must-ask | **Keep.** Only path to channel attribution today (no UTM/referrer/install attribution anywhere). Also flag as its own infra gap (§4). |
| **series branch (seen / rating / want-access)** | must-ask (no data) | **Keep only if the series is real near-term.** Net-new signal; model the want-access boolean on `insight_waitlist`. Branch, not flat — the rating sub-question only applies to people who've seen it. See scope flag §4. |

---

## 3. Retention signal audit

### PostHog — what exists today (project 396459)

**Events** (90-day volume, top of the list — all client-side `posthog.capture`,
**disabled in `__DEV__`**, `src/config/posthog.ts`):

- Lifecycle / acquisition: `Application Installed` (332), `user_signed_in`
  (481; props `auth_provider`, `is_new_user`), `user_signed_out`,
  `onboarding_completed` (306 — **fires on tapping through the intro/Promise
  screen only**, `src/features/onboarding/.../PromiseScreen.tsx:54`; no data
  captured), `tour_started/completed/skipped`.
- Core loop: `reflection_submitted` (523; `entry_type`, `freeze_occurred`,
  `input_length`), `mirror_arrived`/`mirror_delivered` (480; `claimStrength`,
  `entryType`, `episodicTopScore`, `memoryConnected`, `isFirstSession`,
  `safeguardLevel`, `sessionMode`, `specificity`, `toneUsed`, `usedFallback`),
  `mirror_confirmed` (423; `turns_count`), `mirror_not_quite`, `mirror_say_more`,
  `clarify_delivered`, `path_selected` (419; `path`), `session_completed` (424;
  `action`, `contributed_reflection`, `post_session_mood`),
  `streak_reveal_acknowledged`.
- Cognition/agent: `reflect_light_pass` (`writerVersion`),
  `reflect_calibration_written`, `reflect_consolidation_written`/`_failed`.
- Follow-up: `follow_up_shown` / `follow_up_responded` (`tier`,
  `escalation_derived`, `response`), `follow_up_dismissed`.
- Monetisation: `paywall_opened` (176; `session_count`, `surface`),
  `paywall_dismissed` (`surface`), `premium_gate_hit` (147; `feature`,
  `hasData`, `sessionCount`), `teaser_viewed` (869; `feature`), `teaser_tapped`,
  `plus_offer_shown` (`moment`, `variant`), `purchase_started/completed/failed`
  (`package`, `surface`), `entitlement_activated`/`expired`, `waitlist_joined`
  (6), `tone_changed` (`tone`).
- Safety: `crisis_resources_opened` (162), `escalation_triggered` (8),
  `escalation_engaged`, `ai_error`, `mirror_rate_limited`.
- Vent / xolacer: `vent_started/heard/completed/stopped`, `xolacer_request_sent`
  (`origin`), `xolacer_request_accepted`, `xolacer_suggestion_shown/opened`.

**Cohorts:** exactly one — `Internal / Test users` (id 275474). **No
behavioural or segment cohorts exist.**

**Person properties** (all of them): `auth_provider`, `first_sign_in_date`,
`$geoip_*` (country / city / timezone), `$os*`, `$screen_*`, `$device_type`,
`$app_version` + `$initial_*` variants. **No acquisition source, no UTM, no
segment/questionnaire fields.**

**Saved retention insights / dashboards already built:**

- `Weekly Cohort Retention (Core action)` — `enxcSGsZ`, dashboard 1701952
  (first core action → return in weeks 1,2,3…; core = reflection / vent /
  xolacer request / follow-up / bridge).
- `Weekly Cohort Retention (Reflect)` — `ESN9Sh9Z`.
- `WAU` `yA4DtyzC`, `DAU` `R5NiWKYD`, `MAU` `1tThoL4v`, `Stickiness` `XuJ4KSIU`,
  `14 day retention application opened` `heT8tZyd`.
- `Onboarding → Sign-in Funnel` `VLLINrex` (dashboard 1701948, acquisition).
- `Core Loop Funnel: Reflect → Mirror → Path` `paROiaMy`,
  `Mirror Acceptance Rate` `HjXnHgno`, `Path Selection Distribution` `W4Nj3RTp`,
  `Post-Session Mood Breakdown` `MrQ8lzal`, `Reflection Entry Type Breakdown`
  `eH1icZRH` (dashboard 1701950/1701951).
- `New Sign-ins Over Time` `n8DZOdxA`, `Adoption by country` `pSX0Pe5R`,
  `Growth accounting` `cNjCxOa9` (pageview-based, low signal on mobile).
- Follow-up funnels (`JeV3VKLU` shown→responded, `9FKI8CcY` dismiss vs respond,
  `DpudiNZ6` by tier), vent funnels (dashboard 1769866).

**Churn/drop-off cuts visible today:** where a session ends (state-machine
funnel), mirror acceptance vs "not quite" / "gave up", post-session mood,
weekly cohort return by first-core-action, path choice, follow-up
shown→responded. **All keyed on behaviour.** No cut by *user segment* is
possible — there is no segment property to cut by.

**Missing (PostHog):**

- No acquisition-source / channel property → cannot attribute retention to
  channel. `Adoption by country` and `auth_provider` are the only proxies.
- No segment cohorts. Any "which segments churn" analysis has to wait for the
  questionnaire answers to land **as PostHog person properties** (Convex-only
  won't build cohorts).
- No subscription/trial funnel cohorts beyond raw `purchase_*` events; churn
  lives in RevenueCat (`convex/revenuecat.ts`, `entitlement_expired` = 6
  events).
- Dev traffic is invisible (`disabled: __DEV__`), and events are ad-hoc with no
  central catalog — a questionnaire step needs its own `posthog.capture` +
  `posthog.identify`/`$set` wiring added deliberately.

### Convex-side retention signals

- **Session counts / recency / rhythm:** `emotional_profiles.sessionCount`,
  `currentStreak`, `longestStreak`, `firstSessionAt`, `lastSessionAt`,
  `averageSessionDuration`, `typicalUsagePattern` (`profileStats.ts`).
- **Drop-off:** `sessions.state` terminal distribution via
  `by_profile_state` index — schema comment literally: *"Dropout analysis:
  where do sessions end?"* (`schema.ts:600-601`). `confirmationState` incl.
  `gave_up`; `feedback` table types `mirror_miss` / `gave_up` / `mood_heavier`
  / `mood_unsure` (`schema.ts:1248-1280`).
- **Abandoned-session cron:** `check abandoned sessions` every 6 h prod
  (`crons.ts:19`), `sessions.checkAbandoned` (`sessions.ts:1003`) — sweeps
  stale non-terminal sessions → `abandoned`, and gates a follow-up.
- **Re-engagement:** `notification_log` with `resultedInSession` attribution
  (24 h organic-return window, `profileStats.ts:150-166`), `by_type` index
  ("which notification types work"), `gentle_return` + `pattern_nudge` crons.
- **Follow-up system** (`docs/follow-up-system.md`): weight-tiered cadence
  (acute / elevated / standard), `follow_up_cards` table with `status`
  lifecycle + `userResponse` (lighter / still_here / heavier / processed /
  vent / dismissed), `sessions.requiresFollowUp`.
- **`reflectionRank` aggregate** → profile percentile card, keyed on
  `sessionCount` (`schema.ts:100-105`, `lib/aggregates.ts`).
- **`cohort_weekly_counts`** — distinct campers per emotion per week
  (`jobs/cohortCounts.ts`, ADR 0004); a community-size signal, not retention.
- **No churn/subscription table** in Convex; entitlement state is RevenueCat +
  `revenuecat.ts` webhook.

---

## 4. Doc pointers (load-bearing)

- **`docs/cognition-layer-architecture.md`** — §1.1 episodic memory (per-session
  composite, raw text included); §1.2 semantic profile sections
  (recurringThemes / emotionalSignatures / calibration / trajectory); §2
  Understanding = `emotional_metadata` (storage decision locked: no new table);
  §3 Reflection Agent cadence + **decision log #7** (consolidation trigger:
  5 sessions OR 7 active days); §4 feedback loops (tone adaptation reads
  `confirmationState` / `toneUsed` / clarify turns / mood deltas).
- **`docs/confidence-aware-mirroring.md`** + **`CONTEXT.md`** "The reach becomes
  interrogative (2026-08-25)" — cold-start behaviour: when there's no semantic
  profile the mirror's faint-signal question stays unspecific; with a profile it
  may name a guess. Confirms the system already branches on
  "profile exists vs cold start". `mirror_delivered` PostHog props
  (`claimStrength`, `episodicTopScore`, `memoryConnected`, `isFirstSession`)
  are the live instrumentation of this.
- **`convex/schema.ts`** — tables 1-6 (`users`, `emotional_profiles`,
  `preferences`, `sessions`, `session_turns`, `emotional_metadata`), 21
  (`semantic_profiles`), 17 `insight_waitlist` (`:1441` — the want-access
  capture pattern for the series question), 20 `follow_up_cards`.
- **`convex/ai/prompts/classifier.ts`** — `specificity` (`:97-102`) and
  `primaryEmotion` enum (`:56`) definitions; the emotion-awareness scale.
- **`convex/ai/context.ts`** — cold-start context assembly (`isFirstSession`,
  null semantic profile).
- **`convex/jobs/profileStats.ts`** — how `dominantEmotionTags`,
  `frequentWords`, `typicalUsagePattern`, streak, milestones are derived.
- **`convex/ai/reflectionAgent/calibrationSignals.ts`** — deterministic
  "what lands" (tone + mirror-length preference) derivation; the "talker"
  proxy on the mirror side.
- **`src/config/posthog.ts`** — analytics disabled in `__DEV__`; no central
  event catalog (events are inline `posthog.capture` calls).
- **`convex/crons.ts`** — abandoned-session + notification-trigger cadence.

---

## 5. Scope surprises / flags for the map owner

1. **There is no question-asking onboarding today.** `onboarding_completed`
   fires from tapping through the intro/Promise screen; `(onboarding)` is just
   `promise` + `frame` intro screens. `emotional_profiles.onboardingComplete`
   exists but only gates the route. T3 is building a genuinely new capture
   surface (new `preferences` fields or a new table) — not extending one.
2. **Acquisition attribution is a standalone gap.** No UTM / referrer / install
   attribution / RevenueCat attribution is wired. The "how did you find us"
   question is a pragmatic stopgap, but a proper fix (server-side install
   attribution + `entitlement_activated.sourceEventType` already exists) is its
   own ticket, not part of the onboarding effort.
3. **The "series" doesn't exist in the codebase.** No `series` / `episode` /
   watch-rating anything in schema or `src/`. The series-branch question
   presumes an unbuilt product — confirm it's real and near-term before T1
   commits a branch to it.
4. **Questionnaire answers must be dual-written.** Convex (durable, joins to
   emotional data, survives account for personalization) **and** PostHog person
   properties (the only way to build the segment cohorts §3 says are missing).
   PostHog person props are currently almost bare — this is the moment to fix
   that.
5. **Early-onboarding paywall is cheap to instrument.** `paywall_opened`
   already carries `session_count` + `surface`; a new `surface: "onboarding"`
   value is the whole change. `premium_gate_hit` / `plus_offer_shown` already
   carry `sessionCount` / `moment` / `variant`.
6. **Most self-report questions are worse than session 1.** `specificity`,
   articulacy, processing style, and "what lands" are all derived within one or
   a few sessions. The questions worth their friction are the ones session 1
   can't produce: intent, external coping, acquisition, series.
