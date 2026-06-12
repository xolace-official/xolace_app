# Convex Components Analysis

Running log of evaluated Convex components — what they do, what we can build, and whether to install.

---

## Batch 1

### Aggregate — `@convex-dev/aggregate` · v0.2.1

**What it does**
O(log n) sorted key-value store with count, sum, rank, and percentile queries. Effectively a persistent B-tree that lives alongside your tables. You define a `TableAggregate` with a sort key and sum value, call `insert/replace/delete` alongside your normal DB writes, and then query it for counts, sums, `indexOf` (rank), `at` (index lookup), `max`, `min`.

Supports tuple keys like `[userId, emotionTag, weekBucket]` for grouped aggregation, prefix-bound queries to drill into subsets, and namespaces for fully isolated partitions with higher write throughput.

**Ideas for Xolace**

- **Personal depth score** — count sessions per user, sum a "processing depth" metric (sessions that reached path selection vs. abandoned early). Show users "you've processed 47 moments this year" on their timeline or profile.
- **Emotional frequency map** — aggregate by `[userId, emotionTag, weekBucket]`. Query with prefix `[userId]` to get a full picture of what emotions a user visits most, broken down by week or month. The raw data for a personal heatmap.
- **Percentile positioning** — `aggregate.indexOf(ctx, userSessionCount)` divided by `aggregate.count(ctx)` gives "you reflect more than 73% of Xolace users." Social proof without a social network. Anonymous, comparative, motivating.
- **Resonance trending** — aggregate peer reflection resonance counts by `[emotionTag, resonanceCount]`. Surface the most-felt reflections for a given emotional cluster without scanning all rows.
- **Streak and consistency scoring** — count sessions per user per day-bucket. Use `count(ctx, { prefix: [userId] })` bounded to the last 30 days. Feed into streak UI or consistency badges.
- **Platform emotional pulse** — global aggregate by `[emotionTag]` across all users (anonymized). Power an in-app "what the world is feeling today" insight — no user data exposed, just aggregate shape.

**Verdict: Install.**
Foundational for any meaningful insights layer. The percentile use case alone is strong for retention — people want to know where they stand without a competitive feed. Pairs directly with timeline and session-end screens.

---

### Sharded Counter — `@convex-dev/sharded-counter` · v0.2.0

**What it does**
Distributes a counter value across N document shards to handle many concurrent writes without OCC conflicts. Increment/decrement writes hit a random shard; reads sum all shards. More shards = higher write throughput, slower reads. Supports `estimateCount` (reads 1 shard, extrapolates) to reduce read contention.

**Ideas for Xolace**

- **Resonance counts on peer reflections** — when hundreds of users are processing simultaneously and tapping "I felt this too", a single document counter will OCC conflict constantly. Sharded Counter eliminates this. Each anonymous peer reflection gets its own counter key (e.g. `reflectionId`).
- **Daily processing volume** — a rolling `sessions:YYYY-MM-DD` counter. Resets daily via cron. Powers "X moments processed today" on any public-facing surface without locking.
- **Platform milestones** — "Xolace has processed 1,000,000 moments." A running total that updates in real-time, displayed on the session-end screen or splash. Use `estimateCount` here — it's a display number, not a precise audit.
- **Per-emotion session density** — counter per emotion tag per day. `heavy:2026-06-11`. Lets you say "today has been a heavy day for a lot of people" without needing a full aggregate scan.

**vs Aggregate:** Aggregate wins when you need rank, percentile, or sorted access. Sharded Counter wins when you just need a fast integer hammered by concurrent writes. They're complementary — use Aggregate for user-facing insight queries, Sharded Counter for high-frequency platform event counts.

**Verdict: Install.**
Specifically essential for peer reflection resonances. That's the one interaction in Xolace with genuinely high write concurrency. Everything else could survive a regular counter, but resonance buttons cannot.

---

### Crons — `@convex-dev/crons` · v0.2.0

**What it does**
Runtime-registered cron jobs. Unlike Convex's built-in `crons.ts` (static, deploy-time only), this component lets you `register`, `get`, `list`, and `delete` scheduled jobs from within mutations. Supports standard cron expressions and millisecond intervals. Jobs are created transactionally — guaranteed to exist after the mutation commits.

**Ideas for Xolace**

- **Adaptive reminders** — detect that a user consistently processes at 9pm. Register a cron for that time. When their pattern shifts, update it. Impossible with static `crons.ts`. True personalization with zero hardcoded schedules.
- **Lapse detection** — when a user completes a session, delete any existing lapse-nudge cron for them and register a new one 5 days out. If they return before it fires, cancel it. If it fires, send a gentle nudge push notification. No fixed schedule, fully reactive to user behavior. (See full design below.)
- **Weekly emotional summary** — on signup, register a weekly cron per user in their local timezone. Auto-generates a "your week in emotions" insight card. Each user gets their own cron, personalized to when they're likely to engage.
- **Monthly insight report** — schedule a deeper "your emotional patterns this month" per user, timed to their signup date anniversary. Generates the aggregates, stores the report, marks it unread.
- **Session timeout cleanup** — register a cron when a session starts. Cancel it on completion. If it fires, mark the session abandoned and run anonymization/distillation jobs. More precise than a static cron scanning all open sessions.

**Verdict: Install.**
Adaptive reminders and lapse detection alone justify this. Static crons cannot personalize — they scan all users and guess. This component lets behavior drive scheduling.

---

### Unread Tracking — `convex-unread-tracking` · v1.1.0

**What it does**
Watermark-based read position tracker. Tracks "user X has read up to timestamp Y in channel Z." Provides per-channel unread counts, total unread across all subscriptions, bulk group subscribe/unsubscribe, sender muting, and React hooks with optimistic updates. Designed for chat-style consumption patterns.

**Ideas for Xolace (theoretical)**

- "New resonances since you last opened" badge on peer reflections screen.
- Unseen sessions badge on timeline — sessions created since last timeline visit.
- Unread insight cards — when a weekly summary generates, mark it unread per user.

**Why it doesn't fit**
The component's model is: many users posting to a shared channel, each user tracking their read watermark per channel. Xolace has no shared channels. Every peer reflection is anonymous and ephemeral. The subscription/group system, sender muting, and group operations are overhead that would never be used.

The unread badge use cases above are real needs, but they're thin queries on existing data — `sessions where _creationTime > user.lastTimelineVisit` is a two-liner on the sessions table. No component needed.

**Verdict: Skip.**
Wrong abstraction for Xolace's data model. Build unread indicators as simple timestamp comparisons on your existing tables.

---

## Summary

| Component | Version | Verdict | Core use case |
|-----------|---------|---------|---------------|
| `@convex-dev/aggregate` | 0.2.1 | **Install** | Percentile insights, streaks, emotional frequency maps |
| `@convex-dev/sharded-counter` | 0.2.0 | **Install** | Peer reflection resonance counts at concurrent scale |
| `@convex-dev/crons` | 0.2.0 | **Install** | Adaptive reminders, lapse detection, per-user scheduled reports |
| `convex-unread-tracking` | 1.1.0 | **Skip** | Wrong abstraction — build thin queries instead |

---

## Batch 2

### Geospatial — `@convex-dev/geospatial` · v0.2.1

**What it does**
Geospatial key-value store with efficient rectangle and nearest-neighbor queries on the Earth's surface. Insert points with lat/lng, optional filter keys, and a sort key. Query by bounding box or by proximity to a given point. Supports equality and set-membership filters, range filters on the sort key, and cursor-based pagination. Everything is Convex-consistent and reactive.

**Ideas for Xolace**

- **Regional emotional pulse** — Store an anonymized, coarse geographic marker per session (country or timezone-bucket center point, not precise location). Query by bounding box to power an in-app "what people near you are processing" insight. No individual location exposed — just the aggregate shape of emotion across a region.
- **Timezone-aware session clustering** — Group users by timezone zone (represented as a point on the globe). Feed into the adaptive reminders system from Crons: send nudges at the right local hour without storing actual clock preferences.
- **Emotional geography insights** — Platform-level: which emotion tags are spatially clustered? Is "numb" heavier in certain regions during certain seasons? Anonymized aggregate research data with zero user attribution — but genuinely interesting for understanding emotional patterns at a global scale.
- **Proximity-boosted peer matching** — When surfacing anonymous peer reflections, optionally weight by geographic proximity. Someone processing grief in Lagos may resonate more with a Lagos peer than a Tokyo one — cultural and situational context bleeds into emotional context.

**The privacy ceiling**
Xolace's privacy-first brand is the product's core promise. Precise coordinate storage — even server-side — would require explicit consent architecture and a clear user value prop in return. The safe path: only ever store coarse location (country centroid or timezone-zone center), derive it from timezone inference rather than GPS, and never expose a user's point to any query that returns fewer than N results (to prevent fingerprinting). Skip this for MVP. The ideas above are valid at scale once a consent and privacy framework is built.

**Verdict: Skip for now.**
None of the use cases are urgent enough to justify the privacy surface area. The regional emotional pulse is genuinely interesting but requires careful product design first. Revisit at ~10k active users when geographic insights become meaningful and you have a consent model ready.

---

### RAG — `@convex-dev/rag` · v0.7.2

**What it does**
Semantic search component for AI applications. Automatically chunks text, generates embeddings via any AI SDK model, stores them in namespaced vector indices, and queries by similarity. Supports custom filters, importance weighting, chunk context expansion (N chunks before/after a match), and graceful content migration when models change. Also provides a `generateText` shortcut that combines search + LLM call in one.

**Ideas for Xolace**

- **Personal emotional memory** — After each session, index the user's mirror (the AI's 1-3 sentence reflection) into a namespace keyed by their userId. When they start a new session, semantically search their history for similar emotional moments. The AI can now open with: *"Three months ago you were in something similar — you called it 'the weight of being unseen.' Is that close to what's here now?"* The app develops actual memory of the user's emotional landscape.
- **Longitudinal pattern recognition** — The articulator prompt currently has no prior context. RAG lets you inject the user's top-5 semantically similar past sessions as context before the AI generates the mirror. The result is a mirror that understands *this person's specific patterns*, not just this session's text.
- **Peer reflection semantic matching** — Currently peer reflections are likely matched by emotion tag. RAG enables matching by *emotional texture*: when a user confirms their mirror, search all indexed anonymous reflections for semantic similarity. Surface peers who processed something that genuinely rhymes emotionally, not just peers who selected the same tag.
- **Distilled insight retrieval** — After the `reflectionDistiller` job runs on anonymized content, index those distillations into a shared namespace. Power the "others have felt exactly this" feature with vector search — what comes back is emotionally true, not just tag-matched.
- **Weekly/monthly summary generation** — When generating a user's weekly emotional summary (from the Crons component), RAG pulls the user's most emotionally salient moments from the past 7 days as context. The summary AI generates a narrative over real semantic content, not just counts.
- **Emotional vocabulary learning** — Over time, the user's indexed mirrors build a picture of their specific emotional vocabulary — the metaphors they reach for, the words they use for pain vs anxiety vs emptiness. The AI can start mirroring back in *their* language, not generic emotional language. That's the difference between feeling heard and feeling truly known.

**Why this matters for retention**
Personal emotional memory is the moat. If a user's entire emotional history lives semantically searchable in Xolace, leaving means losing that context. Not in a manipulative way — in the way that a journal you've kept for two years is irreplaceable. The app accumulates understanding of you that no other tool has. RAG is the infrastructure that makes that possible.

**Cost considerations**
Sessions are low-frequency (1-3/day per user max). Embedding generation on each session add is affordable. Use `text-embedding-3-small` from OpenAI (~$0.02 per 1M tokens) — a session mirror is ~100 tokens, so 1M sessions costs roughly $2. The cost stays negligible until massive scale.

**Verdict: Install.**
This is the highest-leverage component in this batch. Personal emotional memory is a category-defining feature for Xolace. The peer reflection semantic matching is a direct upgrade to the current path. Install it, start with the personal memory use case, and build from there.

---

### Checkpoints — `@abdssamie/convex-checkpoints` · v0.1.9

**What it does**
Milestone and threshold tracking system. You register rules (factor + threshold + action name), track events per user via `trackEvent`, and a callback fires when a threshold is crossed. The component owns progress tracking; your app owns the callback logic and side effects. Supports HTTP webhooks for external ingestion. Query helpers for dashboards and admin views.

**Ideas for Xolace**

- **Processing milestones** — "You've shown up for yourself 10 times." "50 moments processed." "100." Frame these not as achievements but as genuine acknowledgment: no pop-up badge, just a quiet moment in the session-end screen. Factor: `session_complete`. Threshold: 10, 50, 100, 250, 500.
- **Insight layer unlocks** — Gate deeper analytics behind real engagement. After 30 sessions, unlock the emotional frequency map. After 60, unlock trend insights ("this emotion has been rising for you over 3 months"). After 90, unlock a "patterns" view. Users earn richer self-knowledge by actually using the app. This is gamification that genuinely serves the user — the reward is understanding.
- **Path diversity** — Track when a user tries all three paths (solo, peers, exit). Each path first-use fires a checkpoint. The callback can surface a "you've tried everything" moment in the timeline — encouraging exploration without forcing it.
- **Depth progression** — Track `mirror_confirmed` vs `session_abandoned` ratio over time. When a user's confirmation rate crosses a threshold, acknowledge it: "You've gotten clearer at finding the words." This is tracking actual emotional growth, not just engagement.
- **Return after lapse** — Factor: `return_after_lapse`. Track when the lapse detection cron fires and then the user returns. The checkpoint `threshold: 3` fires after the third return — "You keep coming back. That says something." A milestone that acknowledges resilience.
- **Resonance given** — When a user taps "I felt this too" on a peer reflection, that's an act of recognition. Factor: `resonance_given`. Threshold: 25, 100. The callback can surface a "you've quietly held space for 25 strangers" moment. Prosocial gamification — the reward is knowing your presence mattered.
- **Community distillation triggers** — When a peer reflection hits 50 resonances (factor: `reflection_resonance`), fire the distiller early. Hot reflections surface faster. This is a platform-side checkpoint, not a user-side one — the `userId` is the reflection's author ID.
- **Heavy season acknowledgment** — Track `heavy_session` (escalation triggered or heavy tag). Threshold: 5 within a rolling window. Callback surfaces a gentle check: "You've been carrying a lot lately." Not a badge — a soft signal that the app has been paying attention.

**Design principle for on-brand checkpoints**
Xolace's checkpoints should never feel like a game score. The callback logic is yours — so instead of push notifications that say "Achievement unlocked!", the side effect is a quiet card in the timeline, a new visualization in settings, or a moment in the session-end screen. The threshold fires the mechanism; the UX determines the feeling. Keep the rewards functional (unlocking real features) or emotional (acknowledgment that lands), never cosmetic (badges for their own sake).

**vs building it manually**
You could build a milestone tracker with a simple `userStats` table and threshold checks in mutations. The Checkpoints component earns its keep by decoupling the tracking from the side effects, making it easy to add/modify rules without touching mutation logic, and providing the HTTP webhook path for future integrations. The overhead is low; the flexibility is real.

**Verdict: Install.**
The insight unlock pattern alone justifies it. Gating deeper self-understanding behind genuine engagement is the most Xolace-native form of retention — the reward is more of what the app promises, not a vanity number.

---

## Summary (Batches 1–2)

| Component | Version | Verdict | Core use case |
|-----------|---------|---------|---------------|
| `@convex-dev/aggregate` | 0.2.1 | **Install** | Percentile insights, streaks, emotional frequency maps |
| `@convex-dev/sharded-counter` | 0.2.0 | **Install** | Peer reflection resonance counts at concurrent scale |
| `@convex-dev/crons` | 0.2.0 | **Install** | Adaptive reminders, lapse detection, per-user scheduled reports |
| `convex-unread-tracking` | 1.1.0 | **Skip** | Wrong abstraction — build thin queries instead |
| `@convex-dev/geospatial` | 0.2.1 | **Skip (revisit)** | Regional emotional pulse — valid at scale, privacy work required first |
| `@convex-dev/rag` | 0.7.2 | **Install** | Personal emotional memory, semantic peer matching, longitudinal patterns |
| `@abdssamie/convex-checkpoints` | 0.1.9 | **Install** | Insight unlocks, processing milestones, depth progression tracking |

---

## Batch 3

### Workpool — `@convex-dev/workpool` · v0.4.6

**What it does**
Manages parallel execution of Convex actions and mutations by organizing them into separate, configurable queues. Set `maxParallelism` per pool to cap concurrent execution. Built-in retry with exponential backoff and jitter. `onComplete` callbacks for chaining steps. Reactive job status queryable in real time. Pool-level cancellation, pause (set parallelism to 0), and batch enqueueing.

**Ideas for Xolace**

- **AI mirror generation pool** — The Anthropic call in `process.ts` is the most expensive operation in the stack. Run it in a `mirrorPool` with a hard parallelism ceiling (e.g., 20). During traffic spikes — a viral moment, a heavy emotional news cycle driving users to the app simultaneously — uncontrolled concurrency hammers the Anthropic rate limit and causes cascading failures. The pool provides natural backpressure: work queues up rather than failing. Users wait a few seconds longer; nobody gets an error screen.
- **Priority separation: user traffic vs background jobs** — Two pools, two priorities. `livePool` (higher ceiling, e.g. 30) handles anything touching a live user session: mirror generation, path completion, peer reflection serving. `backgroundPool` (lower ceiling, e.g. 5) handles `reflectionDistiller`, `reflectionAnonymizer`, `profileStats`, data retention jobs. Background work can never starve a real user's session.
- **Lapse nudge delivery** — Push notification actions are unreliable (device offline, APNS hiccups, Expo token expiry). Run lapse nudge delivery through a pool with `retryActionsByDefault: true`. The `onComplete` callback logs delivery result to the user's notification log — whether success, failure, or max retries exceeded — and updates the `followUps` table status accordingly.
- **Weekly summary generation at scale** — When the Crons component fires the weekly summary job for all users, it fans out into one action per user. Without a pool, those all race simultaneously. With a `summaryPool` at `maxParallelism: 10`, they drain steadily without spiking Anthropic usage or Convex execution limits.
- **Resilience during third-party outages** — If Anthropic has a partial outage (429s, 503s), a naive retry loop floods the API further. A workpool with `initialBackoffMs: 2000, base: 2` backs off and retries within its parallelism budget. Actions sitting in backoff don't consume a slot. The pool becomes a self-regulating traffic shaper during degraded conditions.
- **OCC conflict elimination** — Any mutation that reads and writes the same shared document (resonance counters before Sharded Counter is installed, aggregate updates) can be serialized through a `maxParallelism: 1` pool. Guaranteed no write conflicts, no OCC retries, no stale reads.

**Relationship to Action Retrier**
Workpool is a superset of Action Retrier. It includes retry logic, backoff, and completion callbacks — plus queue management and parallelism control. Installing both is redundant. Choose Workpool.

**Verdict: Install.**
The priority split between live user sessions and background distillation jobs is the core value. Without this, a wave of simultaneous users can cause background batch jobs to compete with mirror generation — the thing users are actively waiting on. The retry and backoff behavior for Anthropic calls is a close second.

---

### Workflow — `@convex-dev/workflow` · v0.3.10

**What it does**
Durable execution for long-running, multi-step processes. Define a workflow with `workflow.define()`; inside, call `step.runQuery()`, `step.runMutation()`, `step.runAction()` as discrete steps. The workflow survives server restarts — if it fails mid-step, it resumes. `step.sleep(ms)` pauses indefinitely consuming zero resources. `step.awaitEvent({ name })` halts until an external signal arrives. Parallel execution via `Promise.all`. Per-step or global retry config. Cancel, restart from any step, reactive status.

**Ideas for Xolace**

- **Follow-up system (the clean architecture)** — This is the natural implementation for the follow-up design sketched in the Crons analysis. Start a `followUpWorkflow` when a session ends with an escalation flag, heavy tag pattern, max clarification turns, or gave-up state. The workflow does: `step.awaitEvent({ name: 'userReturned', workflowId })` — the next time the user opens the app, the app sends this event, the workflow wakes up, and delivers the check-in card in the session start. If the event never arrives: `step.sleep(5 * DAY)` then send a push nudge. `step.sleep(7 * DAY)` then send a second nudge. `step.sleep(14 * DAY)` then expire gracefully. All of this is one readable function. No cron scanning. No status polling. The `awaitEvent` primitive is exactly what this use case needs.
- **User onboarding drip** — Multi-day onboarding as a single durable function. Start on signup: Day 0, check first session hasn't happened → send welcome. `step.sleep(3 * DAY)`. Check if first session happened. If not, send "what's here for you today?" nudge. `step.sleep(4 * DAY)`. If still no session, send a final nudge with a texture word prompt. If session happened at any point, `workflow.cancel()` — they're onboarded. No cron needed, no manual state machine.
- **Account deletion with cooling period** — GDPR/privacy best practice: accept deletion request, wait 7 days (user can cancel), then execute staged wipe. `step.awaitEvent({ name: 'cancelDeletion' })` runs parallel with `step.sleep(7 * DAY)` using whichever resolves first. On the 7-day timeout: run anonymization, then distillation wipe, then auth revoke, then user doc deletion — each as a separate step. Durable, auditable, cancellable. The existing `dataWipe.ts` and `accountDeletion.ts` jobs become steps in this workflow.
- **Insight generation pipeline** — When Checkpoints fires a milestone callback (30 sessions → unlock frequency map), kick off a workflow: `step.runAction(internal.insights.generateFrequencyMap, { userId })` → `step.runMutation(internal.insights.storeInsight, { userId, data })` → `step.runMutation(internal.insights.markAsNew, { userId })`. If the generation action fails, it retries. If it succeeds but the store mutation fails, Convex retries that. The user sees a new insight card appear when it's ready — no partial state, no orphaned jobs.
- **Content moderation human-in-the-loop** — When `safeguard.ts` returns a borderline escalation score, start a workflow that: flags the session for review → `step.awaitEvent({ name: 'moderationDecision', workflowId })` — an admin sends the event with `{ approved: true/false }`. If no decision in 24 hours: `step.sleep(24 * 60 * 60 * 1000)` then auto-resolve conservatively. Real human review queue with automatic fallback, all in one durable function.
- **Weekly summary per user** — When the weekly cron fires, start one `summaryWorkflow` per user. Inside: `step.runAction(internal.rag.pullWeeklySessions, { userId })` (RAG search for the week's emotional moments) → `step.runAction(internal.llm.generateSummary, { sessions })` with `{ retry: true }` → `step.runMutation(internal.insights.storeSummary, { userId, summary })`. If the LLM call fails twice, the workflow fails gracefully and the user just doesn't get a summary that week — the failure is isolated per user, not a global batch failure.

**When NOT to use Workflow**
Don't reach for it for simple, single-step operations. A session submission that calls one Anthropic action isn't a workflow — it's just an action. Workflows shine when there are 3+ steps, delays, external events, or the process spans hours/days. The onboarding drip and account deletion are canonical fits. Session mirror generation is not.

**Relationship to Crons**
These are complementary. Crons is the scheduler that fires "start a workflow for every user at 9pm Sunday." Workflow is the durable function that runs once triggered. Crons handles scheduling breadth; Workflow handles execution depth.

**Verdict: Install — selectively.**
The `step.awaitEvent` primitive alone justifies it for the follow-up system. The account deletion cooling period and insight generation pipeline are natural fits. Use it where the process has multiple steps, delays, or needs to survive failures gracefully.

---

### Action Retrier — `@convex-dev/action-retrier` · v0.3.0

**What it does**
Thin wrapper that retries a single Convex action with exponential backoff. Configure `initialBackoffMs`, `base`, `maxFailures`. Returns a `RunId` for status querying, cancellation, and cleanup. Optional `onComplete` mutation callback fires exactly once on success, failure, or cancellation.

**Ideas for Xolace (if Workpool is not installed)**

- **Anthropic API resilience** — Wrap the mirror generation action. Rate limit errors (429) and transient server errors (503) on Anthropic's side would otherwise surface to users as error states. The retrier absorbs them silently and the user's mirror eventually arrives.
- **Push notification delivery** — Expo push delivery actions can fail on device-side issues. Retry up to 3 times with backoff. `onComplete` logs the result to the notification audit log.
- **Distiller job resilience** — `reflectionDistiller` calls external AI models. Transient failures shouldn't silently drop a distillation. Retrier guarantees eventual execution.

**The real verdict**
Action Retrier does one thing: retry a single action. Workpool does the same thing plus queue management, parallelism control, and priority separation. They're not competing tools — Workpool is strictly more capable. Installing both adds overhead for zero benefit.

**Verdict: Skip — Workpool subsumes it.**
If Workpool is installed (and it should be), Action Retrier adds nothing. Its retry/backoff/onComplete pattern is fully available through Workpool's `enqueueAction`. Install one or the other; Workpool is the right choice for Xolace's workload complexity.

---

## Batch 4

### WhatsApp Cloud API — `convex-whatsapp` · v1.1.5

**What it does**
Drop-in wrapper for the WhatsApp Cloud API. Handles webhook ingestion for inbound messages, outbound message sending via Convex actions, delivery tracking, and conversation state stored reactively in your Convex database. Eliminates manual webhook management and API auth. Inbound messages trigger Convex functions you define — process content, update conversation state, send replies.

**Ideas for Xolace**

- **Re-engagement nudges via WhatsApp** — WhatsApp message open rates are 80–90%, versus 20–30% for push notifications. A lapse nudge ("heavy, scattered, foggy — you haven't checked in since Tuesday. What's here right now?") sent via WhatsApp has 4x the reach of a push. Users who opt in to WhatsApp check-ins are explicitly your highest-retention segment.
- **Weekly emotional summary delivery** — The weekly summary pipeline (built with Workflow + RAG) can fan out over WhatsApp instead of or alongside in-app notifications. A Sunday morning message with your emotional frequency shape for the week is more likely to be read in bed than a push that gets swiped.
- **Two-way session initiation** — User replies "I'm back" or "feeling heavy" to the nudge. Inbound webhook triggers a Convex function that opens a new session and pushes a deep link to the app. Zero friction re-entry from a natural messaging context.
- **Trusted contact escalation path** — If a user enables it, high-escalation sessions can optionally notify a trusted contact ("someone you care about is going through something today. Be available.") — no session content shared, just presence signal. Explicit opt-in, user-controlled. Turns Xolace into a safety infrastructure layer beyond just the individual.
- **Streak milestone celebrations** — "You've processed 30 moments with Xolace. 30." Simple, direct, personal. Delivered where the user already lives.

**The privacy tension**
Xolace is privacy-first. WhatsApp ties every message to a phone number — a real-world identity anchor. A user who trusts Xolace with their emotional state but has WhatsApp messages in the same phone revealing that they use Xolace regularly has had a linkage created they may not want. The message content is controlled (nudges don't include session content), but the timing metadata — frequency of nudges, which evenings they return — is visible to anyone with access to the WhatsApp account.

This is a genuine trade-off, not a blocker. It's the same trade-off any wellness app faces with push notifications. The difference is opt-in explicitness: users who connect WhatsApp have made an active choice. The component supports this pattern well.

**Verdict: Skip — revisit at engagement layer phase.**
The open-rate advantage is real and the re-engagement use case is legitimate. But WhatsApp integration is an engagement-layer feature, not infrastructure — it needs its own onboarding flow, explicit opt-in consent, and privacy framing ("your session content is never sent, only check-in nudges"). The component itself is solid. Build the core retention mechanics first (Workflow-based follow-ups, in-app notification inbox), then add WhatsApp as an opt-in escalation channel when the base engagement layer is proven.

---

### Convex Comments — `@hamzasaleemorg/convex-comments` · v1.0.2

**What it does**
Full comments system: zones (containers tied to entities), threads, messages with auto-parsed mentions and links, emoji reactions, typing indicators, soft deletes, and positioned comments for anchoring to x/y coordinates or timestamps. Includes optional React UI components. Three integration patterns: typed `Comments` class, direct `ctx.runMutation`, or generated wrapper functions via `exposeApi()`.

**Ideas for Xolace**

- **Peer reflection resonance (stretch)** — The reaction system (`toggleReaction`, grouped emoji counts) is technically applicable to the peer reflections screen. Instead of simple binary resonance buttons, users could react to anonymous reflections with specific emotions ("this is me too", "I hear you", "this passed for me").
- **Future: support circles** — If Xolace ever builds small anonymous peer support groups (5–10 people who share similar emotional patterns, never knowing each other's identity), threaded discussion with typing indicators becomes relevant. Each circle is a zone; each topic is a thread.
- **Positioned feedback on session insights** — If the insights layer (frequency maps, depth scores) ever has a sharable report format, positioned comments let a user annotate specific parts of their own timeline ("this week was the job stuff").

**The fit problem**
Xolace is explicitly not a social app: no profiles, no public content, no direct user-to-user communication. The peer reflections screen exists to create felt solidarity, not to enable interaction. The current resonance buttons are deliberately one-way — you tap "I felt this too" and the count increments, but you don't know who else tapped it and they don't know you did.

Comments introduces threading, mentions, typing indicators — all the machinery of a social communication layer. Even anonymized, threads create relationships between users. That's architecturally outside the campfire metaphor. The AI is the fire; other users are distant voices in the dark. They don't talk back.

The reaction subsystem alone is the only piece that's relevant, and it's lightweight enough to build directly (it's literally an array field on a reflection document, or a separate reactions table with a sharded counter). Pulling in a full comments component for reactions-only is 90% waste.

**Verdict: Skip.**
Wrong product fit. Xolace has no social communication layer, and this component is built for social communication. The resonance mechanic in peer reflections is already simpler without it. Revisit only if a support-circles or group feature is explicitly scoped.

---

### Notification — `convex-notification` · v0.1.1-alpha.1

**What it does**
Typed in-app notification system. Define `kinds` with validators — each kind has a specific data shape you configure. `create()` inserts a notification for a target user, checked against the kind's schema. Query functions: `list`, `listPage` (paginated), `counts`, `unseenCount`. Actions: `markSeen`, `markAllSeen`, `dismiss`, `dismissAll`. `dedupeKey` prevents duplicate notifications for the same event. `source` field for grouping notifications by origin. Auth resolution is yours — you provide `resolveTargetId`.

**Ideas for Xolace**

- **Insight unlocked notification** — When Checkpoints fires a milestone (30 sessions → frequency map unlocked, 90 sessions → depth pattern unlocked), create a `insight_unlocked` notification. The badge count on the insights screen shows how many new insights are waiting. User taps, sees what unlocked, dopamine hit. This is the retention mechanic that doesn't feel like manipulation — it's genuinely new information about themselves.
- **Peer resonance notification** — When another user resonates with an anonymous reflection you contributed, create a `peer_resonance` notification. "Someone out there felt what you felt on Tuesday." No identity, no social graph. Just a signal that you weren't alone. Pull rate on this notification type will be very high.
- **Weekly summary ready** — When the Workflow + RAG pipeline finishes generating the weekly emotional summary, notify `summary_ready`. Badge appears. User opens. This is the in-app complement to WhatsApp/push delivery.
- **Follow-up check-in card** — When the follow-up Workflow fires its check-in event, surface it as a notification that resolves into the check-in card UI when tapped. Notification-as-navigation-trigger.
- **Streak milestone** — Day 7, Day 30, Day 90 consecutive processing streaks. `streak_milestone` kind with `{ days: number, badge: string }`. Shows in notification feed. Each milestone is a micro-celebration.
- **Session completion prompt** — If a session was abandoned (gave-up state), a gentle notification later: "You can come back whenever you're ready." Kind `session_nudge`. Deduped by `sessionId` so it never fires twice for the same session.

**The alpha problem**
v0.1.1-alpha.1. This is not a library in production stability — it's explicitly alpha. 591 weekly downloads is low. No `^1.x` version published yet. The API shape will change. Taking a production dependency on an alpha package for a core feature (notifications are load-bearing for retention) introduces churn risk when the breaking change comes.

The conceptual design is solid. The `kinds` pattern is exactly right — typed notification payloads prevent schema drift. `dedupeKey` is table stakes. `unseenCount` drives badge UX. But none of these primitives are hard to build directly: a `notifications` table with a `kind` discriminant field, a `seenAt` timestamp, and a thin query for counts. That's maybe 50 lines of Convex schema + functions, fully owned.

**Verdict: Skip (revisit at v1.x).**
Exactly what Xolace needs architecturally — typed notifications, unread count, dedupe. But alpha status makes it risky for a production retention feature. Build a thin owned version now (`notifications` table, `kind`, `seenAt`, `dedupeKey`, `create`/`list`/`markSeen` functions — 5 mutations and 2 queries). When this package hits v1.x and the API stabilizes, evaluate migrating. Don't let alpha stability block the feature; build the minimal owned version.

---

## Batch 5

### Rate Limiter — `@convex-dev/rate-limiter` · v0.3.2

**What it does**
Type-safe, transactional application-layer rate limiting. Fixed window and token bucket algorithms. Per-key (per-user, per-session) or global. Configurable sharding for high-throughput scenarios. Capacity reservation to prevent starvation under load. React hooks for client-side state. All operations roll back if the enclosing Convex function fails.

**Ideas for Xolace**

- **AI mirror generation guard** — Cap how fast a single user can submit sessions (token bucket, 3 per minute, capacity 5). Prevents runaway Anthropic spend from a user hammering the reflect screen. Transparent to good-faith users; stops abuse and accidental loops.
- **Clarification turn rate** — The `clarify` state allows 2 turns max (code-enforced), but a user could theoretically spam the endpoint programmatically. `{ kind: "token bucket", rate: 5, period: MINUTE, key: userId }` is a server-side guard independent of client logic.
- **Peer reflection resonance taps** — One resonance per reflection per user is a business rule. But also rate-limit the resonance endpoint itself: `{ kind: "fixed window", rate: 50, period: MINUTE, key: userId }`. Protects the Sharded Counter from intentional flooding.
- **Push notification delivery actions** — When the follow-up Workflow and lapse detection cron both fire for the same user in a short window, they'd double-notify. Rate limit the push action by `userId` with a `{ kind: "fixed window", rate: 1, period: { hours: 12 } }`. Server-level dedup without storing state manually.
- **Onboarding / invite funnel** — If a referral or invite system is built, `{ kind: "fixed window", rate: 10, period: HOUR, key: userId }` prevents invite spam at the mutation level without manual tracking.
- **Insight generation fan-out** — When the weekly cron fans out a summary workflow per user, sharded rate limiting on the LLM action prevents all N users hammering Anthropic simultaneously: `{ kind: "token bucket", rate: 200, period: MINUTE, shards: 10 }`. Self-regulating without a workpool ceiling change.
- **Account actions** — Password reset, email verification, any auth action: `{ kind: "fixed window", rate: 5, period: HOUR, key: email }`. Standard auth hardening.

**vs Workpool backpressure**
Workpool controls concurrency (how many things run at once). Rate limiter controls frequency (how many times something can be called in a window). They're complementary: Workpool queues the mirror generation action; Rate Limiter decides whether a given user is allowed to enqueue at all.

**Verdict: Install.**
88k weekly downloads for a reason — it's cheap insurance. The AI generation guard alone pays for the integration time. The token bucket on session submissions protects Anthropic spend at scale without any user-facing friction during normal use. Install it, wire it to the mirror submission path, and add per-user guards at other high-value endpoints.

---

### Resend — `@convex-dev/resend` · v0.2.3

**What it does**
Official Resend email integration for Convex. Queued, batched delivery with retry logic and rate limiting. Idempotency keys prevent duplicate sends. Webhook support for delivery status tracking (bounced, opened, clicked). Test mode for development safety.

**Ideas for Xolace**

- **Weekly emotional summary email** — The Workflow + RAG pipeline generates a user's weekly summary. Email delivery alongside push/WhatsApp means users who prefer inbox > lock screen get it. Subject: "What you carried this week." Body is the narrative summary, no session content exposed. High open-rate because it's earned, not generic.
- **Monthly insights report** — After 30+ sessions, a monthly "what we've learned about you" email. Emotional frequency breakdown, depth score trend, a sentence from the most resonated anonymous reflection that matched their patterns. This is analytics-as-product, delivered to the inbox.
- **Milestone notifications** — "You've processed 50 moments with Xolace." Not a push notification — an email. Subject lines that land differently: "50 moments. That's real." Users who have email notifications on but not push see these.
- **Re-engagement drip** — When the lapse detection workflow fires and the user hasn't returned after a push nudge, an email as the fallback channel. Different copy from the push — more considered, more personal, less urgent. "No rush. Whenever you're ready."
- **Account + transactional** — Password reset, welcome email on signup, data export ready, account deletion confirmation. Table stakes that every production app needs and Resend handles cleanly.
- **Insight unlock announcement** — "A new pattern has emerged in your data." Email triggers when Checkpoints fires a milestone and the insight pipeline completes. Deep link back into the app to the insights screen.

**The open rate case**
Push notifications for wellness apps run 10–20% open rates. Email for genuinely personalized content (not blast campaigns) runs 30–50%. Weekly summaries are personal — the subject line has your name and a reflection of your week. That kind of email lands differently than "don't forget to check in today."

**Data point to build on**: Xolace collects mood delta (lighter/same/heavier) at session end. A monthly email that says "over the past 30 sessions, you've left feeling lighter 62% of the time" is both retention and proof of value — users see the app is working.

**Verdict: Install.**
Transactional email is required infrastructure for any production app. The personalized analytics delivery use case is a genuine differentiator. The Resend component handles all the operational overhead (queuing, retry, idempotency, delivery tracking) so none of that has to be built. Wire up the basic transactional flows first, then layer in the weekly summary delivery once the insights pipeline exists.

---

### RevenueCat — `convex-revenuecat` · v0.1.11

**What it does**
Receives RevenueCat webhooks and maintains subscription state in Convex. Query `hasEntitlement()` and `getActiveSubscriptions()` directly from Convex functions with real-time reactivity. Handles all 18 webhook events including grace periods, refunds, transfers, and lifecycle. Not a replacement for the RevenueCat SDK on the client — server-side state sync only.

**Ideas for Xolace**

- **Insight unlock gating** — The Checkpoints component fires milestones; RevenueCat enforces which of those unlocks are free vs. paid. `hasEntitlement(ctx, { userId, entitlementId: "pro" })` gates the advanced frequency map, depth trend, and semantic pattern insights. Free users get the first tier; Pro users get the full longitudinal picture.
- **Session volume gating** — Free plan: 30 sessions/month. Pro: unlimited. `getActiveSubscriptions()` determines which rate limit config to apply (from the Rate Limiter component). One subscription check, one rate limit variant. Clean.
- **AI mirror quality tiers** — Free tier uses `claude-haiku-4-5`; Pro tier uses `claude-sonnet-4-6`. Check entitlement in the `process.ts` action before selecting the model. The UX difference is noticeable; it's a real upgrade, not artificial.
- **Peer reflection semantic matching** — Basic matching (emotion-tag-based) is free. Semantic RAG matching is Pro. `hasEntitlement` gates which path the peer-matching query takes.
- **Weekly email summary** — Free users get a simplified version (session count, top emotion). Pro users get the full Workflow + RAG generated narrative summary. One entitlement check in the Resend email template selector.
- **Personalized adaptive reminders** — The Crons component can register per-user adaptive reminder schedules; gate that feature behind Pro. Free users get generic nudges; Pro users get timing that learns from their pattern.
- **Grace period handling** — The component's `isInGracePeriod` check means a user whose card fails keeps Pro access while they sort it out. No support tickets from users who were mid-session when a payment bounced.

**The monetization architecture this enables**
Xolace has two natural tier shapes:
- **Free**: Core loop (unlimited reflects, basic mirror, emotion-tag peer matching, simple timeline, first-tier insights after 30 sessions)
- **Pro**: Enhanced mirror quality, semantic peer matching, full insights layer (frequency maps, depth trends, longitudinal patterns), weekly email summaries, adaptive reminders, advanced analytics

RevenueCat + this component handles the entitlement state that all of those gates query. Every features decision in the components analysis becomes a monetizable differentiator with one entitlement check.

**Subscription lifecycle insights**
The `getActiveSubscriptions()` and webhook event log give you churn signals without a separate analytics integration: which event type precedes cancellation most often, grace period to churn conversion rates, which entitlements are most-used by retained subscribers. Feed this into product decisions.

**Verdict: Install when monetization is scoped.**
Not MVP-blocking — ship free first, establish retention, then paywall. But the schema decision matters now: if `hasEntitlement` checks are going to gate AI model selection and insight access, the call sites need to be designed from the start rather than bolted on. Add the component, wire up the `httpHandler` webhook endpoint, and put stub entitlement checks (`hasEntitlement` returning `true` in dev) at each gate point. When you flip on paid plans in RevenueCat, the gates work automatically.

---

### Wearables — `@clipin/convex-wearables` · v0.1.0

**What it does**
Syncs health and fitness data from 8 providers (Garmin, Strava, Whoop, Polar, Suunto, Apple HealthKit, Samsung Health, Google Health Connect) into Convex. Full OAuth flow, automatic sync, normalized data model across providers. 40+ workout types, 88 health metrics (HRV, sleep stages, SpO2, steps, body temp), precomputed daily summaries. Time-series storage policy for managing database growth. GDPR-ready deletion.

**Ideas for Xolace**

This is a non-obvious component for an emotional processing app. Here's why it matters:

- **Emotional context from body data** — HRV (heart rate variability) is the best non-invasive predictor of psychological stress and emotional capacity available. A user with HRV trending down over 3 days is more likely to feel overwhelmed when they open Xolace. If that data is in Convex alongside session data, the AI mirror can be aware of it: "Your body has been carrying stress for a few days — that context matters." Not diagnosis. Just context the user already knows but hasn't connected.
- **Physical trigger pattern recognition** — Correlate session frequency with workout load (Strava/Garmin). High-training weeks produce a predictable emotional signature for athletes. Users who run notice "heavy, scattered" clusters on rest days. Connecting that pattern ("you tend to process more after high-effort weeks — that's your body asking for stillness") turns Xolace from a moment-in-time tool into a longitudinal pattern spotter.
- **Sleep + emotional state correlation** — Pull `sleep` events and `heart_rate_variability_rmssd` time-series from Apple Health or Garmin. When a user's session is tagged "foggy" or "numb" and the previous night's sleep was fragmented, the mirror can acknowledge the physical layer without diagnosing it. *"You're processing something while running on less."* That sentence lands differently than a generic reflection.
- **Adaptive session timing** — The Crons component can already register adaptive reminders. With wearables data, those reminders can be biologically aware: send the nudge when resting HR and HRV are in the user's recovered range (morning, post-sleep), not during a high-stress physiological window. Timing that respects the body.
- **Body battery / recovery score for session depth** — Garmin's `garmin_body_battery` or Whoop's recovery score correlates with cognitive capacity. A user at 20% body battery is unlikely to do deep processing. The AI could adjust: shorter, more validating mirror on low-recovery days; fuller depth when recovered. Personalization that's biologically grounded.
- **Weekly insight email enrichment** — The monthly Resend email can include: "Your lowest-HRV week correlated with your heaviest emotional processing. Your body and mind were in sync." That's a genuine insight that users can't get anywhere else — it requires both the wearable data and the session data in the same place.

**The integration boundary**
This component does not pull data automatically unless the user explicitly connects a wearable provider. That's the right design: opt-in health data with clear value exchange ("connect Garmin → get physically-aware emotional context"). The OAuth flow is handled by the component; the consent UX and value explanation are Xolace's job.

**Privacy note**: Wearable data — HRV, sleep, location traces from workouts — is among the most sensitive personal data that exists. The `deleteAllUserData` method and GDPR-compliant design are essential. Don't store more granularity than the insights require (daily summaries and spot time-series readings are enough; per-second GPS traces are not needed for Xolace's use cases). Configure the time-series storage policy accordingly.

**Verdict: Skip for MVP — high-conviction for V2.**
The wearable correlation features are genuinely differentiated — no other emotional processing app does this. But they require a) users who actually wear fitness trackers (a segment of the user base, not all of it), b) a clear in-app value explanation for why they should connect their health data to an emotional app, and c) the insights pipeline (RAG, Aggregate, weekly summaries) to already exist for the wearable data to feed into. Build the core insights layer first. Then add wearables as an optional enrichment layer for the subset of users who want it.

---

## Summary (All Batches)

| Component | Version | Verdict | Core use case |
|-----------|---------|---------|---------------|
| `@convex-dev/aggregate` | 0.2.1 | **Install** | Percentile insights, streaks, emotional frequency maps |
| `@convex-dev/sharded-counter` | 0.2.0 | **Install** | Peer reflection resonance counts at concurrent scale |
| `@convex-dev/crons` | 0.2.0 | **Install** | Adaptive reminders, lapse detection, per-user scheduled reports |
| `convex-unread-tracking` | 1.1.0 | **Skip** | Wrong abstraction — build thin queries instead |
| `@convex-dev/geospatial` | 0.2.1 | **Skip (revisit)** | Regional emotional pulse — valid at scale, privacy work required first |
| `@convex-dev/rag` | 0.7.2 | **Install** | Personal emotional memory, semantic peer matching, longitudinal patterns |
| `@abdssamie/convex-checkpoints` | 0.1.9 | **Install** | Insight unlocks, processing milestones, depth progression tracking |
| `@convex-dev/workpool` | 0.4.6 | **Install** | AI pipeline backpressure, background job isolation, retry resilience |
| `@convex-dev/workflow` | 0.3.10 | **Install (selective)** | Follow-up system, onboarding drip, account deletion, insight pipelines |
| `@convex-dev/action-retrier` | 0.3.0 | **Skip** | Subsumed by Workpool — redundant if Workpool is installed |
| `convex-whatsapp` | 1.1.5 | **Skip (revisit)** | WhatsApp nudges for re-engagement — valid at engagement-layer phase, opt-in privacy required |
| `@hamzasaleemorg/convex-comments` | 1.0.2 | **Skip** | Social communication layer — outside product scope |
| `convex-notification` | 0.1.1-alpha.1 | **Skip (revisit at v1.x)** | Typed in-app notifications — right design, alpha stability risk; build thin owned version now |
| `@convex-dev/rate-limiter` | 0.3.2 | **Install** | AI generation spend guard, per-user frequency controls, push dedup |
| `@convex-dev/resend` | 0.2.3 | **Install** | Weekly summary email, milestone notifications, transactional email, re-engagement drip |
| `convex-revenuecat` | 0.1.11 | **Install (when monetization scoped)** | Entitlement gating for insights, AI model tiers, Pro feature access |
| `@clipin/convex-wearables` | 0.1.0 | **Skip (V2)** | HRV/sleep/recovery context for emotionally-aware AI mirrors and insights |
