# Design: Xolace Insight Features — Full Catalog, Tiers & Roadmap

Generated: 2026-06-15  
Branch: insight-features-research  
Status: DRAFT  

---

> **Naming convention used throughout this doc:**
> - **Spec name** — internal identifier used in code, Convex functions, PR titles, and engineering discussion
> - **User-facing name** — what appears in the UI, copy, and onboarding

---

## Problem Statement

Xolace has a rich longitudinal dataset per user — emotion tags, mirror confirmation
rates, mood delta, intensity scores, specificity growth, thematic life domains, the
user's own language patterns, temporal orientation, path preferences, and session
timing. None of this is surfaced to the user yet.

The next milestone is building the profile screen and setting up subscription tiers.
This design catalogs every insight feature that can be built, classifies each by
free/premium, sequences them by build order, and identifies which ones belong on the
profile screen.

---

## What's Already Being Collected (No Schema Changes Needed)

Every field below is already in the schema. This is the insight inventory:

**Per session (`sessions` table):**
- `postSessionMood` — lighter/same/heavier/unsure (mood delta)
- `timeOfDay` — early_morning/morning/afternoon/evening/late_night
- `dayOfWeek` — 0-6
- `sessionMode` — day/night
- `confirmationState` — confirmed/refined/gave_up/abandoned (mirror quality)
- `pathChosen` — solo/peers/exit
- `pathCompleted` — boolean
- `sessionDuration` — ms
- `rawInputLength` — character count
- `inputDuration` — ms from first keystroke to submit
- `freezeOccurred` / `freezeDuration` — pre-articulation difficulty
- `escalationTriggered` — boolean
- `entryType` — open_prompt/guided_entry/body_scan/word_cloud/voice

**Per session (`emotional_metadata` table):**
- `primaryEmotion` — broad emotion string (anger, sadness, anxiety, joy, confusion, numbness...)
- `primaryEmotionConfidence` — 0.0-1.0
- `granularLabel` — nuanced label (frustration, grief, overwhelm...)
- `secondaryEmotion` — what's underneath the primary
- `intensity` — 1-10
- `specificity` — 1-10 (how specific vs vague; a growth metric)
- `thematicTags` — life domain tags (work, relationships, family, identity, health, finances, purpose, self-worth)
- `userLanguageTags` — the user's own words (stuck, glass wall, drowning, invisible)
- `temporalContext` — past_focused/present_focused/future_focused

**Per session (`session_turns` table):**
- `turnNumber` — how many refinement loops before confirmation
- `userFeedback` — not_quite/say_more

**Per profile (`emotional_profiles` table):**
- `sessionCount` — total completed sessions
- `currentStreak` — already tracked (UI partially built)
- `dominantEmotionTags` — top 5 from last 20 sessions (already computed)
- `firstSessionAt` / `lastSessionAt`
- `averageSessionDuration`
- `typicalUsagePattern` — dayOfWeek + hourOfDay (after 5+ sessions)

**In `daily_quotes`:**
- `reaction` — resonates/not_today (quote resonance)

---

## The Full Insight Feature Catalog

### Free Tier Features

Simple, computed on-demand from existing data, no new infrastructure.
Give users enough to feel genuine value and establish the self-knowledge
that makes premium worth upgrading to.

---

#### F1 — Moments Processed Counter
**Spec name:** Moments Processed Counter
**User-facing:** "You've shown up 47 times."

**What:** Simple count of completed sessions. The most basic acknowledgment the product can offer.
**Data:** `emotional_profiles.sessionCount`
**Profile screen:** Yes — headline number, prominently placed
**Build wave:** Wave 1
**Effort:** XS — one query
**Why free:** "You've done this 47 times." That sentence should never be behind a paywall.

---

#### F2 — Streak
**Spec name:** Current Streak
**User-facing:** "Day 12."

**What:** Streak counter. Already tracked, UI partially built.
**Data:** `emotional_profiles.currentStreak` + streak calendar (partly built)
**Profile screen:** Yes — secondary to session count
**Build wave:** Wave 1 (mostly done, needs a home)
**Effort:** XS
**Why free:** Engagement mechanic. Free tier needs a reason to return.

---

#### F3 — Top Emotions
**Spec name:** Top Emotions (Simple)
**User-facing:** "What keeps showing up: anxiety · grief · confusion"

**What:** 3 dominant emotion chips, already computed per profile.
**Data:** `emotional_profiles.dominantEmotionTags`
**Profile screen:** Yes — visual chip row
**Build wave:** Wave 1
**Effort:** XS — field already populated
**Why free:** Knowing your top 3 emotions is table stakes. Trends, depth, secondary emotions are premium.

---

#### F4 — Mood Delta Summary
**Spec name:** Mood Delta Summary
**User-facing:** "Most of your sessions end lighter."

**What:** Percentage of last 10 sessions where postSessionMood = lighter/same/heavier.
**Data:** `sessions.postSessionMood` — last 10, compute breakdown
**Profile screen:** Yes — one stat line
**Build wave:** Wave 1
**Effort:** S — one bounded query, simple math
**Why free:** This is the product's core promise validated. Users should see whether Xolace is working for them.

---

#### F5 — Temporal Rhythm
**Spec name:** When You Process / Temporal Rhythm
**User-facing:** "You tend to arrive on Sunday evenings and Wednesday mornings."

**What:** Time-of-day and day-of-week insight. Not gamified — just reflective. Frame as: this is your rhythm.
**Data:** `emotional_profiles.typicalUsagePattern` (dayOfWeek + hourOfDay, computed after 5+ sessions)
**Profile screen:** Yes — one line, small text
**Build wave:** Wave 1
**Effort:** XS — field already populated
**Why free:** "I'm an evening processor" is a personality insight, not a premium feature.

---

#### F6 — Milestone Acknowledgments
**Spec name:** Milestone Acknowledgments
**User-facing:** "You've shown up 30 times. That says something."

**What:** Quiet moments at 10, 30, 50, 100, 250, 500 sessions. Not badges — a card in the
session-end screen. Acknowledgment, not achievement.
**Data:** `emotional_profiles.sessionCount` + `@abdssamie/convex-checkpoints`
**Profile screen:** Small earned markers
**Build wave:** Wave 2 (requires Checkpoints component)
**Effort:** M — install component, register threshold rules, design callback UX
**Why free:** Being told "I see you" after 30 sessions is the product's core promise. Paywalling acknowledgment breaks the brand.

---

### Premium Tier Features

Require additional infrastructure, AI generation, or longitudinal data access
earned by staying with the product.

---

#### P1 — Emotional Constellation
**Spec name:** Emotional Frequency Map
**User-facing:** "Emotional Constellation"

**What:** Visualization of `primaryEmotion` + `thematicTags` as a node cluster — bigger nodes = more
frequent. Not a bar chart. Something that looks like stars, not analytics. Pairs naturally with the
campfire metaphor: these are the things that keep showing up in the light. Weekly and monthly buckets
let users see how the constellation shifts over time.
**Data:** `emotional_metadata.primaryEmotion` + `thematicTags` + `createdAt`
**Infrastructure:** `@convex-dev/aggregate` (tuple key: [profileId, emotion, weekBucket])
**Profile screen:** Teaser (blurred constellation behind premium lock) — full view on insights screen
**Build wave:** Wave 2
**Effort:** L — install aggregate, wire into session completion, build constellation UI
**Why premium:** Longitudinal view requires historical access. Free users get the top-3 snapshot; premium users see the full constellation.

> **Visual note:** This should not render as a bar chart or pie chart. The star/node cluster visual
> is load-bearing — it's what makes this feel like Xolace and not a fitness tracker.

---

#### P2 — Intensity Arc
**Spec name:** Intensity Trend
**User-facing:** "Intensity Arc"

**What:** `intensity` (1-10) over time as a quiet ambient line. Not "are you improving" — "here's
when things were heavy." The UI should feel like looking at weather, not a health dashboard.
**Data:** `emotional_metadata.intensity` over last 30/90 days
**Profile screen:** Small sparkline preview → full view on insights screen
**Build wave:** Wave 2
**Effort:** M — bounded query by date range, rolling average, ambient line render
**Why premium:** Meaningful only with 10+ sessions. Trend charts require historical depth.

---

#### P3 — Specificity Growth
**Spec name:** Specificity Growth
**User-facing:** "Your words are finding you."

**What:** The `specificity` field (1-10, how specific vs vague) is a growth metric — it measures
emotional articulateness. Track it over time. "You started at 4.1. You're at 7.2 now." No other
app can show you whether you're getting better at naming what you feel.
**Data:** `emotional_metadata.specificity` over time
**Profile screen:** One stat teaser: "Avg clarity: 7.2 (up from 4.1 when you started)"
**Build wave:** Wave 2
**Effort:** M — bounded query, first-session average vs recent average comparison
**Why premium:** Xolace's most unique insight. Earned through use.

---

#### P4 — Life Domains
**Spec name:** Life Domains
**User-facing:** "What you keep bringing here"

**What:** Breakdown of thematic life areas across sessions — work, relationships, family,
identity, health, finances, purpose, self-worth. "You spend most time processing relationships."
**Data:** `emotional_metadata.thematicTags` — frequency count across all sessions
**Profile screen:** Tag cloud or ranked list on insights screen
**Build wave:** Wave 2
**Effort:** M — collect all thematic tags for profile, tally, display
**Why premium:** Requires full session history scan. Free users don't get historical access.

---

#### P5 — Words That Keep Finding You
**Spec name:** Your Language
**User-facing:** "Words That Keep Finding You"

**What:** `userLanguageTags` captures the user's own emotional vocabulary per session. Aggregate
across sessions, surface recurring words. "The word 'stuck' has shown up in 6 of your sessions
this year." This is not analytics. This is the app showing the user something they didn't consciously
notice about themselves. No other app does this.
**Data:** `emotional_metadata.userLanguageTags` — frequency count across sessions
**Profile screen:** Small preview: "Words that keep finding you: trapped · invisible · not enough"
**Build wave:** Wave 2 (basic frequency count) / Wave 3 (semantic clustering with RAG)
**Effort:** M for basic, L for RAG-powered

**Infrastructure note:** `userLanguageTags` lives per-session only. A background job (similar to
`profileStats.ts`) should maintain a `topUserLanguageTags` array on the profile — frequency-ranked
and decay-weighted toward recent sessions — so profile renders don't require a full session scan.
Add this to the `profileStats` job in Wave 2.

**Why premium:** This is deeply personal. The revelation that you keep returning to "trapped" is
powerful and warrants earned access.

---

#### P6 — Mirror Resonance
**Spec name:** Mirror Quality Score
**User-facing:** "Mirror Resonance"

**What:** "8 of your last 10 sessions landed on the first try." Uses `session_turns.turnNumber`
count — how often the first mirror landed vs needed refinement. Frame as: "Your words are finding
you faster" — signals growing emotional vocabulary and self-awareness. Very on-brand.
**Data:** `sessions.confirmationState` + `session_turns` count per session
**Profile screen:** One stat or sparkline
**Build wave:** Wave 2
**Effort:** S — bounded query, turnNumber ratio calc
**Why premium:** Feedback loop unique to Xolace's interaction model. Power-user insight.

---

#### P7 — Secondary Emotion Patterns
**Spec name:** Secondary Emotion Patterns
**User-facing:** "What's underneath"

**What:** "When you feel anxiety, underneath it is often fear." Cross-tabulation of
`primaryEmotion` → `secondaryEmotion` pairs.
**Data:** `emotional_metadata.primaryEmotion` + `emotional_metadata.secondaryEmotion`
**Profile screen:** Insights screen only
**Build wave:** Wave 2
**Effort:** M — bounded query, grouping logic
**Why premium:** Nuanced. Requires multiple sessions to be meaningful.

---

#### P8 — Temporal Context Shift
**Spec name:** Temporal Orientation
**User-facing:** "Temporal Context Shift"

**What:** "Lately you've been more present-focused." Distribution of `temporalContext`
(past/present/future) across sessions, with recent trend.
**Data:** `emotional_metadata.temporalContext`
**Profile screen:** Insights screen only
**Build wave:** Wave 2
**Effort:** S — simple frequency query with recent window comparison
**Why premium:** Subtle but meaningful. Requires enough sessions to trend.

---

#### P9 — What Works For You
**Spec name:** Path → Mood Correlation
**User-facing:** "What Works For You"

**What:** `pathChosen` breakdown cross-referenced with `postSessionMood`. "You tend to sit
with it — and you leave lighter when you do." Actionable without being prescriptive.
**Data:** `sessions.pathChosen` + `sessions.postSessionMood`
**Profile screen:** Insights screen, "What works for you" section
**Build wave:** Wave 2
**Effort:** M — cross-query two fields, conditional probabilities
**Why premium:** Actionable pattern. Users who know "solo path works better for me" will use the app more intentionally.

---

#### P10 — Emotion × Mood Correlation
**Spec name:** Post-Mood by Emotion Type
**User-facing:** "What tends to clear, what tends to stay"

**What:** Cross-reference `primaryEmotion` × `postSessionMood`. "Processing grief tends to feel the
same or heavier. Processing anxiety tends to clear." Genuine clinical insight delivered without
clinical framing — novel data that doesn't exist in any wellness app.
**Data:** `emotional_metadata.primaryEmotion` + `sessions.postSessionMood`
**Profile screen:** Insights screen — small table or visual
**Build wave:** Wave 2
**Effort:** M — join emotional_metadata + sessions by sessionId, group by emotion, compute postMood distribution
**Why premium:** Requires joining two tables across full history. Meaningful at 10+ sessions.

> **Note:** Distinct from P9. P9 tracks which *path* (solo/peers/exit) leaves you lighter.
> P10 tracks which *emotion type* tends to resolve vs stay heavy. Both are worth having.

---

#### P11 — Entry Style
**Spec name:** Entry Style
**User-facing:** "How you arrive"

**What:** Synthesis of `entryType` + `inputDuration` + `freezeOccurred`. "You usually arrive in words."
/ "You often arrive in texture first." The freeze data is emotionally interesting: "Sometimes it takes
a moment to find what's here. That's the most honest kind of arriving."
**Data:** `sessions.entryType` + `sessions.inputDuration` + `sessions.freezeOccurred`
**Profile screen:** One line on profile
**Build wave:** Wave 2
**Effort:** S — bounded query, mode + pattern detection across last N sessions
**Why premium:** Requires session history scan. Meaningful after 5+ sessions.

---

#### P12 — Session Weight Map
**Spec name:** Session Weight Map
**User-facing:** "Your heaviest moments"

**What:** `intensity` × `sessionDuration` rendered as a sparse scatter — the heaviest, longest
sessions plotted over time. Not to track progress. Just to say: "These were your heaviest moments.
You stayed." Quietly powerful. Low build cost, high emotional payoff.
**Data:** `emotional_metadata.intensity` + `sessions.sessionDuration` + `sessions.completedAt`
**Profile screen:** Insights screen only — a single subtle chart
**Build wave:** Wave 2
**Effort:** S — join emotional_metadata + sessions by sessionId, scatter render
**Why premium:** Requires historical access. Surfacing someone's heaviest moments is earned, not free.

---

#### P13 — Weekly Emotional Weather
**Spec name:** Weekly Emotional Weather
**User-facing:** "This week's weather"

**What:** Auto-generated weekly summary card. "This week: anxiety dominated, with a grief undercurrent.
Intensity was high Monday-Tuesday, calmer by Thursday. You processed 4 times."
**Infrastructure:** `@convex-dev/crons` (per-user weekly job) + Anthropic generation
**Profile screen:** Pinned card at top if active week; history in insights screen
**Build wave:** Wave 3
**Effort:** XL — crons install, per-user schedule, AI generation pipeline, storage + display
**Why premium:** AI tokens per user per week. Generated product.

---

#### P14 — Personal Emotional Memory
**Spec name:** Personal Emotional Memory
**User-facing:** "I remember"

**What:** "Three months ago you were processing something similar. You called it 'the weight of
being unseen.' Is that still here?" The AI references the user's own history when they start a
new session. The moat feature.
**Infrastructure:** `@convex-dev/rag` (vector embeddings of mirror text per session)
**Profile screen:** Not directly — powers the reflect screen experience
**Build wave:** Wave 3
**Effort:** XL — RAG install, index mirrors after each session, inject top-K semantically similar sessions into articulator context
**Why premium:** Embedding generation per session. Once a user has 6+ months of indexed emotional
history, leaving means losing that memory. That's the switching cost.

---

#### P15 — Percentile Positioning
**Spec name:** Percentile Positioning
**User-facing:** "You reflect more than most."

**What:** "You reflect more than 73% of Xolace users." Anonymous comparative position —
motivating without being competitive.
**Infrastructure:** `@convex-dev/aggregate` (global session count aggregate, already installed for P1)
**Profile screen:** Small line — secondary to personal insights
**Build wave:** Wave 3
**Effort:** M — extend aggregate with global index, query user's position
**Why premium:** Optional motivator. Nice once aggregate is installed anyway.

---

#### P16 — Monthly Patterns Report
**Spec name:** Monthly Patterns Report
**User-facing:** "Your emotional landscape this month"

**What:** "Anxiety was predominant (12 sessions). Your clarity score grew from 5.2 to 7.8.
Relationships and identity were the most frequent themes." Generated once per month, stored,
accessible in timeline.
**Infrastructure:** `@convex-dev/crons` (monthly per-user job) + Anthropic generation
**Profile screen:** Link to last report
**Build wave:** Wave 3
**Effort:** XL — crons + complex AI prompt + storage + display
**Why premium:** AI tokens per user per month. Luxury tier.

---

## Tier Classification Summary

| Spec name | User-facing name | Tier | Wave | Profile screen |
|-----------|-----------------|------|------|----------------|
| F1 — Moments Processed Counter | "You've shown up 47 times" | Free | 1 | Yes (headline) |
| F2 — Current Streak | "Day 12" | Free | 1 | Yes |
| F3 — Top Emotions | "What keeps showing up" | Free | 1 | Yes (chips) |
| F4 — Mood Delta Summary | "Most sessions end lighter" | Free | 1 | Yes (one line) |
| F5 — Temporal Rhythm | "Your rhythm" | Free | 1 | Yes (small) |
| F6 — Milestone Acknowledgments | "You've shown up 30 times" | Free | 2 | Yes (earned markers) |
| P1 — Emotional Frequency Map | "Emotional Constellation" | Premium | 2 | Teaser |
| P2 — Intensity Trend | "Intensity Arc" | Premium | 2 | Sparkline teaser |
| P3 — Specificity Growth | "Your words are finding you" | Premium | 2 | One stat teaser |
| P4 — Life Domains | "What you keep bringing here" | Premium | 2 | Insights screen |
| P5 — Your Language | "Words That Keep Finding You" | Premium | 2 | Small preview |
| P6 — Mirror Quality Score | "Mirror Resonance" | Premium | 2 | Insights screen |
| P7 — Secondary Emotion Patterns | "What's underneath" | Premium | 2 | Insights screen |
| P8 — Temporal Orientation | "Temporal Context Shift" | Premium | 2 | Insights screen |
| P9 — Path → Mood Correlation | "What Works For You" | Premium | 2 | Insights screen |
| P10 — Post-Mood by Emotion Type | "What tends to clear, what tends to stay" | Premium | 2 | Insights screen |
| P11 — Entry Style | "How you arrive" | Premium | 2 | Profile (one line) |
| P12 — Session Weight Map | "Your heaviest moments" | Premium | 2 | Insights screen |
| P13 — Weekly Emotional Weather | "This week's weather" | Premium | 3 | Pinned card |
| P14 — Personal Emotional Memory | "I remember" | Premium | 3 | Reflect screen |
| P15 — Percentile Positioning | "You reflect more than most" | Premium | 3 | Profile small line |
| P16 — Monthly Patterns Report | "Your emotional landscape this month" | Premium | 3 | Link in profile |
| P17 — AI-Generated Insight Video | "Your journey" | Premium | 4 | Card when ready |

---

## Build Order (Waves)

### Wave 1 — Profile Screen Launch

**Goal:** Ship the profile screen with a working free tier. No new infrastructure.
**Data:** All from existing schema. Zero schema changes.
**Estimated effort:** M (2-3 days for profile screen + queries)

Build in this order:
1. Profile screen shell + navigation routing
2. Session count query + display (F1)
3. Streak integration into profile (F2 — mostly done)
4. Top emotions display from `dominantEmotionTags` (F3)
5. Mood delta query + summary stat (F4)
6. Typical usage pattern display (F5)
7. Premium teaser sections — show real insight, blur/lock the depth

**Schema changes:** None
**New tables:** None
**New Convex functions:** ~3 queries (mood delta, profile summary, usage pattern read)

---

### Wave 2 — Premium Insights Infrastructure

**Goal:** Ship the insights screen with core premium features. Install Convex components.
**Trigger:** After profile screen launches and you have conversion data from the paywall.
**Estimated effort:** XL (2-3 weeks)

Install order:
1. **`@abdssamie/convex-checkpoints`** — milestone tracking (F6)
2. **`@convex-dev/aggregate`** — emotional constellation (P1), percentile later (P15)
3. Wire aggregate into `jobs/profileStats.ts` — call `aggregate.insert()` on session complete
4. Add `topUserLanguageTags` aggregation to `profileStats.ts` — frequency-ranked, decay-weighted (unlocks P5 without full session scan on every profile render)
5. Build intensity arc (P2), specificity growth (P3), mirror resonance (P6)
6. Build life domains (P4), words that keep finding you (P5), entry style (P11)
7. Build path→mood (P9), emotion×mood (P10), session weight map (P12)
8. Build secondary emotion patterns (P7), temporal context shift (P8)
9. Insights screen UI — all premium features with paywall gate

**Schema changes:** None (aggregate/checkpoints are component tables)
**New Convex functions:** ~10-12 queries/mutations
**New UI screens:** Insights screen (separate from profile)

---

### Wave 3 — AI-Generated & Semantic Features

**Goal:** Features that make premium feel irreplaceable.
**Trigger:** After subscription tier is live and paying users fund AI costs.
**Estimated effort:** XXL (3-4 weeks)

Install order:
1. **`@convex-dev/crons`** — per-user dynamic scheduling
2. **`@convex-dev/rag`** — personal emotional memory
3. Weekly weather generation pipeline (P13) — cron → AI → stored summary → display
4. Personal emotional memory injection into articulator (P14) — index mirrors, inject K-nearest into prompt
5. Monthly patterns report (P16) — deeper AI generation + storage
6. Percentile positioning (P15) — extend aggregate with global index

**Schema changes:** New table `insight_reports` (`{ emotionalProfileId, type: "weekly"|"monthly"|"video", generatedAt, content, weekOf/monthOf, sessionContextIds, storageId? }`)
**New Convex functions:** ~5-8 actions/mutations/queries

---

### Wave 4 — Experiential Layer

#### P17 — AI-Generated Insight Video
**Spec name:** AI-Generated Insight Video
**User-facing:** "Your journey" / "Xolace Wrapped"

**What:** A 60–90 second personalized video generated from the user's session data.
Emotion patterns, recurring words, mood journey, milestones — narrated and animated.

**Tier:** Premium
**Build wave:** Wave 4 (Wave 3 reports must be live to provide source material)
**Profile screen:** Link/card when a new video is ready — "Your 30-session journey →"

**Technical approach — Remotion + ElevenLabs + Claude script:**

Remotion renders React component templates server-side into MP4. Session data drives
the animations — emotion charts, `userLanguageTags` appearing one by one, mood delta
arc, session milestones. Data-precise because it is code, not generation. No hallucination.

Pipeline:
1. **Trigger** — Checkpoints fires at 30, 100 sessions + anniversary of `firstSessionAt`
2. **Script** — Anthropic action reads aggregate insight data → generates ~150-word narration in user's emotional register
3. **Voice** — ElevenLabs TTS converts script using user's existing mirror voice setting (already integrated)
4. **Render** — Remotion Lambda renders React template with user data + audio → MP4 (~30s on Lambda)
5. **Storage** — MP4 stored in Convex file storage (`v.id("_storage")`)
6. **Notify** — Crons component notifies user when ready

Estimated cost per video: < $0.15 (Remotion Lambda + ElevenLabs TTS + Anthropic script combined).

**Visual approach:**
- Campfire/ember aesthetic as base (already in Xolace brand)
- AI-generated background footage (Sora/Runway) used as background only — data and text overlaid by Remotion
- Remotion template sections:
  - Opening: session count + "since [firstSessionAt date]"
  - Emotion arc: primaryEmotion breakdown as animated color washes
  - Your words: `userLanguageTags` revealed one by one with frequency counts
  - Mood delta: "X% of your sessions ended lighter" as gentle animation
  - Closing: streak + milestone acknowledgment

**Trigger schedule:**

| Milestone | Video type | Source material |
|-----------|-----------|-----------------|
| 30 sessions | "Your journey so far" (short) | Wave 2 insight data |
| 100 sessions | "Your patterns" (full) | Wave 2 + Wave 3 reports |
| Anniversary of `firstSessionAt` | Annual wrap | Full history |

**Shareable version (growth mechanic):** Stripped 15-second square (Instagram/TikTok ready).
Session count, dominant emotion, mood delta, campfire visual, "Processed on Xolace" tagline.
User opts in to share. Organic acquisition: someone shares their Xolace video, a friend asks
"what is this?"

**New infrastructure required:**

| Item | Notes |
|------|-------|
| Remotion Lambda | New — called from a Convex `"use node"` action |
| `insight_reports` table | Already planned in Wave 3 — add `storageId` field for MP4 |
| ElevenLabs TTS | Already integrated for mirror audio — extend for narration |
| Crons component | Already installed in Wave 3 |

---

## Profile Screen Information Architecture

The profile screen is a "you" dashboard — not settings, not history (that's the timeline).

```
┌─────────────────────────────────┐
│  "With Xolace since Jan 2026"   │
│                                 │
│  47 moments · Day 12            │  ← F1 + F2
│                                 │
│  [anxiety] [grief] [confusion]  │  ← F3
│                                 │
│  Most sessions end lighter      │  ← F4
│  You tend to arrive on evenings │  ← F5
│                                 │
│  ──── Your insights ────        │
│  [You've shown up 30 times ✓]  │  ← F6 (Wave 2)
│                                 │
│  PREMIUM ─────────────────      │
│  [🔒 Emotional Constellation]   │  ← P1 teaser
│  [🔒 Your words are finding you]│  ← P3 teaser
│  [🔒 "trapped · invisible"]     │  ← P5 teaser (real data, blurred depth)
│  [Upgrade → See your patterns]  │
└─────────────────────────────────┘
```

**Key design principles:**
- Free tier must feel valuable, not crippled. Real insights, not locked placeholders.
- Premium teasers show WHAT the insight is — real data, blurred depth. "Your most common
  emotion is anxiety (seen in 60% of sessions) — see the full constellation." That creates
  desire. A generic padlock does not.
- No avatar/photo. Profile identity = emotional identity, not social identity.

---

## Data Collection Gaps (What Needs Adding)

Almost nothing is missing. The only genuine additions needed:

1. **Aggregate seeding** — `emotional_metadata.primaryEmotion` exists, but the aggregate
   component needs to be seeded from session completion. Wire `jobs/profileStats.ts` to call
   `aggregate.insert()` after each session. Needed for P1.

2. **`topUserLanguageTags` on profile** — `userLanguageTags` lives per-session only. A background
   job in `profileStats.ts` should maintain a `topUserLanguageTags` array on `emotional_profiles`
   (frequency-ranked, decay-weighted toward recent). Prevents full session scan on profile render.
   Needed for P5.

3. **Historical backfill** — existing sessions won't have aggregate entries when Wave 2 deploys.
   Run a one-time backfill mutation on deploy. Design this before Wave 2 kicks off.

4. **`insight_reports` table** (Wave 3) — `{ emotionalProfileId, type: "weekly"|"monthly"|"video",
   generatedAt, content, weekOf/monthOf, sessionContextIds, storageId? }`.

---

## Backlog (Architectural Decisions Required Before Building)

These are not in any wave yet. They need product decisions first.

---

### BL1 — The Heard Loop

**What:** When a user contributes to the anonymous reflection pool and their reflection
resonates with others, there is currently no privacy-safe way to notify the source user —
the schema intentionally has no path back. The `reflection_resonance` table exists but severs
the link to contributor identity.

**What it would unlock:** "Something you shared in March was felt by 94 people." Quietly
powerful. Prosocial without being a social network.

**Architectural proposal:** A new table linking resonance aggregates to `sessionId` (not
`profileId` directly) as a one-hop privacy-safe bridge. The session links to the profile, but
the resonance table only links to the session — one degree of separation preserved.

**Decision needed:** Does knowing your anonymous contribution reached 94 people feel like
recognition or surveillance? This could land either way depending on framing. Needs product
design review before building.

---

### BL2 — 24h Mood Check-in

**What:** An optional lightweight notification 24 hours after a session: "How are you
carrying that now?" — one tap (lighter/same/heavier). Would unlock post-processing trends
and make the existing `postSessionMood` data significantly more useful.

**What it would unlock:** Path effectiveness with a 24h lag — "Peer reflections feel the same
in the moment but lighter 24 hours later." Genuinely novel insight no app currently provides.

**New data needed:** `postSession24hMood` field on sessions. Per-session opt-in or global
opt-in in preferences. New notification infrastructure for one-off 24h-delayed pushes.

**Decision needed:** Is a 24h notification consistent with Xolace's non-nagging brand promise?
The content is completely different from streak guilt — it's a genuine check-in. But it requires
product philosophy alignment before building.

---

## Convex Component Install Priority

| Component | Justification | Install When |
|-----------|--------------|--------------|
| `@abdssamie/convex-checkpoints` | Milestones (F6) + insight unlock gates | Wave 2 start |
| `@convex-dev/aggregate` | Emotional constellation (P1), percentile (P15) | Wave 2 start |
| `@convex-dev/sharded-counter` | Peer reflection resonance counts at scale | Wave 2 (peer reflections, not insights) |
| `@convex-dev/crons` | Weekly weather (P13), monthly reports (P16) | Wave 3 start |
| `@convex-dev/rag` | Personal emotional memory (P14) | Wave 3 (after crons) |

---

## The Unique Differentiators

Features that don't exist in any journaling or wellness app. The actual premium pitch.

1. **Words That Keep Finding You (P5)** — `userLanguageTags` captures the user's own emotional
   vocabulary. "You've used 'invisible' 7 times." The word is theirs, not the AI's. No app tracks this.

2. **Specificity Growth (P3)** — tracking whether you're getting better at emotional articulation
   over time. Requires the `specificity` field from the AI classifier. Day One, Reflectly, Stoic
   cannot do this.

3. **Mirror Resonance (P6)** — knowing that your mirror lands on the first try 84% of the time,
   and seeing that trend improve, is a feedback loop unique to Xolace's interaction model.

4. **Personal Emotional Memory (P14)** — the AI that remembers your exact emotional texture from 3
   months ago and brings it forward. Once users have 6+ months of indexed emotional history, leaving
   means losing that memory. That's the moat.

The premium pitch is not "unlimited sessions." It is: **"Deeper self-knowledge that compounds over time."**

---

## Open Questions

1. **Profile screen navigation:** Tab? Header press? Settings entry? Determines discoverability of the entire insight layer.

2. **Premium gate mechanics:** Paywall check on Convex query side or client side? Recommendation:
   always gate on Convex — return data only if subscribed, return `null` with `premiumRequired: true`
   otherwise. Never rely on client-side gate for access control.

3. **Backfill plan for existing sessions:** When aggregate installs, what's the plan? One-time job
   on deploy. Design before Wave 2 kicks off, not after.

4. **Heard Loop and 24h Check-in:** Both need product philosophy decisions before any code is written.
   See BL1 and BL2 above.

---

## Status

DRAFT — pending:
- Profile screen navigation decision (open question 1)
- Premium teaser strategy
- BL1 and BL2 product decisions
