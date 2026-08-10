# The Cognition Layer — Xolace's AI-Native Architecture

**Status:** Planned — decisions locked, implementation not started
**Decided:** 2026-07-03 (CEO + architecture session)
**Supersedes:** the "AI features call the LLM directly" pattern (12 independent call-sites as of this writing)

---

## 0. Why this exists

Xolace's vision is the AI-native, **proactive**, end-to-end mental health support
infrastructure — from the first minute someone feels something they can't name,
through passive support (meditation, sleep), to peer counselling, to therapy.
Every future layer (social/community, listeners, therapy) must sit on an
intelligent AI architecture rather than beside it.

Audit finding that motivated this plan: Xolace is AI-native at the **product**
layer (the mirror is impossible without AI) and AI-operational at the **infra**
layer (model routing, caching, fallbacks, rate limits, versioned prompts), but
only AI-*integrated* at the **architecture** layer. Twelve features each rent
the LLM independently; nothing owns the understanding. Context is a sliding
5-row window — a user's 100th session is informed by roughly the same history
as their 6th. The system collects longitudinal gold (confirmation rates,
clarify turns, mood deltas) and feeds none of it back.

The Cognition Layer fixes that: **one intelligence layer that every feature —
current and future — reads from and writes to.**

### Two constraints held throughout

1. **The hot path stays deterministic.** Mirror generation remains a fixed
   pipeline. Safety/crisis decisions remain rule-code (`safeguard.ts`), never
   model-discretionary. Agency lives in the background.
2. **Every memory artifact is wipeable.** Episodic embeddings are keyed by
   `sessionId` so retention purges (6-month / 1-year tiers) and account wipes
   cascade. The semantic profile is registered in the data-wipe pipeline.
   Nothing in this layer may outlive the user's consent.

### The dual-process frame

- **System 1 — the flame** (hot path, deterministic, seconds): today's
  pipeline in `convex/ai/process.ts`, upgraded to *read* from Memory and to
  route on uncertainty. Never agentic.
- **System 2 — the fire that keeps burning while you're away** (background,
  agentic, minutes/days): the Reflection Agent. Writes Memory, decides what
  the person needs next.
- **The membrane between them is Memory**: System 2 writes understanding,
  System 1 reads it. This is what turns "AI-powered sessions" into "an AI
  that knows you."

---

## 1. Phase 1 — Memory

Three kinds of memory, mapping onto how human memory works:

| Kind | What | Where | Written by | Read by |
|------|------|-------|-----------|---------|
| **Episodic** | Per-session composite documents, semantically searchable | `@convex-dev/rag`, `namespace = emotionalProfileId` | Pipeline (post-mirror ingestion) | Articulator context, Reflection Agent, future summaries |
| **Semantic** | AI-written narrative of who this person is emotionally | New `semantic_profiles` table (versioned documents) | Reflection Agent only | Articulator context, Reflection Agent, insights UI |
| **Working** | What this session needs right now | `convex/ai/context.ts` (rewired) | Assembled per request | Hot path |

### 1.1 Episodic memory

**Decision (locked, revised 2026-07-03): embed the full composite *including*
raw user text.** Four sources concatenated:

```
[raw user text]                   ← the user's actual words (max matching + recall fidelity)
[mirror text]                     ← the AI's articulation (always present)
[distilledText, when it exists]   ← compressed emotional core, voice-preserving
[metadata line]                   ← primaryEmotion, granularLabel, intensity,
                                    thematicTags, userLanguageTags, temporalContext
```

Why raw text is in (CEO decision): early user signal is unambiguous — users
hate generic-feeling output. Verbatim recall ("you called it 'the weight of
being unseen'"; "the thing with your manager is back") is the single most
anti-generic capability in this architecture, and it requires the user's
actual words in the index: the search query at session time *is* raw text, so
raw-to-raw embedding similarity is the highest-fidelity match. A derived-only
index was evaluated (see decision log #1) and rejected as leaving the core
personalization value on the table.

Why this is privacy-sound, stated honestly:
- The vector store lives **inside the same Convex deployment** as the
  `sessions` table that already holds raw text — same trust boundary, same
  access controls. Embedding raw text creates a second copy at rest, not a
  new exposure surface. The risk is operational (a purge path missing the
  copy), not fundamental — so it is handled operationally:
- **Retention/wipe parity is a hard invariant.** Embeddings are keyed by
  `sessionId`; the embedding purge lives in the *same* retention and
  data-wipe jobs that delete sessions (`jobs/dataRetention.ts`,
  `jobs/dataWipe.ts`), never a best-effort sidecar. When a session dies, its
  memory dies with it. This parity gets a dedicated test.
- **Transparency, in the product voice, not legalese** (see §1.1b).

Distiller note: `distilledText` (from `jobs/reflectionDistiller.ts`) is a
pool anonymizer — it strips specifics. It stays in the composite as a
compressed emotional-core signal, but raw text now carries the specificity,
so the previously planned "personal distillation variant" is no longer
needed.

### 1.1b Memory transparency & control (locked)

Frank-but-light posture, decided by CEO:
- **In-app disclosure** at a natural moment (e.g. first insight surface), in
  the Xolace voice: *"The fire remembers what you've shared with it — that's
  how it knows you. Its memory is yours: you can shorten it or wipe it
  anytime in Settings."*
- **Privacy policy / ToS**: one honest paragraph — reflections are retained
  and semantically indexed to personalize mirrors, governed by the same
  retention preference the user already controls (6-month / 1-year tiers,
  full wipe).
- **"Personal memory" settings toggle** — on by default; off = new sessions
  embed metadata-only (and optionally purge existing raw embeddings).
  Cheap to build; converts disclosure ("we do this") into agency ("you chose
  this").

Mechanics:
- Ingest right after mirror delivery (piggyback where the distiller is
  scheduled in `process.ts` step 9).
- Key = `sessionId` → re-ingestion is an idempotent replace; retention purges
  and wipes cascade by key (mirror the purge pattern already used for the
  pool namespace in `reflectionsRag.ts`).
- Backfill existing users via a migration over past sessions.
- Embeddings: `text-embedding-3-small` (already configured in `convex/rag.ts`).

### 1.2 Semantic memory — the profile

An AI-maintained narrative document per `emotional_profiles` row. Sectioned:

- **Recurring themes** — what this person keeps carrying
- **Emotional signatures** — e.g. "anger usually masks fear; goes quiet rather
  than escalating"
- **Calibration / what lands** — tone that gets confirmations, mirror length
  preference, poetic-vs-direct response (written by the Phase 4 tone loop)
- **Trajectory** — where things have been heading recently

This upgrades the existing *statistical* proto-memory on `emotional_profiles`
(`dominantEmotionTags`, `frequentWords`, `typicalUsagePattern`) into semantic
understanding. The statistical fields remain as cheap inputs to the agent.

**Decision (locked): "Visible, earned — and always internal."** One artifact,
two consumers: it is *always* the internal working document the articulator
and Reflection Agent read; it is *progressively rendered* to the user as an
insights surface ("what the fire has learned about you"), consistent with the
earned-unlocks philosophy. Consequence: **written in user-safe, non-clinical
language from day one** (also good prompt hygiene). A later iteration can add
user correction ("that's not quite me") feeding back as high-weight memory.

**Versioning (locked in):** append a new document per consolidation pass;
current-version pointer on the profile row. Four reasons:
1. **Rollback** — a bad agent pass corrupts the AI's picture of a vulnerable
   person and every subsequent mirror inherits it; versions make that a
   one-step revert.
2. **Feedback attribution** — Phase 4 needs "confirmation rate dropped after
   profile v14" to be answerable.
3. **Auditability** — when a user says a mirror felt wrong/harmful, we must
   reconstruct exactly what the system believed at that moment. This is the
   standard a therapy-layer company will be held to.
4. **Product** — "watch the fire's understanding of you deepen" is only
   possible if history exists.

Old versions are swept by the same retention machinery. Profiles are small
text; this is cheap.

### 1.3 Working memory — `context.ts` rewired

`buildSessionContext` gains two inputs, replacing the blunt last-5-rows window
as the articulator's context:
- **Top-K episodic matches** for the current input (RAG search, K≈3, personal
  namespace)
- **The current semantic profile** (read whole — it is never vector-searched)

The recent-rows window can remain as a recency signal; the profile carries the
longitudinal weight.

### 1.4 What RAG is and is not (role clarification)

RAG (`@convex-dev/rag`) is **the filing cabinet and the librarian, not the
memory**: it chunks, embeds, stores, and answers similarity queries. The
memory design — what is stored, in whose namespace, the composite format,
write timing, purge paths — is ours, on top. Three roles:
1. Episodic memory store + search (personal namespaces — new)
2. Peer pool semantic matching (already live)
3. The Reflection Agent's `search_episodic_memory` tool (same infra, scoped)

RAG does **not** hold the semantic profile, does not decide relevance beyond
cosine similarity (that's the Phase 4 importance loop), and does not reason.
Retrieval ≠ understanding.

### 1.5 Rejected: a vector on the profile ("user embedding")

Considered and rejected as a primary structure. Averaging a person's emotional
history into one point destroys the temporal/episodic structure that makes the
data valuable (an oscillating griever and a flatliner average to the same
vector), can't answer "when have I felt this before?", drifts meaninglessly,
and no LLM can read a vector — **vectors retrieve, text informs**. The one
legitimate future use — coarse cohort/listener matching by overall emotional
texture — is a *derived* artifact computable later from episodic memory, not a
foundation. Revisit at the peer-counselling layer.

---

## 2. Phase 2 — The Understanding object

**What:** one typed, versioned artifact per session representing everything
the system concluded about that moment: classification + safeguard result +
confidence + which episodic memories informed the mirror + which semantic
profile version was in context. Produced exactly once by the pipeline;
consumed by everything downstream.

### Understanding vs. Memory (the load-bearing distinction)

- **Understanding = a verdict about one moment.** Event-scoped, produced once,
  then effectively frozen: *"this session: grief masked as anger, intensity 7,
  no crisis signal, informed by these 3 memories and profile v12."* Six months
  later it still says what the system concluded that night.
- **Memory = accumulated state across all moments.** Long-lived and mutating:
  the episodic archive grows; the semantic profile is actively rewritten.
- **The loop that is the cognition layer:** Memory is read to produce each
  Understanding; each Understanding is written into Memory. Perception vs.
  knowledge. The separation is what lets the hot path stay fast and
  deterministic while the slow path stays thoughtful.

### Storage — decision (locked): extend `emotional_metadata`, no new table

Reasoning from zero: a separate `understandings` table pays off only with a
different **lifecycle**, **access pattern**, or **ownership** than emotional
metadata. It has none — same purge/wipe rules, same consumers, same indexes.
`emotional_metadata` already *is* the per-session AI-artifact table;
Understanding completes it rather than duplicating it. Fields to add:

- `safeguardLevel` + `safeguardTrigger` (currently scattered across
  sessions/escalations)
- `episodicMatchKeys` — which memories informed the mirror (required by the
  Phase 4 relevance loop)
- `profileVersion` — which semantic-profile snapshot was in context

Plus a shared TS type and one internal query `getUnderstanding(sessionId)` as
the only sanctioned read path.

**Re-split trigger:** if Understanding ever needs a divergent lifecycle (e.g.
outliving the session for therapy-handoff audit trails), split the table
*then* — that's the moment the migration pays.

### The constitution rule

> **No feature may call an LLM to re-derive something the Understanding
> already knows.** All AI features take Understanding + Memory as input. New
> model calls are justified only for genuinely new signal — a new modality
> (voice/vent) or a new artifact type. All model calls live under `convex/ai/`.

Enforcement is convention: this rule goes in `CLAUDE.md` / `AGENTS.md`. It is
the rule that stops 12 fragmented call-sites from becoming 30.

---

## 3. Phase 3 — The Reflection Agent

The background "slow mind." A worker, not a conversationalist: wakes, reads
structured data through tools, thinks, writes structured artifacts, terminates.

### Infrastructure — decision (locked): custom tool-use loop, not `@convex-dev/agent`

- The loop (`while stop_reason === "tool_use"`) is ~150–200 lines against the
  existing fetch-based Anthropic provider, inside an `internalAction`,
  orchestrated by the already-installed `@convex-dev/workflow` for durability,
  throttled by the existing rate-limiter, eventually queued through a workpool
  so background thinking can never starve live mirrors.
- `@convex-dev/agent` assumes the unit of work is a conversation (threads,
  messages, chat-history RAG) and brings the Vercel AI SDK as a second LLM
  stack. Using it here means storing a fake conversation-with-nobody and
  duplicating our RAG namespaces. Wrong shape for a worker.
- **Where chat-shaped infra genuinely fits (parked, see §6):** the peer
  counselling layer (threads between humans with AI assist) and the planned
  bounded "deeper dialogue" mode. The dialogue mode is a *constrained*
  multi-turn loop with our memory injected — closer to this custom loop with
  a turn budget and product-shaped exits than to open chat, so the custom
  loop is leveraged there too.

### Cadence — decision (locked): two tiers, activity-gated, both-whichever-first

1. **Post-session light pass** (Haiku, single structured call, no loop): after
   session completion — updates the profile's fast-moving sections (recent
   trajectory, what landed), flags anything urgent for queueing. Cheap enough
   for every session.
2. **Consolidation pass** (Sonnet, full tool loop): triggered when a user
   accumulates **5 new sessions OR 7 days elapse with activity — whichever
   comes first**. Deep pass: pattern detection across episodic memory,
   semantic profile rewrite (new version), insight generation, follow-up
   decisioning. Activity-gating means cost scales with engagement, not user
   count. No blind nightly cron over all users.

### Tool set

Read: `get_emotion_timeline`, `search_episodic_memory`, `get_recent_sessions`,
`get_mood_deltas`, `get_confirmation_stats`, `read_semantic_profile`.
Write: `update_profile_section`, `write_insight`, `queue_follow_up`,
`propose_notification`. Writes are scoped and validated.

### Consolidation of existing features — strangler pattern

The agent proposes into the same tables existing features already read, so
`generateNotification`, `followUpCardWriter`, and future insight logic get
absorbed **one at a time**, each behind a comparison period — no big-bang
replacement. The unifying question the agent owns: *"what does this person
need next?"* — currently answered in fragments by four separate hand-wired
features.

### Hard safety boundaries

- Never touches the hot path.
- Never makes escalation/crisis decisions — those stay rule-code in
  `safeguard.ts`.
- Never *sends* anything — it queues; existing delivery paths own sending.
- Runs under a per-user token budget (rate-limiter) and pool ceiling.
- Profile writes are versioned (rollback) and validated before commit.

---

## 4. Phase 4 — Feedback loops + routing

Four loops, in build order:

1. **Tone adaptation** *(first — the data already exists: `confirmationState`,
   `toneUsed`, clarify turn counts, mood deltas).* The consolidation pass
   computes per-user "what lands" and writes it into the profile's
   calibration section; the articulator reads it. `adaptive` tone stops being
   a label and becomes learned behavior. This is the loop that makes session
   50 feel different from session 5.
2. **Uncertainty routing.** `primaryEmotionConfidence` + `specificity` gate
   behavior: low/low → "tentative mirror" instruction (softer claim, invites
   correction) or a stronger model tier; high → normal path. Doubles as the
   Plus model-tiering lever already contemplated in the monetization docs.
3. **Memory relevance feedback.** Confirmed mirrors bump the importance weight
   (native RAG feature) of the episodic matches that informed them; "not
   quite" decays them. Memory quality compounds instead of accumulating
   noise. This is why Understanding records `episodicMatchKeys`.
4. **Eval harness.** Confirmation rate becomes the online north-star metric
   per prompt/model version (the existing version-stamping discipline pays
   off here). Offline: grow the `convex/ai/prompts/__evals__/` pattern to
   cover articulator tone rules and profile-writing before each prompt change.

---

## 5. Phase 5 — The platform surface (how future layers consume this)

Every future product in the end-to-end vision is a **consumer of the same
cognition API**:

- **Proactive care** — the Reflection Agent noticing trajectory before the
  user does (this is what makes Xolace proactive where health apps are
  passive/reactive).
- **Peer counselling / listeners** — match listeners by emotional texture
  (RAG over episodic memory / derived cohort vectors); AI assist for listener
  coaching and conversation safety monitoring reads the same Understanding.
- **Therapy layer** — a *consented* handoff brief generated from the semantic
  profile + episodic highlights; the versioned, auditable profile is the
  clinical-grade substrate.
- **Passive layer (meditation, sleep, exercises)** — content selection driven
  by Understanding + profile (the exercise matcher already prefigures this).
- **Deeper dialogue mode** — bounded multi-turn on the custom loop with
  memory injected.

The moat framing: a user's entire emotional history, semantically searchable
and narratively understood, is irreplaceable the way a two-year journal is —
retention through accumulated understanding, not lock-in.

---

## 6. Future research (parked, dated 2026-07-03)

- **Peer-counselling thread model:** `@convex-dev/agent` (thread/message model
  maps 1:1 to human↔human chat with AI assist) vs. owned tables. Includes:
  AI-suggested listener responses, listener coaching, real-time safety
  monitoring on conversations. Decide when that layer is scoped.
- **Crisis sessions in personal memory — PRIORITY revisit (CEO-flagged
  2026-07-03).** The pool rightly excludes crisis sessions; the personal
  namespace is per-user, where remembering crisis moments is not just
  personalization — it is **safety infrastructure**: a safeguard that can see
  "third crisis-adjacent session in six weeks, gaps shrinking" is
  categorically better than one that only sees tonight. Trajectory awareness
  and safeguard context are deemed crucial; the revisit must find a way to
  make this work well, not decide whether to.
  - v1 default (until the revisit lands): metadata-only embedding for crisis
    sessions (no raw/mirror text) — this already gives the safeguard and
    Reflection Agent frequency/interval/intensity trajectory, since
    `emotional_metadata` + `escalation_events` carry riskFlag, trigger type,
    and timing. Most of the trajectory value arrives without storing crisis
    text.
  - Design directions for the revisit: (a) a dedicated crisis-trajectory
    signal computed by rule-code from metadata + escalation history and fed
    into `evaluateSafeguard` (pattern_escalation already exists as a trigger
    type — extend it); (b) whether crisis *text* ever enters episodic memory,
    and if so under what access scoping (e.g. readable only by safeguard
    context assembly, never by the articulator's normal recall); (c) clinical
    input on what memory of a crisis is helpful vs. re-traumatizing to have
    mirrored back; (d) how the personal-memory toggle interacts with
    safety-motivated memory (safety data may warrant different consent
    framing than personalization data).
- **Cohort/user embeddings** derived from episodic memory, for listener/peer
  matching at the community layer.
- **Wearables as context** (HRV/sleep → mirror awareness) — see
  `convex-components-analysis.md`; feeds Working Memory when built.
- **User correction of the semantic profile** ("that's not quite me") as
  high-weight memory input.

---

## 7. Decision log

| # | Decision | Choice | Date |
|---|----------|--------|------|
| 1 | Episodic memory content | Full composite **including raw text** + mirror + distilledText + metadata. Derived-only index was evaluated and rejected: users hate generic output, and verbatim recall requires raw-to-raw matching. Privacy handled via retention/wipe parity (hard invariant + test), in-app disclosure in product voice, policy paragraph, and a personal-memory toggle (§1.1b) | 2026-07-03 |
| 2 | Profile-vector on user | Rejected as primary structure; revisit as derived cohort artifact at peer layer | 2026-07-03 |
| 3 | Semantic profile visibility | Visible-earned; always the internal working doc; user-safe language from day 1 | 2026-07-03 |
| 4 | Understanding storage | Extend `emotional_metadata` (+ `safeguardLevel`, `safeguardTrigger`, `episodicMatchKeys`, `profileVersion`); split only on lifecycle divergence | 2026-07-03 |
| 5 | Constitution rule | No LLM call may re-derive what Understanding knows; all model calls under `convex/ai/` | 2026-07-03 |
| 6 | Agent infrastructure | Custom tool-use loop on workflow + existing Anthropic provider; `@convex-dev/agent` re-evaluated at peer layer | 2026-07-03 |
| 7 | Consolidation trigger | Both-whichever-first: 5 new sessions OR 7 active days | 2026-07-03 |
| 8 | Hot path | Stays deterministic forever; crisis/escalation stays rule-code | 2026-07-03 |
| 9 | Wipeability | All memory artifacts keyed for cascade deletion; profile registered in wipe pipeline | 2026-07-03 |

## 8. Build order (recommended)

1. **Memory layer** — episodic ingestion + backfill migration; `semantic_profiles`
   table + wipe integration; `context.ts` rewiring. *(No new frameworks;
   prerequisite for everything.)*
2. **Understanding completion** — `emotional_metadata` fields + shared type +
   `getUnderstanding` + constitution rule into CLAUDE.md/AGENTS.md.
3. **Feedback loop #1 (tone adaptation)** — proof the loop closes; data
   already captured.
4. **Reflection Agent** — light pass first, then consolidation pass; strangler
   absorption of notifications → follow-up cards → insights.
5. **Routing + remaining loops**, growing the eval harness alongside.

Existing-component leverage at each step: `rag` (installed), `workflow`
(installed), `rate-limiter` (installed), `action-cache` (installed);
`workpool` + `aggregate` + `crons` per `convex-components-analysis.md`
verdicts when their steps arrive.
