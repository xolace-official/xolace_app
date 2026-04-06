# Convex Components Analysis for Xolace MVP

Analysis of Convex components and their relevance to Xolace's beta launch and post-launch roadmap.

**Status:** April 2026 | Pre-beta | MVP Phase

---

## Executive Summary

**Priority: Must Use Before Beta**
- `@convex-dev/expo-push-notifications` — Retention engine
- `@convex-dev/action-cache` — Cost & latency optimization
- `@convex-dev/migrations` — Production data integrity

These three address the highest pre-launch risks. Everything else can wait until post-launch.

---

## 1. Must Use Before Beta Launch

### `@convex-dev/expo-push-notifications`

**Status: CRITICAL**

Users won't open an emotional processing app on schedule without reminders. The "gap between fine and therapy" is exactly where Xolace lives — users need a gentle nudge to show up for themselves.

**Why it matters:**
- Xolace's value is in the daily practice, not a one-time session
- Retention is your existential metric pre-PMF
- Without push notifications, DAU/MAU ratio will plummet post-day-1

**Integration:**
- Already on Expo → native support via React Native
- Handles batching, retries, token management, pause/resume
- Real-time delivery status tracking
- Can gate notifications by user preference (emotional intensity, time of day)

**Pros:**
- Drop-in with your stack
- Manages token lifecycle and expiration
- Supports pause/resume per user (GDPR-friendly)
- Workpool-based delivery (reliable)
- Convex reactivity for delivery status

**Cons:**
- Adds a component dependency
- Requires Expo push credentials configuration
- Slightly more complex than raw `expo-notifications` but far more reliable

**Timing:** Install and configure before beta. Test with internal users.

---

### `@convex-dev/action-cache`

**Status: HIGH PRIORITY**

Every reflection session hits Anthropic's API. Identical or similar inputs (texture word combinations, freeform text patterns) trigger redundant API calls.

**Why it matters:**
- Anthropic pricing is per-token. Wasted API calls directly increase costs.
- Latency in emotional moments matters. Users in distress shouldn't wait 3-5s for a response.
- Texture word combinations (heavy + tight + foggy) are common patterns that repeat across users
- User frustration with slow mirrors directly impacts session completion rates

**Integration:**
- Cache on `convex/ai/process.ts` mirror generation action
- Configure TTL to balance freshness vs. cost (24-48h reasonable for reflections)
- Cache key: input text + user context (if private) OR texture words only (if shared)

**Pros:**
- Reduces Anthropic spend immediately (even 10% hit rate = 10% savings)
- Faster responses for repeat inputs
- Simple drop-in to your AI pipeline
- Configurable TTL for privacy/freshness tradeoff

**Cons:**
- Cache hit rate unknown without user data (emotional expression is nuanced)
- Requires thoughtful key design (what counts as "same input"?)
- TTL tuning necessary

**Timing:** Install alongside migrations. Test in beta with real usage patterns.

---

### `@convex-dev/migrations`

**Status: OPERATIONAL NECESSITY**

You're launching with real users writing sensitive emotional data. Schema changes are inevitable. Post-launch, you cannot afford ad-hoc data mutations on production.

**Why it matters:**
- Privacy-first app = data integrity is non-negotiable
- One manual script error corrupts user reflections permanently
- Users need to trust their data is safe
- Beta will reveal schema gaps (new fields on sessions, reflection format changes)

**Integration:**
- Define migrations in `convex/migrations.ts` before schema changes
- Widen (add optional fields) → migrate → narrow (remove old fields)
- Chain into CI/CD: `convex deploy --cmd 'npm run build' && npx convex run migrations:run --prod`
- Dry-run all migrations before production

**Pros:**
- Batch processing with resumable failure recovery
- Progress tracking and status queries
- CLI + dashboard integration
- Dry-run testing before touching production
- Works seamlessly with your existing schema

**Cons:**
- Adds operational complexity
- Requires learning the widen-migrate-narrow pattern
- Overkill if you never change schema (you will)

**Timing:** Install now, before you have user data. First test with a simple field addition (e.g., adding `escalationReviewedAt` to sessions).

---

## 2. Post-Launch Components (Do After Beta)

### `@convex-dev/workpool`

**Status: STAGE 2 (Scale)**

Right now you use `ctx.scheduler.runAfter` for background jobs. At MVP scale, this works. As you grow, resource contention becomes a problem — anonymization batches delay user mirror generation.

**Why it matters:**
- Separates critical (AI mirrors) from background (data retention) work
- Prevents "stampeding herd" during third-party outages
- When you have 1000+ DAU, the scheduler becomes a bottleneck

**When to adopt:** When you see scheduled function backlogs on Convex dashboard. Likely ~1000 DAU.

**Pros:**
- Priority-based queue separation
- Retry with exponential backoff
- Parallelism limits per pool
- Reactive status for monitoring

**Cons:**
- Overhead per pool
- More complex than `ctx.scheduler`
- Not needed until contention is visible

---

### `@convex-dev/workflow`

**Status: STAGE 2 (Durability)**

Your account deletion flow (retention → wipe → deletion) and AI pipeline (process → safeguard → classify → mirror) are multi-step processes. If Anthropic goes down mid-processing, chains break.

**When to adopt:** When you need guaranteed completion semantics, or when AI pipeline failures become a support burden.

**Pros:**
- Durable execution survives server restarts
- Step-by-step retry and cancellation
- Restartable from specific steps
- Exactly-once semantics on mutations

**Cons:**
- Determinism constraints (no fetch, crypto in handler)
- Learning curve (different from regular actions)
- Your current scheduler chain works fine at MVP scale

---

### `@convex-dev/rag`

**Status: STAGE 2+ (Differentiation)**

Xolace shows "peer reflections" — anonymized entries from users who felt similarly. Right now this is likely keyword/tag matching. RAG enables **semantic** matching across different emotional vocabularies.

**Why it matters:**
- "I feel like I'm drowning" matches with "everything is too much and I can't breathe"
- Dramatically improves peer reflection relevance
- Becomes a product differentiator vs. simpler matching

**When to adopt:** When users say peer reflections don't feel relevant, or when you want to explore semantic connections.

**Pros:**
- Namespace-based search (organize by emotion-category)
- Vector similarity for nuanced matching
- Integrates with existing Anthropic setup

**Cons:**
- Adds embedding costs per reflection
- Privacy design requirements (you're embedding anonymized content)
- Not needed for MVP

---

### `@convex-dev/sharded-counter`

**Status: STAGE 2 (Scale)**

For high-throughput counting without OCC conflicts. Useful for aggregate stats ("X people showed up") or resonance buttons on peer reflections.

**When to adopt:** When you see OCC errors on counter operations, or when building social proof features.

---

### `@convex-dev/resend` (Email Integration)

**Status: STAGE 2 (Engagement)**

Transactional emails: account verification, data export, re-engagement campaigns, deletion confirmation.

**When to adopt:** After MVP, when you need emails beyond Clerk's auth emails.

---

### RevenueCat Component

**Status: STAGE 3 (Monetization)**

Subscription management for premium features.

**When to adopt:** When you've validated product-market fit and are ready to introduce pricing.

---

## 3. Components to Skip (Don't Bother)

### `@convex-dev/prosemirror-sync`
**Why skip:** No collaborative editing. Users write reflections alone. No shared documents. Rich text not required. Would bloat React Native bundle.

### `@convex-dev/presence`
**Why skip:** Contradicts Xolace's thesis. Users should feel alone-but-held, not socially aware. "No feed, no profiles, no followers" means no presence tracking.

### `@convex-dev/geospatial`
**Why skip:** Emotional processing is location-agnostic. No location-based features in MVP. Entirely orthogonal.

### LaunchDarkly Component
**Why skip:** Enterprise tool with enterprise pricing. MVP doesn't need sophisticated feature flagging. Use Convex documents or env vars instead.

---

## 4. Uncertain Timing

### `@convex-dev/action-retrier`
**Status: MAYBE**

Provides simple retry logic for Anthropic calls without the overhead of Workpool.

**Decision:** If you see Anthropic failures in beta and Workpool feels too heavy, this is a quick win. Otherwise, skip straight to Workpool post-launch. (Workpool includes better retry logic.)

### Dynamic Crons Component
**Status: MAYBE**

Enables per-user scheduling (e.g., "Check in at 8pm daily") without redeployment.

**Decision:** Depends on product roadmap. If personalized reminders become a feature, this is cleaner than hacks. Otherwise skip.

---

## Installation Checklist

### Week 1 (Before Beta Signup Opens)
- [ ] `expo-push-notifications` — Configure, test end-to-end with test device
- [ ] `migrations` — Set up pattern, document widen-migrate-narrow workflow
- [ ] `action-cache` — Measure baseline Anthropic costs, configure caching layer

### Week 2-4 (Beta)
- [ ] Monitor Anthropic costs (validate caching effectiveness)
- [ ] Track push notification delivery and engagement metrics
- [ ] Plan first migration (e.g., adding new optional field)
- [ ] Gather user feedback on peer reflections relevance

### Post-Beta (Scale Phase)
- [ ] Evaluate Workpool if scheduler backlogs appear
- [ ] Plan RAG if semantic matching becomes feature request
- [ ] Consider Workflow for durable account deletion

---

## References

- Convex Components: https://www.convex.dev/components
- Convex Best Practices: https://docs.convex.dev/understanding/best-practices/
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/

---

**Last Updated:** April 4, 2026  
**Next Review:** After first 100 beta users or 2 weeks, whichever comes first
