# CEO Plan — Xolace+ Infrastructure Setup

**Branch:** `feat(℞)/premium-integrattion`  
**Date:** 2026-07-01  
**Mode:** SELECTIVE EXPANSION  
**Author:** Nathan (Xolace founder)  

---

## Context

Xolace+ is shipping as **real paid infrastructure** in the next update — not a waitlist, not intent capture. RevenueCat billing is being wired. The existing `insight_waitlist` infrastructure (table, mutations, hooks, sheet) gets replaced entirely.

RC dashboard configuration is pending (requires App Store Connect + Google Play setup). During that window, the codebase uses a temporary stub constant to enable free/pro switching for development and feature-building.

---

## Scope Locked (Baseline)

### 1. Premium gating infrastructure
- Create `convex/lib/premium.ts` — single source of truth for `hasPremium()`. Returns `{ isPremium: boolean, tier: 'free' | 'plus' }`. RC-shaped API so the swap from stub → `revenuecat.hasEntitlement()` is mechanical.
- Update `convex/profile.ts` and `convex/avatars.ts` to import from new lib (eliminate duplicate stubs).
- All server-side feature gates read from this one function.

### 2. Semantic peer matching (RAG)
- Install `@convex-dev/rag` (v0.7.2+).
- Add vector index to `reflections` table.
- Update `convex/reflections.ts:matchForSession` — new semantic path alongside existing tag fallback. Free tier keeps tag-based; Plus gets semantic.
- Addresses the stale/generic matching users are already noticing.

### 3. RevenueCat client integration
- `RevenueCatContext` wrapping `react-native-purchases` SDK.
- Feature flag (`features.payments`) — when `false` (dev), `isProUser` reads from dev constant. When `true`, full RC flow.
- `appUserId` = user's `emotionalProfileId` (`profile._id`, returned by `api.premium.getEntitlement`).
- Custom paywall screen (not RC's built-in UI). RC built-in paywall used during development/testing only; custom ships.
- `convex-revenuecat` Convex component for server-side webhook state sync.

### 4. Replace waitlist infrastructure
- Drop: `insight_waitlist` table, `joinInsightWaitlist`/`listInsightWaitlist` mutations, `use-insight-waitlist.ts`, `insight-waitlist-sheet.tsx`.
- Replace with: `use-paywall.ts` hook, real paywall bottom sheet.

### 5. Teaser card states + paywall surfaces
Insight-data gate (session-aware):
- **< 5 sessions**: "insight forming" — informational, no paywall prompt. Honest about data requirements.
- **≥ 5 sessions, not premium**: blurred real data (Skia LinearGradient via `gate-fade.tsx`) + real paywall CTA.
- **≥ 5 sessions, premium**: full data unlocked.

Threshold lowered 10 → **5** (5 sessions = enough emotional variance for a meaningful first map). Two additional paywall surfaces are **always available from session 1**, independent of the insight gate:
- **Explicit "Xolace+" row on the profile screen** — for users who want in early without hitting a wall.
- **Locked/blurred gated features** (premium themes, app icon, extended timeline, etc.) — tapping surfaces the paywall regardless of session count.

### 6. PostHog instrumentation
- `premium_gate_hit` event on each gated feature encounter: `{ feature, sessionCount, hasData }`.
- `paywall_opened`, `paywall_dismissed`, `purchase_started`, `purchase_completed`, `purchase_failed` on purchase flow.

---

## Cherry-picks Accepted (Selective Expansion)

**D3.1 — Two-state teaser design** ✅ Accepted  
Forming (< 5 sessions) vs ready-with-real-paywall (≥ 5). Not three states. Eliminates the fake "preview" problem. (Threshold lowered 10 → 5; plus two always-on paywall surfaces — see §5.)

**D3.2 — PostHog `premium_gate_hit`** ✅ Accepted  
Structural event per gate hit. Gives conversion funnel visibility from day one.

**D3.3 — Pool staleness signal** ⏸ Deferred to TODOS.md  
Track `peer_pool_thin` when matching returns < 2 results. Worth doing, not blocking.

---

## Not In Scope (This Branch)

- AI model tiering (haiku vs sonnet per tier) — deferred, needs user feedback first
- AI-generated insight video — flagship perk for a later release, not v1
- Home-screen widgets — maybe, not committed
- Lifetime purchase — not now
- Family sharing — handled by RC automatically if/when needed

## In Scope But Was Previously Excluded

- **Early-bird / founding discount** — now planned for launch FOMO (time-boxed, list price shown struck-through). Configured as a separate RC `founding` Offering. Reverses the earlier "no launch discount" position. See `confirmed-offers.md` and `revenuecat-config.md`.
- **Trial-expiry reminder (Day 5)** — reclassified from "deferred" to **ships with, or immediately after, the trial**. Trial→paid is 40–60% in wellness and the Day-5 nudge is the single biggest lever on that number; shipping the trial without it leaks conversions where they're easiest to save. (Push infra can be separate work, but this shouldn't sit indefinitely behind it.)

> **Multi-driver Plus:** Plus is no longer insights-only. Premium themes, app icon, higher rate/vent caps, extended timeline, and mirror voice/tone perks are all upgrade drivers (see `confirmed-offers.md`). Some may be pre-implementation at ship — advertise only what's live, list the rest as "coming to Xolace+." Peer-matching gating remains **under review**.

---

## Implementation Order

```
1. convex/lib/premium.ts               ← stub, RC-shaped API
2. Update callers (profile.ts, avatars.ts)
3. Install @convex-dev/rag + schema migration
4. matchForSession semantic path (reflections.ts)
5. Drop insight_waitlist infrastructure
6. RevenueCatContext + feature flag
7. convex-revenuecat component + webhook handler
8. Paywall bottom sheet (custom UI)
9. Teaser card state updates
10. PostHog instrumentation
```

Steps 1–2 are OTA-safe. Steps 3–4 require Convex deploy (not OTA). Steps 6–7 require a store build (native module). Steps 8–10 are OTA-safe after native build.

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Paywall UI | Custom (RC built-in for dev testing only) | Brand control, campfire tone doesn't fit RC generic paywall |
| `appUserId` for RC | `emotionalProfileId` (`profile._id`) | Stable across data wipes, auth-provider-independent, matches PostHog distinctId |
| Server-side gate | `convex-revenuecat` webhook component | Never trust client claims for gated server data |
| Tier name | Xolace+ | Not "Premium" — product identity |
| Entitlement ID | `xolace-plus` | Matches tier name, used in `hasEntitlement()` |
| Hero price | $44.99/yr with 7-day trial (annual) | Annual cohort retention structurally better than monthly |
| Monthly price | $9.99/mo (raised from $7.99) | Churny cohort — capture more before they leave; widens annual discount to ~62% |
| Early-bird | Time-boxed `founding` Offering at launch | FOMO lift; anchor protected by struck-through list price + hard window |
| Insight-data gate | ≥ 5 sessions (lowered from 10) | Enough emotional variance for a real first map; 10 gated only the deepest cohort |
| Paywall surfaces | 3 — profile row + locked features (both from session 1) + insight gate (≥5) | Don't block eager payers; meet expressed intent wherever it appears |

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `convex/lib/premium.ts` | CREATE |
| `convex/profile.ts` | MODIFY — import from premium.ts |
| `convex/avatars.ts` | MODIFY — import from premium.ts |
| `convex/reflections.ts` | MODIFY — add semantic match path |
| `convex/schema.ts` | MODIFY — add vector index to reflections |
| `convex/revenuecat.ts` | CREATE — shared RC component instance |
| `convex/http.ts` | MODIFY — mount webhook handler |
| `src/providers/revenue-cat-provider.tsx` | CREATE |
| `src/providers/root-provider.tsx` | MODIFY — add RevenueCatProvider |
| `src/features/profile/hooks/use-paywall.ts` | CREATE (replaces use-insight-waitlist.ts) |
| `src/features/profile/components/paywall-sheet.tsx` | CREATE |
| `src/features/profile/components/insight-waitlist-sheet.tsx` | DELETE |
| Teaser card components (words, intensity) | MODIFY — two-state logic |
| `docs/subscrption/confirmed-offers.md` | WRITTEN ✅ |
| `docs/subscrption/revenuecat-config.md` | WRITTEN ✅ |

---

## Open Questions (Needs Answer Before Shipping)

1. **What does the custom paywall screen look like?** — Needs design pass. Should fit campfire aesthetic. Probably: dark, ember tones, "You've shown up X times" framing, annual hero, monthly secondary, trial callout.
2. **Restore purchases placement?** — Settings screen? Post-install prompt? Both?
3. **What happens at the paywall if a user is in the middle of a session?** — Don't interrupt the reflect loop. Paywall only surfaces from profile/insights entry points, never from within a session.
4. **Trial vs. no-trial for the engaged cohort?** — Users hitting the insight gate at ≥5 sessions have already felt the value; a hard annual (no trial) may convert as well or better than a trial. Worth A/B testing — and it interacts with the early-bird fork (discounted-first-year annual can't also carry a free trial on iOS).
5. **Peer-matching gate — gate or table-stakes?** — Still open (see `confirmed-offers.md`). Leaning toward "functional for all, precision boost as a bonus for Plus." Decide after measuring how much semantic actually beats tag-based on real pool data.
6. **Early-bird amount + window?** — Confirm the founding discount price (e.g. $34.99 first year) and the end condition (date or member cap) before configuring the `founding` Offering.
7. **Extended-timeline free window?** — If timeline is gated, how generous is the free window (recommend ~30 days) so it reads as "extended archive," not "we're hiding your own past"?
