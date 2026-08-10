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
Xolace's checkpoints should never feel like a game score. The callback logic is yours — so instead of push notifications that say "Achievement unlocked!", the side effect is a quiet card in the timeline, a new visualization in profile, or a moment in the session-end screen. The threshold fires the mechanism; the UX determines the feeling. Keep the rewards functional (unlocking real features) or emotional (acknowledgment that lands), never cosmetic (badges for their own sake).

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

## Batch 6

Framing note for this batch: Xolace's roadmap is not "AI mirror app forever." The stated arc is end-to-end mental health infrastructure — from a person who can't yet name what they feel, through proactive and passive support, all the way to a social layer with listeners/peer counsellors (7cups-style but Reddit-community-first) and eventually real conversation surfaces. Components get evaluated against *that* full arc, not just against the current 9-state reflect loop. Gamification, social mechanics, and engagement tooling are legitimate tools here, not things to reflexively avoid — the only bar is whether a mechanic is generative (gives users more of what the app promises) or extractive (manufactures anxiety to farm attention).

### Twilio SMS — `@convex-dev/twilio` · v0.2.2

**What it does**
Two-way SMS via Twilio. Send messages from actions, receive them via webhook, query delivery status and history reactively. Handles all webhook plumbing and message persistence.

**Ideas for Xolace**

- **The lowest-friction entry point that exists** — the entire premise of Xolace is meeting someone who "can't even name what they're feeling." That person is, by definition, not motivated enough to download an app, sign in with Google, and face a blank text box. But they might text a number. A single SMS short code — text anything, get one line back ("That sounds heavy. Want to say more, or just be heard?") — is a lower-threshold front door than the app itself. It's the campfire metaphor taken literally: you don't need to walk into the room, you can just call out from the dark. Sessions started this way could resolve entirely in SMS (for someone who never wants to open an app) or end with a deep link into the full app experience once the person is warmed up.
- **Post-heavy-session tether, outside app-open pressure** — after an escalation-adjacent or "gave up" session, instead of (or alongside) a push notification that requires opening the app, a single SMS a few hours later: "Still here if you want to say more. No pressure." A push is ignorable in a notification tray; a text sits in the same thread as messages from actual people, which changes how it's read.
- **Proxy-masked listener channel (this is the real payoff, once the social layer exists)** — Twilio's number-masking/proxy pattern is exactly the primitive a 7cups-style listener system needs: a user and a listener can text each other through masked numbers without either party's real number being exposed, and the relationship can be severed by killing the proxy session. That solves the hardest trust problem in peer support — "I want to talk to a real person without doxxing myself to them" — with infrastructure that already exists, rather than building a custom masked-messaging layer from scratch later.
- **Trusted-contact presence signal** — opt-in only: on a high-escalation session, notify a user-designated trusted contact with zero session content, just "someone you care about might want you nearby today." SMS reaches people who don't have the receiving app installed at all — a partner, a parent, a friend — which push and in-app notification structurally cannot do.
- **A texture-word check-in as a standalone product, not just an app feature** — "Text HEAVY, FOGGY, or NUMB to get one line back" could be marketed and function independently of app installs. For the segment of the target audience that will never install a mental-health app but will text a number a friend told them about, this is the whole product.

**The privacy tension, same shape as WhatsApp**
SMS ties a session to a real phone number — a durable real-world identity anchor, the opposite of Xolace's privacy-first posture. The mitigation is the same as the WhatsApp verdict: explicit opt-in, no session content in message bodies, clear framing ("we'll never text you what you told us — only that we're here"). Unlike WhatsApp this doesn't require the user to have a specific app installed, which is precisely what makes it valuable as a front door and precisely why the consent framing has to be airtight before shipping it.

**Verdict: Skip for MVP — revisit as the highest-priority component once any of (a) an SMS-first entry funnel, or (b) the listener/peer-counsellor layer is scoped.** This is not a "nice to have later" like WhatsApp re-engagement — the proxy-masking capability is close to a hard requirement for a 7cups-style anonymous listener channel done safely, and the SMS-native entry point is a genuinely different (and lower-friction) product surface than the app. Worth prototyping early once the listener program has a shape, rather than treating it as a pure engagement-layer afterthought.

---

### DatabaseChat — `@dayhaysoos/convex-database-chat` · v0.2.0

**What it does**
Natural-language querying over your own Convex tables. You define tool schemas mapped to Convex query functions; an LLM (via OpenRouter) decides which tools to call and streams a response. Ships conversation storage and delta-based streaming out of the box.

**Ideas for Xolace**
This is not a user-facing component for Xolace — the Cognition Layer Constitution Rule is explicit that no feature re-derives what the Understanding layer already knows, and a chat-with-your-data tool pointed at a single user's own reflections would do exactly that (badly — it'd be querying raw/anonymized data with a generic LLM instead of routing through `internal.understanding.getUnderstanding`). But there's a real internal-tooling use case once the org has non-engineers who need the data:

- **A self-serve instrument panel for the eventual clinical/safety/listener-ops team** — once there are people (moderators reviewing escalation-flagged sessions, clinical advisors sanity-checking the safeguard model, listener-program coordinators) who are not engineers but need to ask "how many escalation sessions this week trended toward the same theme" or "which distilled reflections got the most resonance in the 'numb' cluster this month," this is exactly the shape of tool that gets them there without writing Convex queries or filing a ticket with engineering. It should only ever run against already-anonymized/aggregate tables (`reflectionDistiller` output, `profileStats`, aggregate rollups) — never raw per-user `emotional_metadata` — which conveniently keeps it outside the Constitution Rule's boundary entirely, since it's not part of the user-facing AI pipeline.
- **Prompt/safety iteration loop** — the team tuning the articulator/distiller/classifier prompts in `convex/ai/prompts/` currently has to either read raw data or wait for someone to write a bespoke query. "Show me the last 20 reflections tagged heavy where the mirror got a 'not quite' on the first turn" is the kind of question that currently requires a Convex dashboard query; this tool makes it a sentence.
- **Community-layer moderation dashboard, later** — if/when the Reddit-style peer-community layer ships, someone will need to ask ad-hoc questions about circle activity, report volume, moderator load. Same pattern applies.

**Why it's not urgent**
None of these consumers exist yet — there's no ops/clinical/moderation team today, just engineering. Building the tool infrastructure before there's a defined internal user is speculative. It's also alpha (v0.2.0, 724 weekly downloads, OpenRouter dependency rather than the Anthropic provider the rest of the stack standardizes on), which is an added reason not to wire it into anything load-bearing yet.

**Verdict: Skip for now — revisit when a non-engineering internal team exists.** Keep it in mind specifically as the tool for whoever ends up doing safety/clinical review or listener-program ops, scoped strictly to anonymized/aggregate tables, never the per-user Understanding layer.

---

### convex-authz — `@djpanda/convex-authz` · v2.4.1

**What it does**
Zanzibar-style authorization: RBAC + ABAC + ReBAC with pre-computed O(1) permission lookups, scoped/expiring roles, relationship-tuple traversal (`user —member→ team —owner→ resource`), audit logging, and multi-tenant isolation.

**Why it's a non-starter today, and exactly the right tool later**
Right now Xolace has one authorization question worth asking: "is this the session's owner?" — answered by `requireSessionOwnership()` in a couple of lines. There is no team, no tenant, no role hierarchy, no resource that a second party ever needs scoped access to. Installing a Zanzibar-inspired permission graph for that is enormous overkill — the kind of component that would sit unused and rot.

But the roadmap changes that answer entirely. The moment there's a listener/peer-counsellor program, this stack of problems appears all at once:

- **Listener role tiers with real stakes** — trainee vs. certified vs. supervisor listener isn't a cosmetic label, it's an access boundary: a trainee should not see the same session detail a certified listener sees, and a supervisor needs to review a trainee's conversations without either of them being able to see *other* listeners' conversations. That's RBAC with scope, exactly as designed here (`assignRole(ctx, userId, "listener_trainee", { type: "chat", id: chatId })`).
- **ReBAC is the actual data model of a listener conversation** — "this listener may respond in this chat" is a relationship tuple (`listener —assigned→ chat`), not a static role. The traversal engine here is built for precisely "can X access Y because X has relation R to some Z that owns Y" — which is what a listener-assignment system *is*, not an approximation of it.
- **Time-boxed access for volunteer/on-call moderators** — expiring role grants map directly onto "this person is on crisis-review rotation this week" without a cron job to manually revoke access after the fact.
- **Trust-tier unlocks for peer helpers, tied to Checkpoints** — the earlier Checkpoints analysis proposed milestone-gated insight unlocks for *users*; the mirror case is milestone-gated *capability* unlocks for people who want to become listeners — more circles, more concurrent conversations, eventually the ability to mentor a trainee — as they build a track record. `assignRole` + `expiresAt` + the audit log gives that a real access-control backbone instead of a boolean flag on a profile document.
- **Audit trail becomes a compliance requirement, not a nice-to-have** — the instant a second human can read content connected to a first human's emotional disclosures (even anonymized, even consented), "who accessed what, when, and under what grant" stops being optional. This component logs every role/permission/attribute change automatically; building that by hand later, after the fact, on top of an ad hoc listener system would be a much worse position to be in.
- **Community/circle moderation, Reddit-style** — moderator-of-circle, member-of-circle, banned-from-circle are relationship tuples with obvious traversal rules (a circle moderator can see reports in their circle; a global admin can see all). This is the same shape of problem OpenFGA-style systems were built for, and re-deriving it with ad hoc boolean fields tends to grow into exactly the tangled permission logic this component exists to avoid.

**Verdict: Skip now — but flag as the first infrastructure decision to make, not a late one, when the listener/peer-counsellor program is scoped.** Unlike most "revisit later" verdicts in this doc, the risk here isn't missing a nice feature — it's building an ad hoc permission system for a program that involves real people reading real (if anonymized) emotional disclosures from other real people, discovering the ad hoc version doesn't hold up, and having to retrofit access control and audit logging onto a live listener program. Bring this in *before* the first listener account exists, not after.

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
| `convex-whatsapp` | 1.1.5 | **Skip (see Batch 10)** | Re-ranked above SMS/Telegram for anonymous acquisition via click-to-WhatsApp ads; re-engagement use case unchanged/deferred |
| `@hamzasaleemorg/convex-comments` | 1.0.2 | **Skip (see Batch 8)** | Phrase-anchored resonance is the idea to keep; no built-in auth enforcement or retention |
| `convex-notification` | 0.1.1-alpha.1 | **Skip (revisit at v1.x)** | Typed in-app notifications — right design, alpha stability risk; build thin owned version now |
| `@convex-dev/rate-limiter` | 0.3.2 | **Install** | AI generation spend guard, per-user frequency controls, push dedup |
| `@convex-dev/resend` | 0.2.3 | **Install** | Weekly summary email, milestone notifications, transactional email, re-engagement drip |
| `convex-revenuecat` | 0.1.11 | **Install (when monetization scoped)** | Entitlement gating for insights, AI model tiers, Pro feature access |
| `@clipin/convex-wearables` | 0.1.0 | **Skip (V2)** | HRV/sleep/recovery context for emotionally-aware AI mirrors and insights |
| `@convex-dev/twilio` | 0.2.2 | **Skip (high-priority revisit)** | SMS-native low-friction entry point; masked-proxy channel for listener/peer-counsellor program |
| `@dayhaysoos/convex-database-chat` | 0.2.0 | **Skip (revisit)** | Natural-language ops tool for clinical/safety/moderation review once that team exists |
| `@djpanda/convex-authz` | 2.4.1 | **Skip (bring in before listener program launches)** | RBAC/ReBAC/audit backbone for listener tiers, chat access, circle moderation |
| `@vllnt/convex-consent` | 0.1.0-canary | **Skip (watch closely)** | Append-only GDPR consent ledger — right design, too immature to depend on yet |
| `convex-nano-banana` | 0.1.0 | **Skip** | Gemini image gen — wrong provider, no compelling non-gimmick use case found |
| `@convex-dev/presence` | 0.3.2 | **Install (narrow use)** | Anonymous ambient co-presence count; later, listener availability routing |
| `@vllnt/convex-reactions` | 0.1.0-canary | **Skip (copy the shape)** | Texture-word-vocabulary resonance, listener-session quality tap; canary-stage |
| `@vllnt/convex-comments` | 0.1.0-canary | **Skip (copy the shape)** | Best-designed threaded-comments option (real auth enforcement, built-in retention); canary-stage |
| `@vllnt/convex-notifications` | 0.1.0-canary | **Skip (copy the shape)** | Fan-out delivery + retention cron worth copying; missing dedupeKey, canary-stage |
| `convex-telegram` | 0.1.1 | **Skip (revisit)** | Privacy-safer front door than SMS/WhatsApp (no phone-number anchor); narrower reach, early package |
| `@mux/convex` | 0.3.2 | **Skip** | Wrong shape for voice input (file storage) or live calls (WebRTC); fits only a future produced-content library |
| `@vllnt/convex-flags` | 0.1.0-canary | **Install** | AI pipeline kill-switches, prompt-rollout experiments, staged feature/insight-unlock rollout |
| `convex-timeline` | 0.1.2 | **Skip** | Mirror-version back-navigation idea is good — build it into reflection-reducer.ts, not this component |

---

## Batch 7

### Consent Ledger — `@vllnt/convex-consent` · v0.1.0-canary

**What it does**
An append-only GDPR consent store. `record` writes an immutable event (server-sourced timestamp, opaque typed `proof`) and updates an O(1) current-state projection; `check` is the runtime gate a mutation/query calls before doing anything the consent covers, and returns whether the grant is stale relative to the current policy version. `withdraw` appends an Art. 7(3) revocation as a new event rather than editing history. `history` pages the full trail for a data-subject request.

**Ideas for Xolace**
Xolace's entire brand promise is "privacy-first," which is a much bigger claim than most apps make and one that actually needs proof, not just a settings toggle. Right now consent is implicit and scattered — a checkbox at signup, maybe a toggle in preferences — with no durable record of *what* a user agreed to, *when*, or *under which version of the policy*. That gap becomes a real liability the moment any of the following ship (several already do, per earlier batches):

- **Anonymized peer-pool contribution** — the app already has a hard rule that crisis sessions are excluded from the peer pool, but there's no equivalent proof-of-consent for the *non*-crisis sessions that do get distilled and surfaced to strangers. `consent.record(ctx, userId, "peer_pool_contribution", "granted", { proof: { policyHash } })` at the point a user first sees "your reflections may help others" gives you an actual audit trail, and `check(ctx, userId, "peer_pool_contribution", currentPolicyVersion)` becomes the literal gate in the distiller job — not a boolean field that's easy to accidentally ignore in a new code path.
- **Wearables sync (V2)** — the Batch 5 wearables analysis already flagged HRV/sleep data as "among the most sensitive personal data that exists." A consent-ledger purpose (`wearables_hrv`, `wearables_sleep`) with its own withdrawal path is the right shape for data this sensitive — separable per data type, independently revocable, not bundled into one giant "I agree" at OAuth time.
- **Trusted-contact escalation** and any future **SMS/WhatsApp opt-in** (Batch 4/6) — both are opt-in-only by design in those analyses. This component is literally built for "purpose-specific grants, individually revocable, with a proof of what was agreed to" — exactly the shape those features already need.
- **Policy version staleness solves a real recurring headache for free** — every time the privacy policy updates (and for an app handling emotional disclosure, it will, repeatedly, as features ship), `stale: true` automatically flags every user whose consent predates the new version, without a migration script or a manually maintained "who needs re-prompting" query. That directly composes with the existing `dataRetention.ts` / `dataWipe.ts` / `accountDeletion.ts` jobs — a DSR handler can call `history()` and hand back a complete, legally defensible consent trail in one call instead of reconstructing it from scattered boolean fields across tables.
- **Multi-purpose isolation via multiple mounts** — web consent and any future marketing-email consent (Resend) can live in separate sandboxed tables via two `app.use` calls, so a withdrawal in one purpose can never leak into or accidentally touch another.

**The canary problem**
This is the load-bearing risk. v0.1.0-canary, 11 weekly downloads — this is pre-alpha, essentially unreleased. The design is exactly right (append-only, server-sourced time, typed proof, staleness-by-version) and notably more thought-through than most consent implementations apps build themselves under deadline pressure. But taking a production dependency on a canary package for the thing that produces your legal proof of consent is backwards — if the package disappears, changes its API, or has an undiscovered bug in the append-only guarantee, the failure mode is "we can't prove what we told users, and what they agreed to." That's a worse position than not having the shiny component at all.

**Verdict: Skip today, watch closely.** Same posture as `convex-notification` in Batch 4: the design is right, the maturity isn't there yet. Unlike a notification system, though, this doesn't need to wait for a specific new feature to become useful — it's already overdue for anonymized peer-pool contribution consent. If this stays maintained and reaches something like a 1.0 in the next few months, prioritize migrating scattered consent booleans into it. In the meantime, if a consent trail is needed sooner than that (e.g. before shipping wearables), the append-only-event pattern here is worth copying directly into an owned `consentEvents` table — it's a genuinely good design to borrow even without taking the dependency.

---

### Nano Banana — `convex-nano-banana` · v0.1.0

**What it does**
Wraps Google Gemini's image generation/editing API with Convex-native persistence: generation requests are tracked as reactive documents (`pending` → `generating` → `complete`/`failed`), output images land in Convex file storage automatically, and a React hook re-renders as status changes. BYO Gemini API key, per-request or per-tenant.

**Ideas for Xolace, considered honestly**
The instinct to reach for AI image generation in a mental-health app is usually a red flag — it tends to produce exactly the "orb and ember" visual clichés the design direction has already explicitly moved away from, or worse, tips into something that reads as gimmicky against a product whose whole value proposition is emotional precision, not visual spectacle. Worth naming the one idea that's actually interesting before dismissing the rest:

- **Abstract, non-representational visualization of a session or week as generated art** — not a mascot, not a literal scene, but something closer to a generative-art rendering of the *shape* of an emotional frequency map: color, density, and form derived from the week's aggregate data (from `@convex-dev/aggregate`, Batch 1) rather than from a prompt describing feelings in words. The distinction that matters: the image would be a data visualization that happens to be beautiful, not an AI "illustration of your sadness." If ever built, it replaces a bar chart on the insights screen, not a chatbot avatar.

Everything else — mockups, product photos, avatar generation, illustrated companions — doesn't fit. Xolace has no profiles, no content feed, no avatars, and the "no orb/ember visuals" direction already on record is really a broader instruction: don't let generated visuals stand in for actual product thinking about what a screen needs.

**The harder problem: provider mismatch**
Every model call in this codebase is required to live under `convex/ai/` and go through the Anthropic provider (`getAnthropicClient`, no Node runtime needed since it's fetch-based). Nano Banana is Gemini-only, requires its own API key management, and would be the first non-Anthropic model dependency in the stack. Even for the one plausible use case above, that's a second AI vendor, a second billing relationship, and a second set of API-key rotation and rate-limit concerns for a feature that's genuinely optional polish, not core loop infrastructure.

**Verdict: Skip.** The one idea worth keeping (data-driven abstract visualization as an insights-screen upgrade) doesn't need this component or Gemini specifically — it needs a design decision first, and could be built with a deterministic generative-art algorithm (seeded by the aggregate data, zero AI cost, zero vendor dependency, fully reproducible) rather than a stochastic image model. Revisit only if a designer explicitly wants LLM-generated art over deterministic generative art for that specific screen, and even then, evaluate Gemini vs. staying within the existing Anthropic-only architecture rule before adopting a second provider.

---

### Presence — `@convex-dev/presence` · v0.3.2

**What it does**
Real-time "who's in this room" tracking via heartbeat mutations and scheduled-function-based cleanup — no polling, no query re-execution storms. `usePresence` sends heartbeats and handles disconnect on unmount/tab-close. Ships a `FacePile` avatar-stack component, but the underlying `heartbeat`/`list`/`disconnect` primitives are usable without it.

**Ideas for Xolace**
The packaged use case (avatar face-piles showing who's viewing a shared doc) is exactly the social-app pattern Xolace's product principles rule out — no profiles, no visible identity, nothing resembling "3 people are looking at this." But strip the `FacePile` UI away and what's left is a cheap, real-time *count* of who's in a room without exposing who — and that maps onto the campfire metaphor almost too well:

- **Ambient co-presence signal, anonymous** — "12 people are sitting with something right now" on the idle or path-selection screen, backed by a presence room keyed to something coarse like a rolling time bucket or emotion-tag cluster, not a room the user ever "joins" in any social sense. This is the live, felt version of the "quiet voices from others in the darkness" language already used to describe the product — Batch 1's Aggregate component could answer "how many processed this week" as a historical stat, but Presence answers "how many are with you *right now*," which is a genuinely different and more visceral signal. No identity ever surfaces; the room list is discarded, only `list(...).length` is read.
- **Listener availability, once the listener program exists** — the first real routing problem a 7cups-style listener layer has is "is anyone actually available to talk right now, or does this person hit an empty queue." A `listeners-online` room where certified/on-duty listeners heartbeat while active gives instant, reactive availability state for routing — far cheaper than polling a status field, and it degrades gracefully (a listener whose tab closes stops heartbeating and drops out automatically, no manual "set yourself offline" step to forget).
- **Live session-in-progress signal for crisis routing** — if a session gets flagged for review (the human-in-the-loop moderation case from the Workflow analysis in Batch 3), a presence room of on-call reviewers tells the escalation workflow whether to expect a fast human response or fall back to the conservative auto-resolve path immediately, rather than waiting out a fixed timeout when nobody is even online to review.

**What to explicitly not build with this**
Skip `FacePile` entirely — it's built for showing *who*, and Xolace's anonymity guarantees mean the UI must only ever show *how many*. Any integration here should read `list()` for a count and discard the rest of the payload before it reaches a component.

**Verdict: Install narrowly, for the ambient co-presence count only, now.** It's a small, low-risk addition (12k weekly downloads, mature, get-convex-authored — same publisher as Aggregate, Sharded Counter, Crons, Workpool, Workflow, RAG, already in the "install" list) that makes the campfire metaphor tangibly real on the idle/path-selection screens with almost no engineering cost. Treat listener availability and crisis-routing presence as a second, later integration of the same component once those programs exist — same install, different rooms.

---

## Batch 8 — Correcting a bias, and the comments/reactions family

**Framing note.** Batch 4 evaluated `@hamzasaleemorg/convex-comments` and skipped it on the grounds that "Xolace has no social communication layer... other users are distant voices in the dark, they don't talk back." That reasoning treated the *current* 9-state reflect loop as the permanent shape of the product. It isn't. The roadmap is explicit (and was restated directly for this batch): a social layer is coming — listeners/peer counsellors in a 7cups mold, but leaning Reddit-community-first rather than 1:1 chat-first, with real conversation surfaces eventually on the table. Per the Batch 6 framing note, the bar for any social or engagement mechanic isn't "does this look like a social app" — it's generative vs. extractive. This batch re-litigates the comments verdict against that bar, and brings in two smaller, more sharply-scoped alternatives from the same publisher for a proper comparison.

### Convex Comments — `@hamzasaleemorg/convex-comments` · v1.0.2 (re-analysis)

**What it does** — see Batch 4 for the full mechanical description: zones → threads → messages, auto-parsed mentions/links, emoji reactions, typing indicators, soft-deletes, positioned threads (`position: { x, y, anchor? }`) for anchoring to a canvas coordinate, timestamp, or arbitrary anchor string. Optional React UI kit. Three integration modes (`Comments` class, direct component calls, `exposeApi()` wrappers).

**The idea Batch 4 missed entirely: phrase-anchored resonance**
The `position.anchor` field is documented for canvas/PDF/video annotation, but nothing about it is canvas-specific — it's just an opaque string the host attaches meaning to. Xolace's core thesis is that the AI "mirrors it back with more precision than they could find themselves." Right now, felt-solidarity in peer reflections is post-level and binary — one resonance tap for an entire reflection. An anchor string that's a sentence or clause index into the anonymized mirror text turns that into phrase-level recognition: a stranger's "I felt this too" can attach to the exact line that landed, not the whole post. That's a materially richer signal than today's flat resonance count, and it's the single most product-differentiated idea in this batch — nobody in the wellness-app space is doing "someone recognized *this specific sentence* of what you wrote," and it's a direct, mechanical extension of the mirroring metaphor rather than a bolted-on social feature.

**Other roadmap-aligned uses, now that the social layer isn't hypothetical**
- **Zone/thread hierarchy as the Reddit-style circle structure** — a zone maps to a circle/topic, a thread to a post inside it, messages to replies. The component doesn't enforce reply depth, so the app layer would need to cap it (one level, no cascading sub-threads) to preserve "quiet voices from the dark" rather than becoming an argument thread — that's a product decision to make explicitly, not something the component gives you for free.
- **`resolveThread` as a "held" signal for listener conversations** — once a listener/peer-counsellor program exists, marking a thread resolved is a natural proxy for "this conversation reached a stopping point," which is a much healthier metric to build listener-quality signals or Checkpoints-style milestones on (Batch 2) than raw message-count or response-time — sessions *held to completion*, not sessions farmed for volume.
- **Typing indicators, but only once real 1:1 listener chat exists** — `setIsTyping`/`getTypingUsers` (with its 3-second auto-expiry) is a legitimate primitive for an actual listener conversation, where "they're typing" is expected chat UX. It's the wrong tool for the ambient "N people are here" signal on the idle screen — that's Presence (Batch 7), which is purpose-built for a count and already vetted for install.
- **Soft-delete as a right-to-be-forgotten lever on peer-pool contributions** — letting the *original* author of a distilled, anonymized reflection revoke it after the fact, even after strangers have reacted to it, closes a real trust gap and composes cleanly with the consent-withdrawal path proposed for `@vllnt/convex-consent` in Batch 7.

**What's still a real problem, independent of product fit**
- **Ownership isn't enforced by the component.** `editMessage` and `deleteMessage` both take `authorId` as an *optional* argument the caller supplies — there's no visible mechanism where the component itself checks that the caller is the original author before mutating. That's the exact anti-pattern this codebase's Convex rules explicitly forbid ("NEVER accept a userId... as a function argument for authorization purposes"). Using this safely means writing a disciplined wrapper around every mutating call that reads the identity server-side and checks it manually — the component doesn't do that work for you, and nothing stops a future contributor from calling it without the wrapper.
- **No retention story.** Everything else in this codebase's soft-delete/anonymization/wipe pipeline runs through `convex/jobs/dataRetention.ts` and friends. This component has no cron, no `prune()`, no participation in that pipeline — messages posted through it live in their own sandboxed tables outside the existing retention machinery entirely, unless someone builds a custom sweep for it.
- **Single maintainer, 124 weekly downloads, no stated test coverage.** Not disqualifying on its own, but combined with the two problems above, it's a package you'd be trusting with content adjacent to real emotional disclosure, without much evidence it's been hardened for that.

**Verdict: still Skip for direct install — but reverse the reasoning.** It's not "wrong product fit" anymore; the roadmap makes it a plausible fit. It's "right shape, wrong maturity for what it'd be holding." The phrase-anchored resonance idea and the zone/thread/resolve model are worth keeping — they should get built as an owned schema once the social layer is actually being scoped, informed by this package's shape rather than depending on the package itself.

---

### `@vllnt/convex-reactions` · v0.1.0-canary

**What it does** — a minimal toggleable-edge model: `react(authorRef, resourceRef, kind)` adds/removes a reaction transactionally, `counts()` tallies reactively per kind, `reactors()` pages who reacted, `hasReacted`/`myReactions` give per-subject state. `allowedKinds` pins the vocabulary; omit it for freeform. Fully sandboxed, auth-agnostic, no UI.

**Ideas for Xolace**
- **Pin `allowedKinds` to the existing texture-word vocabulary, not emoji.** The idle screen already has a fixed set (heavy, tight, foggy, buzzing, empty, scattered, numb, raw). Reacting to a peer reflection with the same words used to compose it turns a decorative like-button into structured data — "I felt buzzing too" is a real emotion-tag observation, not a generic thumbs-up, and it composes directly with the Aggregate-based emotional frequency map from Batch 1 instead of living in its own disconnected reactions table.
- **`reactors()` as an internal-only quality signal, never surfaced to users.** Xolace's anonymity guarantee means reactor identity should never reach the UI — but a paginated reactor list is exactly what feeds the "reflection hit 50 resonances → fire the distiller early" Checkpoints idea from Batch 2, and it's useful for whatever moderation/ops tooling eventually exists (Batch 6's DatabaseChat use case) without ever exposing who did the reacting.
- **A single-tap post-listener-session quality signal.** Once a listener program exists, a lightweight `react(userId, sessionId, "helped")` at session end is a much lower-friction, less scorekeeping-flavored quality signal than a star rating — one tap, no number attached for the listener to obsess over, paired with the audit trail `convex-authz` would provide (Batch 7) for who's accountable for what.

**Verdict: Skip for direct install, but this is the shape to copy.** It's exactly what the current peer-reflection resonance mechanic already approximates by hand (Sharded Counter + a boolean field, per Batch 1), and the API surface here (`react`/`counts`/`reactors`/`hasReacted`) is a clean reference for what an owned version should look like if it's rebuilt as a shared primitive across peer reflections, future listener-session feedback, and circle posts. Same canary-stage caution as everything else from this publisher (see below) — reimplement the pattern natively with `requireAuth()`-resolved identity rather than depending on a near-unreleased package for it.

---

### `@vllnt/convex-comments` · v0.1.0-canary

**What it does** — threaded comments on any `resourceRef`: `post(resourceRef, authorRef, body, parentId?)`, author-gated `edit`/`remove`(soft-delete)/`resolve` that throw `NOT_AUTHOR` on mismatch, `list`/`count` reactive pagination, `prune()` plus a built-in daily cron for retention. No reactions, no mentions, no typing indicators, no UI kit, no positioned/anchored threads.

**Head-to-head against `@hamzasaleemorg/convex-comments`**
This is the same category of component — threaded discussion on a resource — stripped to a much smaller surface, and the two differences that matter most both favor this one on rigor:
- **Ownership is enforced *inside* the component**, not left to the caller's discipline. `edit`/`remove`/`resolve` compare the supplied `authorRef` against the row's stored one and throw `NOT_AUTHOR` on mismatch — a real guarantee, not an optional argument nobody's forced to check.
- **Retention is built in.** `prune()` plus a daily cron for soft-deleted rows is a direct match for the `dataRetention.ts`/`dataWipe.ts` pattern this codebase already runs everything else through — adopting this package (or copying its retention shape) means one fewer bespoke sweep job to write and maintain.

What it gives up to get there: no reactions (pair with `@vllnt/convex-reactions` above — same publisher, same design philosophy, meant to be composed), no mentions, no typing indicators, and critically, no positioned/anchored threads — so the phrase-level resonance idea above isn't available here at all. If that's the priority feature, this package doesn't do it; you'd be borrowing the anchor concept from the other package regardless of which threading component you pick.

**Verdict for the comparison: if a threaded-comments component were being installed today, this is the better-designed one, not the more complete one.** Choose it over `@hamzasaleemorg/convex-comments` on security posture and retention fit if a decision had to be made right now. But it shouldn't be made right now — see below.

---

### The publisher pattern worth naming

`@vllnt/convex-consent` (Batch 7), `@vllnt/convex-reactions`, and `@vllnt/convex-comments` are all the same author (`bntvllnt`/vllnt), all canary-stage, all in the 10-13 weekly download range, and all share a consistent, genuinely good design philosophy: sandboxed tables invisible to host schema, auth-agnostic with the host resolving identity and passing opaque refs, server-sourced timestamps a caller can't forge, 100%-coverage test claims run against real component runtime rather than mocks. That's a *better* match for this codebase's own Convex conventions (`requireAuth()`, never trust a client-supplied identifier, sandboxed component data) than the more feature-complete but looser `hamzasaleemorg` package. But "consistently well-designed" and "safe to depend on in production for content adjacent to emotional disclosure" are different claims — three canary packages in the 10-13 download range from one small publisher is a pattern to watch, not a green light yet.

**Verdict: Skip installing any of the three today.** Recommended path: when the anchored peer-resonance feature or the Reddit-style circle/listener layer actually gets scoped, build owned versions informed by both packages' shapes — `react`/`counts`/`reactors` from `@vllnt/convex-reactions`, `post`/`edit`/`remove`/`resolve`/`prune` with real author enforcement from `@vllnt/convex-comments`, and the `position.anchor` concept from `@hamzasaleemorg/convex-comments` for phrase-level resonance — wired into `requireAuth()` and the existing `dataRetention.ts` cron rather than a separate retention mechanism. Revisit installing the actual `@vllnt` packages once they clear canary, using the same "watch closely" posture as `@vllnt/convex-consent`.

---

## Batch 9

### `@vllnt/convex-notifications` · v0.1.0-canary

**What it does** — a per-subject directed inbox: `deliver(subjectRef | subjectRefs[], type, payload?)` fans out one row per recipient in a single mutation, everything arrives unread, `list`/`unreadCount`/`get` are reactive, `markRead`/`markAllRead` clear read state (the latter as a bounded, self-rescheduling pass), a daily cron `purge`s read notifications past retention (unread are never purged), and `payloadValidator` types the stored payload at the boundary. Same publisher and design philosophy as the other `@vllnt` packages in Batch 8 — sandboxed tables, auth-agnostic, server-sourced time.

**Direct comparison to `convex-notification` (Batch 4, different author, v0.1.1-alpha.1, Skip/revisit-at-v1.x)**
This is the second notifications component evaluated in this doc, and the comparison sharpens what actually matters for Xolace's use case:
- **Missing `dedupeKey`.** Batch 4 called deduplication "table stakes" specifically because of a concrete Xolace scenario: the follow-up Workflow and the lapse-detection cron can both fire for the same user in a short window, and without a dedupe guard that's a double-notification. `convex-notification` had a `dedupeKey` field built in; this package has none — a caller has to implement idempotency itself (check-then-deliver), which reintroduces the exact read-then-write race the other package's field was designed to close.
- **Retention is better here.** `convex-notification` didn't describe a retention/purge story; this one has a daily cron sweeping read notifications in bounded batches, matching the `dataRetention.ts` pattern already used elsewhere in this codebase, and unread notifications are explicitly protected from the sweep — the right default for something like an unread "insight unlocked" card a user might not open for weeks.
- **Fan-out is a real ergonomic win for the roadmap, not just this codebase's current loop.** `deliver(subjectRefs[], ...)` in one mutation call is exactly the shape needed once there's a listener/circle layer: notify every on-duty listener when an escalation session needs human review (composes with the Presence "on-call reviewers" idea and the Workflow human-in-the-loop moderation case, both Batch 3/7), or notify every subscriber of a circle when a new post lands, Reddit-digest style. `convex-notification`'s `kinds` registry is arguably the better typed-payload story for a single recipient, but neither package's design was built with multi-recipient fan-out as a first constraint the way this one is.

**Ideas for Xolace** — the notification *types* imagined in Batch 4 (insight unlocked, peer resonance, weekly summary ready, follow-up check-in, streak milestone, session nudge) all still apply verbatim regardless of which package or owned implementation delivers them; nothing here changes that list. What's new in this batch is the multi-recipient angle above, and one more: **circle-digest delivery** — a single `deliver()` call to every subscribed subject when a Reddit-style circle produces something worth surfacing (a highly-resonated anonymized reflection, a listener going on duty) turns "who do I need to notify" into one line instead of a loop written by hand each time a new fan-out notification type is added.

**Verdict: Skip — same canary-stage caution as the rest of the `@vllnt` fleet (11 weekly downloads), and it's missing the one feature (`dedupeKey`) already identified as necessary for a real Xolace scenario.** The right move is still what Batch 4 recommended: build a small owned `notifications` table now. Take the `kinds`/`dedupeKey` idea from `convex-notification`, the retention-cron and fan-out-array shape from this package, and wire it into `requireAuth()` and the existing retention job. Neither third-party option is mature enough to depend on, but between the two, this one's fan-out design is worth copying even though its dedup story is worse.

---

### Telegram Bot — `convex-telegram` · v0.1.1

**What it does** — wraps the Telegram Bot API: typed `bot.api.*` client for outbound calls from Convex actions, an HTTP webhook route (`registerRoutes`) for inbound updates with secret-token verification, handler dispatch keyed by update type (`message`, `callback_query`, …), and a one-time `setupWebhook()` call to point Telegram at the deployment.

**How this compares to the Twilio SMS and WhatsApp analyses (Batches 4 and 6) — a real privacy difference, not just another channel**
Both of those verdicts turned on the same tension: SMS and WhatsApp both anchor a session to a real phone number, a durable real-world identity link that cuts against Xolace's privacy-first posture, mitigated only by explicit opt-in and content-free message bodies. Telegram bots don't have that problem in the same way — a bot only ever receives a platform-scoped numeric `user_id`/`chat_id`; it never sees a phone number unless the user explicitly shares their contact card, which a well-designed flow simply never asks for. That's a materially better privacy story for the same "low-friction entry point for someone who can't yet name what they're feeling" idea proposed for SMS in Batch 6:
- **A campfire front door with no identity anchor at all** — "message the bot with whatever's here, get one line back" works exactly like the SMS pitch, minus the phone-number linkage risk. For the segment of the target audience already on Telegram (skews privacy-conscious and international relative to SMS/WhatsApp's more universal reach), this is arguably the *safer* version of the same idea, not just an alternative channel.
- **Inline keyboards put the actual texture-word interaction inside the channel**, not just plain text. SMS can only ever be free text; a Telegram bot can render the same heavy/tight/foggy/buzzing/empty/scattered/numb/raw tap targets as inline buttons, which is a closer match to the in-app idle-screen affordance than any SMS-based front door could get.
- **Bot-mediated relay is inherent anonymity infrastructure for a future listener channel, with none of the plumbing Twilio's proxy-number pattern requires.** Batch 6 flagged Twilio's number-masking as close to a hard requirement for a safe anonymous listener channel over SMS — two real numbers, a proxy session binding them, teardown on demand. A Telegram bot doesn't need any of that: both the user and the listener only ever talk to the bot account itself, so neither party's Telegram identity is ever exposed to the other by construction. If a listener channel ships on this rail instead of SMS, the hardest trust problem in peer support (talk to a stranger without doxxing yourself to them) is closer to free.
- **Anonymized-aggregate broadcast, low-risk.** A read-only Telegram channel (not the 1:1 bot) publishing something like "today's most-resonated reflections" — pre-anonymized, aggregate, zero personal data — is a nearly risk-free discovery/marketing surface completely outside the privacy-sensitive parts of the product.

**Why it's still not the move for MVP**
Reach is the real constraint, not privacy: Telegram's install base skews heavily toward specific regions and a tech-forward demographic, and as a *primary* front door for the broad target audience it's far narrower than SMS. Layering it in now would also mean juggling a third outbound-messaging integration (after the still-unscoped WhatsApp and Twilio SMS verdicts) before any one of them is proven — better to validate the content pattern (nudge copy, opt-in consent flow via the `@vllnt/convex-consent` design from Batch 7) on one channel first. The package itself is also early — v0.1.1, single contributor, 5 weekly downloads — reasonable structure (typed client, webhook secret verification, a `convex-test` helper) but with none of the production mileage `@mux/convex` below has.

**Verdict: Skip for MVP — but re-rank it above WhatsApp as the second candidate (after Twilio SMS) when a messaging-first entry funnel actually gets scoped.** The decision between Telegram and SMS at that point is a reach-vs-privacy trade-off worth making deliberately (and they're not mutually exclusive — a masked-listener channel might end up on Telegram specifically because it sidesteps the proxy-number plumbing SMS needs), not something to resolve by installing a third channel speculatively today.

---

### Mux — `@mux/convex` · v0.3.2

**What it does** — official first-party component syncing Mux's video platform into Convex: tables for `assets`, `uploads`, `liveStreams`, `events`, plus an app-level `videoMetadata` table for ownership/tags/custom fields. Backfill for existing Mux catalogs, webhooks for real-time state sync, query helpers, and a companion `@mux/convex-mux-init` CLI that scaffolds the app-level webhook/HTTP wiring. Mature relative to everything else evaluated recently — 329 weekly downloads, versioned, official Mux org.

**The one plausible future need: voice input, and why this is the wrong shape for it**
CLAUDE.md's Cognition Layer Constitution Rule names the actual future modality explicitly: "a new modality (voice/vent)" is called out as one of the few things that would justify a new model call outside the existing Understanding pipeline. If Xolace ever lets someone speak their reflection instead of typing it, that's a real, foreseeable use case — and Mux is built for the wrong problem. Mux's data model is a persistent video/audio *catalog*: assets with playback IDs, thumbnails, durable per-object metadata, designed for content you publish and keep. A voice-vent input is the opposite shape — a short, private, almost certainly ephemeral clip that exists only long enough to get transcribed, after which the same privacy-first instinct that governs raw text (anonymize, distill, eventually wipe) should apply to the audio even more aggressively. That's plain Convex file storage (`ctx.storage`, a blob upload) plus a transcription action under `convex/ai/`, not a video CMS with webhook-synced asset records that assume something worth cataloging was just created.

**The other plausible future need: live listener calls, and why this is also the wrong tool**
If the listener/peer-counsellor program ever adds voice or video calls, that's real-time two-party communication — WebRTC territory (LiveKit, Daily.co, or similar), not video-on-demand. Mux's asset model assumes a call gets recorded into a durable, playable object; for a privacy-first mental health app, permanently recording a peer support conversation as a persistent, webhook-tracked asset is close to the opposite of the right default. If live listener calls ever ship, the infrastructure question is "ephemeral, unrecorded, low-latency two-way," and Mux doesn't answer that question at all.

**Where it would actually fit, if this ever gets built**
The `sit-with-this` screen is currently a "breathing/guided exercise placeholder." If that evolves into an actual library of produced guided-exercise content — meditation audio or video recorded once and served to every user, not user-generated and not ephemeral — that's a genuine VOD catalog, and Mux is squarely the right tool for it: real content, meant to be published and kept, with thumbnails and playback state that benefit from reactive sync. That's a completely different content category from anything user-generated in this app, which is exactly why it doesn't conflict with the privacy concerns above.

**Verdict: Skip.** Both plausible near-term use cases (ephemeral voice input, live listener calls) are the wrong shape for a VOD-catalog component — one wants file storage plus a transcription action, the other wants real-time WebRTC infra. Revisit specifically and only if the guided-exercise placeholder becomes a produced content library, which is a distinct, much later product decision from anything in the current core loop or near-term roadmap.

---

## Batch 10

### Feature Flags — `@vllnt/convex-flags` · v0.1.0-canary

**What it does** — backend-evaluated feature flags: boolean kill-switches, string/number variants, weighted percentage rollouts with stable per-subject bucketing, ordered attribute-targeting rules, and per-subject overrides for QA/support. Evaluated inside Convex queries, so every change streams live to connected clients with no redeploy. Archive is reversible and distinct from hard delete. Same sandboxed-tables, host-owns-auth design as the rest of the `@vllnt` fleet, optional React hooks.

**Ideas for Xolace**
- **A real safety lever for the AI pipeline, not just an engineering convenience.** The articulator/distiller/classifier prompts in `convex/ai/prompts/` and the safeguard model in `convex/ai/safeguard.ts` are the highest-stakes code in the app. A kill-switch that falls back to a known-conservative behavior (e.g. "always show the gentle escalation prompt when uncertain") the instant something is misbehaving in production is a materially faster mitigation than a redeploy — minutes of blast-radius control during a live incident instead of a full build/ship cycle, for the one part of the app where that gap matters most.
- **Canary prompt rollouts against a real outcome metric.** CLAUDE.md already lists mirror confirmation rate as tracked session data. A percentage rollout of a new articulator prompt to 5% of sessions, watched against confirmation rate before ramping to 100%, turns prompt iteration into an actual experiment instead of a blind ship — no separate A/B framework needed, just this component plus data that's already being collected.
- **Model-tier experiments decoupled from monetization.** `variant()` returning `"haiku"` vs `"sonnet"` per subject lets a cheaper/faster model be smoke-tested against confirmation-rate deltas independent of the RevenueCat-gated Pro/Free tiering proposed in Batch 5 — a quality question and a pricing question, answerable separately instead of conflated into one entitlement check.
- **The store-gap problem, from the other direction.** CLAUDE.md's Deferred Deprecations section already handles "old shipped UI calling a newer backend." Flags handle the mirror case: gate a new backend behavior behind a flag until the corresponding UI has actually cleared app review and is confirmed live, then flip it on — instead of leaning purely on optional-argument tricks for every staged rollout.
- **Staged rollout of milestone/insight-unlock features** (Batch 2's Checkpoints ideas) to a cohort defined by attribute targeting (e.g. `sessionCount > 30`) rather than exposing a new unlock to every eligible user the moment the code merges.
- **Force-on for app-store reviewers.** A per-subject override on the review team's test account guarantees Apple/Google reviewers see the fully-rolled-out state of a feature that's still ramping to real users — a clean way to decouple "what reviewers see" from "what's live for everyone."

**Why this one clears a bar the rest of the `@vllnt` fleet didn't**
Batch 8 and 9 skipped every canary-stage `@vllnt` package on the same grounds: pre-1.0, single-digit-to-low-double-digit weekly downloads, and — critically — each one would be holding user-generated content adjacent to real emotional disclosure (comments, reactions, notification payloads), where an undiscovered bug's failure mode is a privacy or data-integrity problem. This component breaks that pattern in two ways worth naming explicitly rather than pattern-matching "canary → skip" again: **168 weekly downloads** is an order of magnitude more usage than any other package from this publisher evaluated so far, and — more importantly — **a flags bug has a fundamentally different, much smaller blast radius**. Flags store operational configuration, not user content; if evaluation misbehaves, the failure mode is "a feature was on/off for the wrong subject," which is visible immediately and trivially reversible by flipping the flag back. That's a different risk category from "we can't prove what a user consented to" or "a soft-deleted comment didn't actually get removed."

**Verdict: Install — for operational/infrastructure use to start.** This is the first `@vllnt` package in this analysis that earns a genuine install rather than a "copy the shape, build it yourself." Wire it in for kill-switches and staged rollouts around the AI pipeline first, where the value is highest and the content passing through the component is zero. Hold off on using it to gate anything that itself touches sensitive user state until the version stabilizes past canary — the component's own risk is low, but there's no reason to stack it with a second immature dependency.

---

### Timeline — `convex-timeline` · v0.1.2

**What it does** — undo/redo with named checkpoints, scoped by an arbitrary string key. `push()` adds a state snapshot; `undo()`/`redo()` navigate; pushing after an undo prunes the now-unreachable forward branch (matching Google Docs/VSCode/Notion behavior); checkpoints are stored separately so they survive pruning, and restoring one creates a new undoable node rather than time-traveling. Configurable per-scope-prefix capacity limits. 3,370 weekly downloads — the most production traction of anything evaluated since Aggregate/RAG/Workpool in the early batches, single author.

**The idea worth taking seriously: mirror-version back-navigation during clarify**
The obvious use cases (document editors, drafts, wizards) don't map onto anything in the current core loop — but there's a real, non-obvious fit hiding in the clarify state. Each clarify turn produces a *new version of the mirror*, and `MAX_TURNS = 2` means a user can end up looking at mirror v3 having genuinely preferred v1 or v2. Right now there's no way back to an earlier mirror short of starting over. Scoping a Timeline to `sessionId` and pushing each generated mirror as a node would give `canUndo`/`canRedo` for free — a lightweight "go back to what you said before" affordance during Mirror/Clarify states, with zero extra AI cost since it's just re-displaying prior state, not a new generation. The stakes here are genuinely emotional (picking the mirror that actually felt accurate matters to the product's whole thesis), and the prune-forward-on-new-push behavior is exactly right for "if I go back and then clarify again, the old forward branch should disappear" — this is a legitimately good idea, better than anything the obvious use-case list suggests.

**Why the component is still the wrong call for it**
`MAX_TURNS = 2` caps the timeline at three nodes, ever, scoped to a single session that's normally completed in one sitting. That's not a workload this component's actual value-adds — configurable pruning at scale, cross-session/cross-device persistence, capacity management — are built for; it's small enough that the `reflection-reducer.ts` CLAUDE.md already describes (pure, 11 action types) is a better home for it directly: two more action types (`GO_BACK`/`GO_FORWARD`, bounded by a `mirrorHistory` array already sitting in reducer state) is a smaller, more legible change than standing up a new Convex component, a new table, and a scope-keying convention for a list that never exceeds three items and never outlives one session. It also sidesteps a real gap in the component itself: no built-in retention/expiry — timelines persist until something explicitly calls `clear`/`deleteScope` — which means adding it would mean inventing a lifecycle policy for session-shaped state that the existing `dataRetention.ts` pipeline doesn't already know about.

**Verdict: Skip — keep the idea, skip the dependency.** Build mirror-version back-navigation directly into `reflection-reducer.ts`. If a genuinely open-ended, multi-step, possibly-cross-device drafting surface shows up later — a multi-step onboarding wizard, or a listener composing a considered response with real draft history — that's the point to revisit this component; the current core loop doesn't have a workload that needs it.

---

### WhatsApp Cloud API — `convex-whatsapp` · v1.1.5 (re-analysis)

**Batch 4's verdict, restated:** skip, revisit at engagement-layer phase, because WhatsApp ties every message to a phone number — a real-world identity anchor at odds with a privacy-first product — mitigated only by explicit opt-in and content-free nudges. That analysis treated WhatsApp exclusively as a *re-engagement channel for existing users*, which undersold what's actually distinctive about this platform versus SMS or Telegram (Batches 6 and 9). Revisiting with that framing corrected:

**The idea Batch 4 missed: WhatsApp as an anonymous acquisition front door, not a retention nudge**
Click-to-WhatsApp ads — a Meta ad format on Instagram/Facebook that opens directly into a WhatsApp conversation with a business, no app install, no signup form — is a distribution mechanism unique to this channel. Someone sees an ad speaking to "can't even name what you're feeling," taps it, and is immediately in a chat where they can type whatever's true and get a mirrored reflection back, inside a surface they already have open and trust, with zero friction between seeing the ad and having the actual core-loop experience. That's a fundamentally different, and plausibly higher-converting, first-touch funnel than driving a cold ad click to an App Store listing — and it reframes WhatsApp's primary value as top-of-funnel acquisition, not a nudge channel bolted onto an existing account.

**Why this changes the privacy calculus, but only for this specific interaction**
The phone-number-as-identity-anchor tension Batch 4 flagged doesn't disappear — it's still real, and Meta's Business API doesn't carry the same end-to-end-encryption guarantee personal WhatsApp chats do (Business messages pass through Meta's Business Platform and the business's own webhook, so this isn't meaningfully more private server-side than SMS). But the stakes are different for a *first anonymous vent from a stranger who isn't a Xolace user yet* than for *nudging an established, identified user about their ongoing use of the app*. The first case is closer to how someone might anonymously message a crisis line for the first time — no existing account to link the conversation to, low commitment, and if the person doesn't continue, nothing about them persists anywhere. The conversion moment — inviting them to create a real account to keep their history — is exactly where Batch 4's original caution kicks back in at full strength. Treating these as two different features with two different privacy postures, rather than one undifferentiated "WhatsApp integration," is the actual correction here.

**Other angles worth naming**
- **WhatsApp Flows** — native, multi-screen structured forms rendered inside the chat itself — go further than Telegram's inline keyboards or SMS's plain text. The texture-word tap interface, or even a lightweight version of the "sit with this" guided exercise, could plausibly run as a Flow with closer parity to the real app's interaction model than either alternative channel offers.
- **Verified Business Profile as a trust signal.** For a product adjacent to mental health, "is this actually a legitimate, safe service" matters, especially in markets where scam/phishing bots on messaging platforms are a known problem. A verified WhatsApp Business presence is a stronger trust anchor at first contact than an unverified Telegram bot or an SMS short code.
- **Reach reconsidered.** Batch 6/9 ranked Twilio SMS first and Telegram second largely on reach grounds. WhatsApp's global penetration is higher than SMS-first assumptions suggest in exactly the markets with the least existing mental-health infrastructure (South America, South/Southeast Asia, much of Africa), and higher than Telegram's almost everywhere outside its specific strongholds. On pure reach for an acquisition funnel, WhatsApp is arguably the strongest of the three, not the weakest — the earlier ranking undersold it by only evaluating it as a retention channel.
- **Anonymized-aggregate broadcast** via WhatsApp Channels, same shape as the Telegram-channel idea from Batch 9, at greater reach.

**Verdict: still skip for immediate install, but re-rank it above both SMS and Telegram specifically for the acquisition angle, and split the roadmap decision into two features rather than one.** The anonymous first-touch ad-click funnel is lower-stakes on privacy, has genuine growth upside, and is worth prototyping early — but it's a public-facing, marketing-adjacent surface that needs its own content-safety and escalation-handling review before launch (an anonymous stranger's first message could be a crisis disclosure with none of the app's existing safeguards wrapped around it yet). The re-engagement-nudge use case from Batch 4 stays exactly where it was: deferred until the core in-app retention mechanics are proven and an explicit opt-in flow exists. Don't let the acquisition idea's lower privacy bar leak into the re-engagement feature's higher one — they're the same package but different products.
