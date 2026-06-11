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
