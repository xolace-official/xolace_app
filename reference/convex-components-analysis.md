# Convex Components Analysis for Xolace MVP

Analysis of Convex components and their relevance to Xolace's beta launch and post-launch roadmap.

**Status:** Live (100+ users) | Post-launch | Premium layer + accomplishment mechanics on roadmap

> Originally written April 2026 (pre-beta). **Section 5 (June 2026)** adds a post-launch review of a second batch of components against the current reality. Sections 1–4 are preserved as the pre-beta record.

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

### `@mux/convex`

**Status: STAGE 1.5 (Glimpses Infrastructure)**

Mux is a professional video platform with a first-party Convex component. It handles transcoding, adaptive bitrate streaming, thumbnail generation, upload progress, and real-time webhook delivery — all wired into Convex tables reactively. This is the right infrastructure layer for Glimpses.

**Why it matters:**
- Glimpses are 60–90 second emotional testimony videos. They will be watched on mobile, on varied connections, in vulnerable moments. Buffering is unacceptable. Adaptive bitrate (HLS/DASH) is non-negotiable.
- Mux handles transcoding automatically — a submitted `.mov` becomes a streamable asset without any pipeline work on your end.
- The Convex component syncs asset state reactively: when a Glimpse finishes processing, the UI updates without polling.
- Webhook-driven status means you can gate Glimpse delivery until `asset.ready` — users never see a broken video.

**Integration:**
- Install `@mux/convex` + `@mux/mux-node`, scaffold app-level files via `npx @mux/convex-mux-init`
- `videoMetadata` table stores Xolace-specific fields: uploader identity (internal), emotional tags, intensity range, granular label — the match dimensions used by the AI classifier
- Mirror confirmation triggers a query against tagged Glimpses; if a match exists, fourth path option appears: "Someone who felt something like this made something for you"
- Glimpse delivery path is read-only and internal — users never browse, never see counts, never see who made it

**Pros:**
- Battle-tested video infrastructure, not DIY
- Convex component = reactive asset state with zero custom webhook code
- Thumbnail generation for Glimpse preview (if ever needed)
- Signed URL delivery for private/internal content

**Cons:**
- Per-minute pricing (mitigated by short format — 60–90s max)
- Adds Mux account + API key configuration
- Requires small Glimpse metadata schema alongside Mux tables

**Timing:** Start building the Glimpses library quietly during TestFlight beta. Aim for 20–30 videos covering the most common emotional themes before switching the path option on in production. Mux integration should be wired before the first Glimpse is uploaded.

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

### `@djpanda/convex-authz`
**Why skip:** Xolace has one user type with one permission model — authenticated users access only their own data. `requireAuth()` + `requireSessionOwnership()` in `convex/lib/auth.ts` already covers this completely. RBAC/ABAC/ReBAC is enterprise authorization infrastructure for multi-tenant SaaS with roles, teams, and resource hierarchies. None of those concepts exist in Xolace. Adding this would be solving a problem you don't have.

### `convex-timeline`
**Why skip:** Undo/redo state management for documents and editors. Reflections in Xolace are single-submit emotional snapshots, not iteratively edited documents. There's no undo concept in the product model — you write what's true, you submit it. Entirely wrong abstraction.

### `convex-bunny`
**Why skip (for now):** Bunny.net is a cost-effective CDN for static files. For Glimpses, Mux is the correct choice — it handles transcoding, adaptive streaming, and processing webhooks that Bunny doesn't. Bunny would only make sense as a cheaper long-term storage tier for raw uploaded files before processing, which is premature optimization. Revisit if Mux costs become a problem at scale.

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

### `@clipin/convex-wearables`
**Status: STAGE 3+ (Physiological Context)**

Syncs health metrics from Garmin, Strava, Whoop, Apple Health, etc. — heart rate, HRV, stress score, sleep quality, body battery — directly into Convex with normalized schemas and OAuth per provider.

**Why it's interesting:** Emotional state and physiological state are correlated. HRV the morning before a heavy session, body battery at the time of entry, sleep depth the night before — these could enrich the emotional fingerprint beyond what the user consciously reports. "You've been running low for 3 days" as optional context for the mirror would be a meaningful product differentiator.

**Why it's not now:** This fundamentally changes what Xolace collects and what users consent to. It requires a new permission model, new privacy disclosures, new onboarding for wearable connection, and a product decision about whether Xolace should know your body data alongside your emotional data. That's a meaningful product expansion, not a feature add. Revisit post-PMF when the core product is validated and you're exploring what the next layer of context looks like.

---

## 5. Post-Launch Component Review (June 2026)

Second batch, evaluated against a changed reality: **app is live, 100+ users, premium layer now on the roadmap, and the original "no gamification, ever" stance is softened** — accomplishment/reward mechanics are on the table where they genuinely serve retention without betraying the campfire ethos.

A note on maturity before the analyses: four of these six are single-author, sub-1.0, low-adoption packages (200–350 weekly downloads). That's not disqualifying, but for anything touching the **money path or the deletion path** it means "read the source before trusting it," not "drop in and forget." PostHog is the exception — first-party, 4k+ weekly downloads, and you already run its client SDK.

---

### `@posthog/convex` (PostHog — analytics + feature flags)

**Status: ADOPT — highest-value of this batch**

You already run PostHog on the client (`src/config/posthog.ts`, `posthog-react-native`) with feature flags preloaded. This component is the **server-side half you're currently missing**, not a new vendor. It closes three gaps that matter now that you're live:

**Why it matters:**
- **Backend events you can't see from the client.** Mirror generation outcome, `escalationTriggered` fires, clarify-loop give-ups, anonymization/distiller job results, abandoned-session crons — these happen server-side and never reach the client SDK. Capturing them here gives you the full reflection funnel, not just the UI half.
- **Feature flags become real, in one place.** Section 3 told you to skip LaunchDarkly and use "Convex documents or env vars" for flags. That advice is now half-stale: you already have PostHog flags client-side. This lets the **same flags gate server logic** — roll the premium paywall, a new guided exercise, or a gamification experiment to 5% of users without a redeploy, evaluated identically on client and backend. Local eval works inside queries/mutations and is reactive (a flag flip re-runs subscribed queries).
- **LLM observability.** The Anthropic mirror pipeline is your cost center and your core experience. PostHog's exception capture + event properties let you track latency, token spend, and failure rate per stage (articulator / distiller / classifier) without building your own dashboards.
- **A/B testing the things you're about to build.** Premium pricing, rating prompts, the accomplishment mechanics below — all of it needs measurement. This is the instrument.

**The non-negotiable caveat — privacy.** This is a privacy-first emotional-processing app. **Never send reflection content, mirror text, clarify turns, or texture-word combinations as event properties.** Capture *structural* events only: `mirror_confirmed`, `path_selected: peers`, `clarify_gave_up`, `session_abandoned`, with non-identifying metadata (turn count, duration buckets, entry type). Use `distinctId` = your internal user id, never email/Clerk subject. Strongly consider EU Cloud (`eu.i.posthog.com`) for data residency and review your consent disclosures — you already gate the client SDK behind `isPostHogConfigured`; mirror that discipline server-side.

**Integration:**
- Requires Convex ≥ 1.39 (typed component env vars). Verify your version first.
- `app.use(posthog, { env: {...} })` in `convex.config.ts` alongside your existing four components; set `POSTHOG_PROJECT_TOKEN` (reuse the client one) and a `phs_…` flags key for local eval.
- Capture is non-blocking (`ctx.scheduler.runAfter` under the hood), so it won't add latency to mirror generation.

**Pros:** First-party, maintained, 4k+ downloads. Unifies flags across client+backend. Non-blocking. Reactive flags in queries.
**Cons:** Privacy surface requires active discipline (the biggest risk is a careless `properties` field leaking content). Local flag eval needs the personal API key + has documented limitations (experience-continuity flags, static cohorts). Convex ≥ 1.39 gate.

**Timing:** Adopt now. It's the measurement layer for everything else on the premium/retention roadmap.

---

### `@abdssamie/convex-checkpoints` (milestone rules → callback)

**Status: STRONG FIT for the accomplishment roadmap — but design-sensitive, and trivial to outgrow**

This is the component that maps directly to "accomplishment / reward features." You register rules (`factor` + `threshold` + `actionName`), call `trackEvent` after a real write, and it fires a host-owned callback when a user crosses a threshold. Per-user progress tracking is handled for you.

**Where it fits Xolace specifically — quiet milestones, not a badge arcade.** The ethos guardrail matters here: the product thesis is "no gamification, no streak guilt." Softening that for retention is fine *if the reward is acknowledgment, not coercion.* Good uses:
- **Premium trial unlock through demonstrated engagement** — `factor: "session_completed"`, `threshold: 5` → callback offers a 7-day premium trial. This is the cleanest monetization on-ramp: you reward people who've already found value rather than paywalling cold.
- **Depth-of-practice unlocks** — after N sessions, quietly reveal a new guided exercise or a Glimpse theme. Framed as "the fire reveals more," not "Level 3 unlocked."
- **Quiet acknowledgment moments** — `threshold: 10` → a single gentle line ("You've sat by the fire ten times"), not a streak counter or a guilt notification. One-shot, not a running tally in the UI.
- **Contribution recognition** — after a user's anonymous contributions have resonated with peers N times, a private acknowledgment. Honors the "alone but held" model.
- **Onboarding completion sequence** — `factor: "signup"` → schedule a 30-min welcome touch (the README's headline example).

**The build-vs-buy reality.** Strip the marketing and this component is: a per-user counter table + a threshold check + a scheduled typed-function call. You already have `profileStats.ts` and the scheduler doing similar work. The component's real value is (1) the rule-registration abstraction so non-threshold logic stays out of your mutations, and (2) HTTP ingestion for external events — which you mostly don't need. For 3–4 milestone types you could hand-roll this in an afternoon with full control and no third-party dependency on a v0.1.9 / 335-download package. **Recommendation:** prototype the engagement→trial unlock by hand first; only adopt the component if your milestone matrix grows past ~5 rules and the configuration overhead starts to hurt.

**Pros:** Clean rule/callback separation. Per-user progress tracked for you. Callback is a normal Convex function (can schedule, write, run mutations). Directly models the reward roadmap.
**Cons:** Early/low-adoption single-author package on a path you could own. Easy to misuse in a way that violates the product ethos (streaks, guilt, counts-as-pressure). Overlaps work your scheduler already does.

**Timing:** When you commit to the first concrete reward mechanic (most likely the premium-trial unlock). Decide build-vs-buy at that point.

---

### `convex-webhook-receiver` (inbound webhook ingestion)

**Status: STAGE 3 — couples to monetization; revisit with RevenueCat**

Verifies, deduplicates, retries, and dead-letters inbound webhooks (Stripe, GitHub, Slack, generic HMAC, …). The only place Xolace needs to *receive* webhooks is **billing**: once the premium layer ships, you'll get subscription lifecycle events (renewed / cancelled / refunded / billing-failed) from Stripe, the App Store Server, or RevenueCat. Dropping or double-processing those corrupts entitlement state — exactly the class of bug a DLQ + dedup is built to prevent.

**But check the layering first.** The existing doc already earmarks a **RevenueCat component** for Stage 3. RevenueCat is itself the webhook-aggregation layer — it normalizes App Store + Play Store + Stripe events and exposes one stream. If you go RevenueCat, you likely consume *its* component/SDK and this generic receiver is redundant. This receiver earns its place only if you integrate a provider's raw webhooks **directly** (e.g. Stripe-only, no RevenueCat). Don't adopt it speculatively — the provider decision determines whether it's needed at all.

**Pros:** Real reliability primitives (signature verify, dedup, exponential backoff, DLQ + replay) you don't want to hand-roll on the money path. Returns 200 immediately, processes async.
**Cons:** Likely superseded by RevenueCat's own integration. v1.0.x, single-author, 344 downloads — acceptable for non-critical, but scrutinize before trusting with billing.

**Timing:** Defer until the premium billing provider is chosen. Re-evaluate then, against whatever RevenueCat gives you for free.

---

### `@sholajegede/convex-cascading-deletes` (referential-integrity deletes)

**Status: CONSIDER as hardening — you already hand-roll this path**

You have `accountDeletion.ts`, `dataWipe.ts`, and `dataRetention.ts` doing deletion today, across a 9-table schema with real foreign keys (`users → sessions → sessionTurns → reflections`, plus emotionalMetadata, feedback, etc.). For a privacy-first app under GDPR right-to-erasure, an orphaned `sessionTurn` pointing at a deleted user isn't a cosmetic bug — it's residual emotional data that should not exist. This component declares parent→child relationships via your existing indexes and deletes the whole tree in the correct order, with scheduler batching for large trees.

**Two genuinely compelling bits beyond what you have:**
- **The safe-db guard** (`getSafeDb` patches `ctx.db` so direct `.delete()` throws) — institutional enforcement that *all* deletion goes through the cascade. That's a real safeguard against a future contributor adding a stray `ctx.db.delete()` that leaves orphans.
- **Deletion logs** — a queryable per-table count of what was removed. For a privacy product, being able to *prove* an erasure completed (and what it touched) is compliance gold.

**The honest counterweight:** your hand-rolled jobs already work and you control them. Migrating a *working, critical, privacy-sensitive* deletion path onto a v0.1.2 / 294-download third-party component trades known behavior for convenience — and a bug here is the worst kind (silent data retention or accidental over-deletion). I would **not** wholesale replace your deletion jobs. The defensible move is to **steal the two ideas** — add an audit log to your own deletion path, and consider a safe-db wrapper — rather than adopt the dependency. Adopt the component only if you find your hand-rolled cascade is actually missing tables or mis-ordering deletes.

**Pros:** Correct-order cascade, batched. Safe-db enforcement pattern. Reactive deletion audit log (compliance evidence).
**Cons:** Replaces a working critical path with an early third-party dep. Highest-blast-radius category to get wrong. You already have 80% of this.

**Timing:** No rush. Harvest the audit-log and safe-db patterns into your existing jobs now; revisit full adoption only if your cascade proves buggy.

---

### `convex-webhook-sender` (outbound webhook delivery)

**Status: SKIP**

Managed *outbound* webhooks — for when external systems need to be notified of events in your app (order created → notify a fulfillment service; user signed up → notify a partner CRM). Xolace is a closed consumer app: no third-party integrators consume your events, no partner endpoints, no multi-tenant customers registering URLs. There is no outbound-webhook use case in the product, present or roadmapped.

**Revisit only if** you ever build a B2B/partner API or a "connect your data to X" integration surface — neither of which fits the current product thesis. Until then, this is solving a problem you don't have.

---

### `convex-mcp-gateway` (expose Convex functions as MCP tools)

**Status: SKIP for the product; niche internal-tooling maybe**

Turns your Convex functions into auth-gated MCP tools that external AI agents (Claude, custom agents) can discover and call. Xolace's AI is *internal and one-directional* — Anthropic generates mirrors inside your pipeline; you do not expose your backend to external agents, and for a privacy-first app holding raw emotional data, **deliberately adding an agent-accessible API surface is a risk you don't want.** The product has zero need for this.

The only conceivable use is internal: letting *your own* tooling drive admin/ops queries through an agent. That's a convenience for the team, not a product feature, and it's premature — and it would mean standing up and securing an OAuth-discoverable resource server over your most sensitive data. Not worth it now.

**Revisit:** essentially never, unless Xolace pivots toward an agent-facing platform — which would contradict the current thesis.

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

### Post-Launch (June 2026 batch)
- [ ] `@posthog/convex` — verify Convex ≥ 1.39, register in `convex.config.ts`, capture **structural-only** backend events (never reflection content), wire server-side feature flags
- [ ] Prototype engagement→premium-trial unlock by hand; adopt `convex-checkpoints` only if milestone rules grow past ~5
- [ ] Harvest audit-log + safe-db patterns from `cascading-deletes` into existing `accountDeletion.ts` / `dataWipe.ts` (don't replace working path)
- [ ] Defer `webhook-receiver` until premium billing provider is chosen (likely subsumed by RevenueCat)
- [ ] Skip `webhook-sender` and `convex-mcp-gateway` — no product use case

### Phase 1.5 (Glimpses)
- [ ] Set up Mux account, configure `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` + `MUX_WEBHOOK_SECRET` in Convex
- [ ] Run `npx @mux/convex-mux-init` to scaffold component tables and webhook handlers
- [ ] Define `glimpses` table in schema with emotional fingerprint fields: `primaryEmotion`, `granularLabel`, `intensityRange`, `thematicTags`
- [ ] Build internal upload flow (team-only — not user-facing)
- [ ] Wire AI classifier output → Glimpse match query → conditional fourth path in path selection
- [ ] Record and tag first 20–30 Glimpses covering core emotional themes before enabling the path in production

---

## References

- Convex Components: https://www.convex.dev/components
- Convex Best Practices: https://docs.convex.dev/understanding/best-practices/
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Mux Convex Component: https://www.convex.dev/components/mux/convex

---

**Last Updated:** June 4, 2026 (Section 5 — post-launch batch)  
**Next Review:** When the premium billing provider is chosen, or when the first accomplishment mechanic ships
