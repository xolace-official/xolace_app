# Xolace — Complete Project Planning Summary

**Purpose of this document:** This is a comprehensive summary of all planning, architecture, design, and strategic decisions made during the Xolace product planning session. It is being shared for external review. Please evaluate the decisions critically — identify blind spots, flawed reasoning, missing considerations, over-engineering, under-engineering, and anything that wouldn't survive contact with real users or real scale.

---

## 1. What Xolace Is

Xolace is an emotional processing app. Not a chatbot. Not a social network. Not therapy.

People open Xolace when they feel something they can't name — heavy, anxious, numb, confused — but not "bad enough" for therapy. The app asks one question: "What's here right now?" The user either writes what they're experiencing or vents into a voice session that disappears when they're done. An AI reads what they expressed and mirrors it back with more precision than they could find themselves — 1-3 sentences that make them think "yes, exactly, that's what I'm feeling." Then they choose: sit with a short guided exercise, see words from strangers who felt the same thing, or simply close the app knowing what they're feeling is enough.

Sessions are self-contained and take a few minutes. No feeds. No ongoing conversations.

### Core Thesis

There is a massive gap between "Everything is fine" (social media performance mode) and "I need therapy" (clinical intervention). Most people live in that gap — and most existing tools assume users already know what they're feeling and are ready to engage with support. **Most people are stuck at an earlier layer: they feel something but cannot name it.** Without that clarity, they don't seek help, and when they do, they don't benefit from it as quickly.

Xolace exists to close that gap as **emotional processing infrastructure** — the articulation layer that makes every other form of support more effective.

### What It Is NOT

- Not a chatbot (no chat bubbles, no conversation threads, no back-and-forth)
- Not a social app (no feed, no profiles, no followers, no public content)
- Not a wellness app with forced positivity (no gamification, no streak guilt)
- Not clinical (no diagnoses, no therapeutic terminology)
- Not an AI companion/relationship (no parasocial attachment by design)

### The Metaphor

A digital campfire. You sit by the fire alone. The flames help you see what you're carrying. Sometimes you hear quiet voices from others in the darkness — strangers who feel what you feel. The fire is the AI. It illuminates and warms but is not a participant. It's infrastructure.

---

## 2. Strategic Positioning

### The Redesign

The original Xolace concept was drifting toward "social platform with AI features" — competing simultaneously with Reddit (anonymous expression), Headspace (guided wellness), BetterHelp (therapy access), and Character AI (AI companionship) while being worse than all of them at their core job.

The redesign forces a sharper thesis: **Xolace = Emotional Processing Infrastructure.** AI is not a feature bolted on — it is the nervous system of the entire product, invisible to the user.

### Competitive Landscape

**Primary threat: Ash (by Slingshot AI)** — $93M raised (a16z, Felicis, Radical Ventures). Voice-first AI therapy companion. Remembers conversations, detects patterns, delivers weekly insights. Trained on a proprietary behavioral health dataset covering CBT, DBT, ACT, psychodynamic therapy, and motivational interviewing.

**Xolace's differentiation from Ash:**

1. **Ash is a chatbot. Xolace is not.** Ash creates a conversational relationship between user and AI. Xolace's AI is invisible infrastructure — the user never "talks to" it. They express, the AI mirrors, they move on.
2. **Ash is solitary. Xolace has human connection.** Ash is you alone with an AI forever. Xolace connects you to real humans who feel what you feel through anonymous peer reflections and structured shared spaces.
3. **Ash wants to be therapy. Xolace doesn't.** By positioning as AI therapy, Ash accepts clinical constraints (regulatory scrutiny, liability, clinical validation requirements). Xolace sits before/between/outside therapy — a dramatically larger addressable market.
4. **Ash creates dependency. Xolace prevents it.** Users open Ash 5x/day for emotional conversations. Xolace sessions are 3-8 minutes, and the app encourages you to leave. Anti-addiction design is a trust moat.

**The deeper competitive insight:** Most competitors — AI companions, therapy apps, journaling tools — are designed for users who already know what they're feeling and are ready to engage. They don't address the earlier problem: people who feel something but can't name it. Without articulation, they don't seek help or don't benefit from it when they do. That's the layer nobody is building for, and it is the layer Xolace owns.

**The AI companion → real human handoff:** Users of AI companion apps already know the relationship is an illusion. They use it anyway because it's available and non-judgmental. But once they can articulate what they feel, they want real human connection and real help — not more AI. Xolace is positioned exactly at that transition: it gives users the language they need, then routes them toward real humans (peer reflections, Phase 2 resonance matching, Phase 3 therapy marketplace). AI companions have no answer for this. Xolace is designed for it.

**Clinician validation:** Mental health counselors confirmed this directly — understanding a client's emotional state before a session meaningfully improves and speeds up the work. Xolace is the layer that makes professional support more effective, not a replacement for it. This is the B2B thesis: Xolace as intake infrastructure for universities, employers, and therapy practices.

**Secondary competitors:** Rosebud (AI journaling), Flourish (Harvard-validated wellness), Wysa (CBT chatbot), Woebot (shut down its chatbot app despite $123M raised — validates that the chatbot-as-therapist model is hard to sustain).

**Nobody occupies Xolace's exact position:** AI-powered emotional articulation (not chatbot conversation) + anonymous peer resonance (not social network) + longitudinal emotional intelligence (not mood tracking) + non-prescriptive design (not therapy).

### Revenue Model

**Principle:** The thing that helps people must be free. Gating human connection behind money betrays the mission.

**Free tier ("The Exhale"):**
- Unlimited sessions (input → mirror → path selection)
- "I just needed to say it" path (always free)
- Basic peer reflections (2-3 per session)
- Contribute reflections to the pool
- 7-day session history

**Premium tier ("The Mirror") — $9.99/month or $79.99/year:**
- Full timeline history (all sessions, forever)
- Pattern insights (Layer 3 — emotional trajectories, recurring themes)
- Mirror tone calibration (poetic/gentle/direct/adaptive) *(currently in base schema; tier gating not yet enforced)*
- Expanded peer reflections (5-7 per session, better matching)
- Contextually matched exercises (not generic)
- Session export
- Resonance matching (1/month free, unlimited premium) — Phase 2
- Circles (small group, persistent) — Phase 2

**Future revenue streams:**
- Voice premium (Phase 2)
- B2B/Enterprise: $5-12/employee/month for companies/universities (Phase 2-3)
- Therapy marketplace: 15-20% of first 3 sessions from warm referrals (Phase 3)
- Emotional intelligence API (Phase 3+, speculative)

**Rejected models:** Advertising (morally incompatible), pay-per-session (kills habit loop), token/credit systems (creates anxiety about using the product), data licensing (trust-destroying).

**Revenue phasing:**
- Month 1-6: Free only. Prove retention. $0 revenue.
- Month 6-12: Freemium subscription. Target 5-8% conversion.
- Month 12-18: Voice premium, B2B pilots.
- Month 18-30: Enterprise deals, therapy marketplace beta.

---

## 3. Product Architecture — Three Layers

### Layer 1: SENSE — The Emotional Awareness Engine (MVP)

Helps users understand what they're feeling when they can't articulate it themselves. The core product.

**The flow:** User expresses (text or texture words) → AI classifies emotion → AI generates mirror (1-3 sentences) → User confirms/refines → User chooses a path (exercise, peer reflections, or close) → Session ends.

**Key insight:** The core problem is articulation, not expression. People don't lack places to talk. They lack language for what they feel. If Xolace can help people name and externalize their emotions, the relief comes from the articulation itself.

### Layer 2: BRIDGE — Intelligent Routing (Phase 2)

After articulation, the AI routes to the right support: solo processing, resonance matching with peers, guided micro-practice, or escalation to professional resources.

**Resonance matching is asynchronous by default.** Two people don't need to be online simultaneously. User A completes a session. The system finds User B's session from the last 48 hours with a similar emotional fingerprint. Both enter a shared reflection space — 3 structured rounds of seeing each other's reflections and responding to AI-generated prompts. Not a chat. Not a conversation. Recognition.

**Circles (Phase 2+):** Persistent groups of 5-8 people, AI-curated by emotional patterns. Weekly rhythm: Monday prompt, Thursday connections surfaced, Sunday group reflection. Anonymous within the circle (persistent pseudonyms like "Ember 3"). 4-week cycles.

### Layer 3: REFLECT — The Emotional Mirror Over Time (Phase 3)

Longitudinal pattern detection. Over weeks and months, the AI builds a private emotional map — patterns users can't see themselves, progress invisible day-to-day, connections between emotions and life events.

---

## 4. The AI Service Architecture

### Processing Pipeline (Per Session)

The AI pipeline runs entirely as Convex `internalAction` functions in Node.js runtime — no separate AI microservice.

```
Step 1: CONTEXT BUILDING → Convex query loads user history, profile, preferences, recent metadata
Step 2: RATE LIMIT → Per-profile rate limiter guards against abuse before any LLM calls
Step 3: PATTERN SUMMARY → Pure function builds behavioral context from profile history
Step 4: PARALLEL → OpenAI moderation + Haiku classification run concurrently (both cache-backed)
Step 5: SAFEGUARD → Rule engine evaluates moderation + classification → none/gentle/elevated/crisis
Step 6: ARTICULATE → Sonnet generates the mirror (1-3 sentences)
Step 7: DELIVER → Mirror + escalation flag written atomically in a single mutation
Step 8: STORE METADATA → Emotional classification stored in emotional_metadata table
Step 9: DISTILL → Haiku speculatively distills the mirror for the reflection pool (background job)
Step 10: ESCALATE → If crisis/elevated, escalation_event record created
```

**Refinement turns ("Not quite" / "Say more"):** Skip moderation + classification entirely. Reuse existing emotional metadata. Only Step 6 (Sonnet re-articulation) runs with the revised context.

### The Articulation Engine — 5 Principles

1. **Mirror, don't diagnose.** Never: "It sounds like you're experiencing anxiety." Instead: "There's a restlessness in what you're describing — like your body is bracing for something your mind hasn't caught up to yet."
2. **Use their words, then expand.** If they said "stuck," the mirror says "stuck" and adds dimension.
3. **Keep it short.** Maximum 3 sentences. Brevity creates impact.
4. **Match their energy.** Casual input gets casual mirroring. Raw intensity gets depth.
5. **Invite, don't prescribe.** "Is this close?" — never "You should try journaling about this."

### API Calls Per Session

- **Normal session:** OpenAI moderation + Haiku classification + Sonnet articulation + Haiku distillation = 4 API calls (moderation and classification run in parallel)
- **With refinement:** +1 Sonnet call per "Not quite"/"Say more" turn (max 2 turns; no re-moderation or re-classification)
- **Cache hit (identical input):** Moderation cached 48h, classification cached 7 days, distillation cached 30 days via `@convex-dev/action-cache`

### Safeguard Levels

- **`none`:** Normal flow. 95%+ of sessions.
- **`gentle`:** Moderate distress signals. Normal flow continues; soft resource mention may appear.
- **`elevated`:** Significant risk signals (moderate self-harm scores, high-intensity distress emotions, pattern escalation across recent sessions, or survivor trauma disclosure). Resources shown alongside the mirror.
- **`crisis`:** Acute risk (explicit self-harm intent or high self-harm score + intensity ≥9). Mirror still shown (user deserves to feel seen), but paths replaced with warm escalation. Crisis resources presented with care, not alarm.

Content that violates policy outright (e.g., `hate/threatening`) triggers a session rejection before articulation.

### Cost Estimate

At 500 DAU, ~1.5 sessions/day: Anthropic API (Haiku + Sonnet) ~$80-130/month + OpenAI moderation API ~$5-10/month. Cache hits significantly reduce cost for returning patterns. Manageable at MVP scale.

---

## 5. Technical Stack

| Layer | Tool | Rationale |
|---|---|---|
| Mobile Framework | Expo (SDK 52+) + Expo Router | Cross-platform, mobile-first, OTA updates |
| UI Animations | React Native Reanimated 3 | Fluid emotional transitions on UI thread |
| UI Components | HeroUI Native + Uniwind (Tailwind v4) | React Native component library with Tailwind-style className props |
| Backend / DB | Convex | Real-time subscriptions, reactive queries, serverless functions, type safety |
| Auth | Clerk (`@clerk/expo`) | JWT-based, Apple + Google OAuth. |
| AI Articulation | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Best emotional tone calibration, follows nuanced system prompts |
| AI Classifier / Distiller | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Fast, cheap, structured JSON output |
| AI Hosting | Convex Node.js runtime (`"use node"` actions) | No separate AI service needed — Convex handles it directly |
| Content Moderation | OpenAI `omni-moderation-latest` | Parallel safety check on every raw input before articulation |
| AI Call Caching | `@convex-dev/action-cache` (Convex component) | Cache moderation (48h), classification (7 days), distillation (30 days) |
| Voice STT (Phase 2) | Deepgram | Fast transcription + sentiment/tone from audio signal |
| Voice TTS (Phase 2) | ElevenLabs | Most natural AI voice for mirror read-back |
| Analytics | PostHog | Privacy-friendly, self-hostable, generous free tier |
| Error Tracking | Sentry (`sentry-expo`) | Crash monitoring |

**Storage:** Raw input stored as plaintext in Convex (`rawInput`). No app-level encryption needed — Convex encrypts data at rest and TLS encrypts all data in transit.

### Project Structure (single Expo app + Convex backend)

```
xolace_app/
├── src/
│   ├── app/           ← Expo Router pages & layouts
│   │   ├── (onboarding)/
│   │   ├── (auth)/
│   │   └── (protected)/
│   ├── components/    ← UI components
│   ├── hooks/         ← Custom hooks (reflection machine, session, etc.)
│   ├── store/         ← Zustand state
│   └── context/       ← React contexts (theme)
├── convex/            ← Convex backend
│   ├── ai/            ← AI pipeline (process, clarify, safeguard, prompts, providers)
│   ├── jobs/          ← Background jobs (distillation, notifications, data wipe)
│   ├── lib/           ← Auth helpers, rate limits, validators
│   ├── schema.ts
│   └── crons.ts
└── assets/
```

**Rejected alternatives:** Flutter (Dart learning curve, JS/TS end-to-end is better), Firebase (NoSQL gets messy for relational emotional data), Supabase (more glue code than Convex), separate Railway AI service (Convex Node.js actions eliminate the need), Next.js for web (no web app at MVP — mobile only).

---

## 6. Database Schema

### The 12 Tables

| Table | Purpose | Key Design Decision |
|---|---|---|
| `users` | Auth shell only. Nothing emotional. | **Decoupled from emotional data.** A breach reveals auth tokens but zero emotional content. |
| `emotional_profiles` | Pseudonymous emotional identity. | **The bridge** (`users.emotionalProfileId`) is the most sensitive mapping. Breach of this table reveals patterns but no real-world identities. |
| `preferences` | User configuration (theme, tone, notifications, privacy). | **Separate from profile** because config updates on user action, profile updates on session completion. Different access patterns. |
| `sessions` | One per emotional processing cycle. | **State machine** (`initiated → input_received → processing → mirror_delivered → confirmed → path_selected → path_in_progress → completed → abandoned → error`). Tracks exactly where users drop off. `rawInput` stored as plaintext (Convex encrypts at rest; TLS in transit). `inputDuration` and `freezeOccurred` capture pre-articulation behavior. `mirrorModelVersion` tracks which AI version produced this mirror. |
| `session_turns` | Each refinement loop ("Not quite" / "Say more"). | **Separate from sessions** because the delta between attempt 1 and the confirmed mirror is the purest signal for improving the AI. |
| `emotional_metadata` | AI's structured interpretation of a session. | **Separate from sessions** so it can be re-classified when models improve. Includes `classifierVersion`, `primaryEmotionConfidence`, `granularLabel`, `userLanguageTags` (the user's own emotional words preserved as tags). |
| `reflections` | Anonymized peer reflection pool. | **NO reference to users, profiles, or sessions.** Link severed at creation time. Anonymity is structural, not policy. Content is AI-distilled (Haiku), not raw user text. |
| `reflection_resonances` | Junction table for "I feel this too" taps. | **Deduplication** — one record per (profile, reflection) pair. Enables true toggle and prevents inflated resonance counts from reinstalls. |
| `exercises` | Micro-exercise library (authored content). | Seeded at MVP. Tagged by emotion + intensity range. Each has typed steps (text/timer/prompt). |
| `escalation_events` | Safety-critical records when AI detects risk. | **Survives account deletion.** Anonymized (profileId stripped) but retained for safety auditing. Must be disclosed in privacy policy. |
| `notification_log` | Every nudge sent. | Tracks delivery, effectiveness (`resultedInSession`), suppression reasons. Prevents spam. |
| `consent_records` | Granular consent tracking. | **Append-only.** Never mutate. Granting creates a record. Revoking creates a new record. Full chain preserved for legal audit. Tracks consent language version. |

### Key Architectural Decisions

- **Emotions are strings, not enums.** Vocabulary grows with the product. No schema migrations when adding "bittersweet."
- **No embeddings at MVP.** Reflection matching uses emotion tags + themes + intensity. Embeddings added when pool exceeds ~5,000 entries.
- **`userLanguageTags`** on `emotional_metadata` preserves the user's own emotional words ("stuck," "glass wall," "drowning") separately from clinical labels. Powers REFLECT insights: "You keep coming back to the word 'trapped.'"
- **`primaryEmotionConfidence`** (0.0-1.0): Below 0.6 treated as ambiguous. Ambiguity itself is meaningful data.
- **`temporalContext`**: Whether the expression is past/present/future focused. Affects mirror calibration.
- **Speculative distillation**: Haiku distills a reflection candidate immediately after every session (before the user decides to contribute). By the time they're asked, the distilled text is ready to show them for consent review.

---

## 7. UI Design

### Screen Architecture

**10 actual screens in Expo Router.**

- 2 onboarding screens (Promise, Frame)
- 1 auth screen (Google OAuth via Clerk)
- 1 Core Screen (reflect) — the 9-state machine
- 3 standalone path screens (Sit With This, Peer Reflections, Session End)
- 2 secondary screens (Timeline list, Session Detail)
- 1 settings screen

### The Core Screen — 9-State Machine

The reflect screen is driven by `useReflectionMachine()` — a single screen that reshapes itself through states. No navigation occurs within the core flow. States:

1. **Idle** — "What's here right now?" + texture word tags
2. **Typing** — Freeform text input. 8s pause detection triggers a gentle nudge.
3. **Processing** — Breath animation while Convex generates the AI mirror
4. **Mirror** — AI reflection displayed. User chooses: "That's it" / "Not quite" / "Say more"
5. **Clarify** — Follow-up input for refinement (max 2 turns)
6. **Gave Up** — After 2 turns without confirmation. Empathetic message + options.
7. **Escalation** — Conditional. Triggers if server flags `escalationTriggered`.
8. **Path Selection** — Three choices: Solo / Peers / Exit
9. **Error** — Retry or reset

### Onboarding Flow

```
Splash (auto 1.5s) → Promise ("This is a space to be honest.")
→ Frame ("You share. AI helps you understand.")
→ Auth (Apple/Google — last, after trust is earned)
→ Core Screen
```

**Auth is last, not first.** Every piece of trust-building context comes before the friction moment. The user understands what they're committing to before being asked to commit.

### Critical Design Decisions (From Opus Review)

1. **Freeze state solved with texture words.** Every entry screen has a secondary scaffold below the text area: tappable texture words (heavy, tight, buzzing, empty, foggy, scattered, numb, restless). Users who can't type can tap 2-3 words and the AI generates a mirror from them alone. Also: Body Area Entry as an alternative screen ("Where do you feel it?").

2. **No resonance counts on peer reflections.** The heart is a binary "I felt this too" toggle. No numbers. No implicit ranking of whose pain resonated more. Resonance counts exist in the database for internal quality ranking but never surface to users.

3. **Contribution prompt moved to session close.** Not shown immediately after viewing peer reflections (where emotional momentum creates coercion). Shown after a beat of quiet on the close screen: "What you shared today — would you want it to exist anonymously for someone who might feel the same?"

### Design Language

- **Dark, warm, still.** Deep indigo background (hue 285 in OKLCH), not cold tech-black.
- **Soft lavender accent** (oklch 0.75 0.10 285). Present but never demanding. Like twilight.
- **Warm amber** for presence (the nudge, the presence dot, escalation). Like candlelight.
- **Serif for emotional content** (mirror, reflections). Feels written, not generated.
- **Sans-serif for UI** (buttons, labels). Clean, invisible.
- **The submit button says "Let it out"** — not "Send." You're not messaging anyone.
- **Buttons that aren't buttons** in the emotional space. Confirmation options are plain text.
- **Minimal motion.** Breath animation during processing. Gentle fades. Nothing bouncy.
- **App encourages leaving.** Sessions 3-8 minutes. "Go live your life."
- **Notifications OFF by default.** Asked after 3rd session. Contextual and AI-generated when enabled.

### Theming

Using Uniwind (Tailwind for React Native) + HeroUI Native. Multi-theme support planned. Base theme overrides HeroUI defaults with OKLCH color system. All neutrals share hue 285 (violet warmth). Light and dark themes feel like the same room at different times of day.

---

## 8. Data Flow — Operations Map

### Per Session (Foreground)

| Phase | Operations | Latency Target |
|---|---|---|
| App Open | 3 fetches (user, profile, preferences) | < 300ms |
| Session Initiated | 1 insert (sessions) | < 100ms |
| Input Received | 1 update (sessions — metadata only, raw input stays in memory) | < 100ms |
| AI Processing | 2 fetches (context) + 1 AI HTTP call + 1 update (sessions) + 1 insert (emotional_metadata) | < 2 seconds total |
| Mirror Confirmation | 1 update (sessions). If refinement: +1 insert (session_turns) + 1 AI call | < 2 seconds |
| Path Selection | 1 update (sessions) + 1 fetch (exercises or reflections) | < 200ms |
| Session Close | 1 update (sessions — completed) | < 100ms |

### Background Jobs (Event-Triggered)

| Job | Trigger | Operations |
|---|---|---|
| Profile Stats Update | Session completed | Fetch recent metadata → update emotional_profiles (sessionCount, streak, dominantEmotionTags, averageSessionDuration) |
| Speculative Distillation | Mirror delivered (every session) | Haiku distills mirror into reflection candidate → stored on session as `distilledText`. Ready to show the user at contribution prompt before they decide. |
| Reflection Pool Insert | User consents to contribute | Move `distilledText` from session → insert orphaned reflection (no user/profile/session reference) |
| Consent Recording | Contribution consent given | Insert consent_records (append-only) |

### Background Jobs (Scheduled — Convex Cron)

| Job | Schedule | Purpose |
|---|---|---|
| Abandoned Session Checker | Every 15 minutes | Mark sessions as abandoned if user left without completing |
| Gentle Return Notifications | Every 6 hours | Nudge users who haven't had a session in 48h+ (but active within 30 days) |
| Pattern Nudge Notifications | Every 1 hour | Time-aware nudge based on user's typical usage pattern |
| Data Retention Enforcer | Every 24 hours | Purge sessions older than user's retention preference |
| Account Deletion Purger | Every 1 hour | Cascade delete for soft-deleted accounts (anonymize escalation events) |

### Write Frequency at 1,000 DAU

| Table | Estimated Daily Writes |
|---|---|
| sessions | ~1,500 (1 insert + 3-5 updates per session) |
| emotional_metadata | ~1,500 (1 insert per session) |
| emotional_profiles | ~1,500 (stats recompute per session) |
| session_turns | ~450 (~30% of sessions have refinements) |
| reflections | ~300 (contributions + resonance increments) |
| notification_log | ~200 (nudges to eligible users) |
| consent_records | ~50 (first-time contributions + toggles) |
| escalation_events | ~15 (~1% trigger rate) |
| preferences | ~10 (settings changes are rare) |
| users | ~0 (only signup and deletion) |
| exercises | ~0 (seed data, admin only) |

---

## 9. What Has Been Proven — and What's Next

The core question driving the MVP was:

> **Can AI help people articulate emotions they couldn't articulate alone — and does that moment of articulation itself create relief?**

### Closed Beta Results (TestFlight, Month 1 Post-Pivot)

- **20 users, 68 completed sessions**
- **50% returned without prompts or push notifications**
- Users consistently described the reflection as accurate: *"putting how I was feeling into the right words"*
- Sessions were self-contained; no users reported needing more conversation after receiving their mirror

The core thesis holds. The product delivers articulation. Unprompted return at 50% is a strong signal that the relief is real and users remember it.

### The Remaining Questions

The beta proves the session works. What it doesn't prove yet:

- **Does this become a daily or weekly behavior?** 68 sessions across 20 users is ~3.4 sessions per user in the first month. That's promising but not yet habit-forming frequency. The target is 3+ sessions per week.
- **Does voice mode change retention?** The text-first beta didn't include voice sessions. Voice is a fundamentally different emotional experience — lower friction, higher rawness. It may reach a different user segment entirely.
- **Does the 50% retention hold at public scale?** Closed betas over-index on motivated early adopters. Public launch will surface the real retention floor.

### What's Next

- Public beta launch (moving from TestFlight to open)
- Voice session implementation (ElevenLabs STT/TTS)
- Measure 30-day and 60-day retention curves
- B2B pilot with one university counseling center

---

## 10. Strategic Moats

1. **Longitudinal emotional data graph.** Every session builds a personal model. No competitor can replicate 14 months of emotional history without those 14 months.
2. **Pattern intelligence at scale.** Across millions of sessions: "73% of users who feel X in context Y find relief through Z." Proprietary intelligence.
3. **Trust as brand.** First company synonymous with "safe emotional space" wins a position nearly impossible to displace.
4. **AI prompt engineering as IP.** The articulation system prompts are the most valuable IP. Nuanced craft that compounds with iteration.
5. **Network effects through the reflection pool.** More users contributing = better emotional matching = better "you're not alone" moments = more users.

---

## 11. Open Questions / Known Risks

1. **Session frequency vs. daily habit.** The beta showed ~3.4 sessions per user in the first month. The relief of naming a feeling is real. But does it pull users back daily or weekly? Weekly-use apps are significantly harder to grow and monetize. The public beta will clarify this.
2. **Voice mode changes the product.** Adding voice sessions isn't a feature — it may be a different product for a different emotional register. A user who vents verbally and hears a mirror read back to them has a qualitatively different experience than a text session. This needs its own retention measurement.
3. **The $93M threat.** Ash has massive funding and could add peer features or pivot toward articulation if they recognized the gap. Speed to market matters.
4. **Moderation at scale.** Even with AI scaffolding, human connection features (resonance matching, circles) introduce safety risks that grow non-linearly with user count.
5. **Clinical validation.** Flourish has a Harvard RCT. For institutional credibility and Series A fundraising, Xolace should plan for a study — even a small one — within 12-18 months. The counselor validation insight is qualitative right now; it needs to become quantitative.
6. **The question that decides everything:** If Xolace disappeared tomorrow, would users say "I miss that place where I processed my feelings" or "I miss the people there"? The answer should eventually be both. Layer 1 proves the tool. Layers 2 and 3 build the home.

---

## 12. Monthly Cost Estimate (MVP, < 1,000 Users)

| Service | Est. Monthly Cost |
|---|---|
| Expo / EAS | Free tier |
| Convex | Free tier |
| Anthropic API (Sonnet 4.6 + Haiku 4.5) | $50-130 |
| OpenAI API (omni-moderation-latest) | $5-10 |
| Clerk | Free tier (up to 10k MAU) |
| PostHog | Free tier |
| Sentry | Free tier |
| Apple Developer Account | $99/year |
| Google Play Developer | $25 one-time |
| **Total** | **~$70-160/month** |

---

*End of summary. Ready for review.*