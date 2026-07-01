# Xolace+ — Confirmed Offering

_Last updated: 2026-07-01_

---

## Tier Name

**Xolace+** (user-facing)  
Internal entitlement ID: `xolace-plus`

There is one tier. No freemium tiers with partial unlocks, no enterprise, no lifetime (yet). Free + Xolace+.

---

## Pricing

| Plan | Price | Trial |
|------|-------|-------|
| Annual | **$44.99 / yr** | 7-day free trial |
| Monthly | **$7.99 / mo** | No trial |

**Hero price is annual.** The paywall leads with annual. Monthly is the anchor — it exists to show the annual discount and catch users who resist committing yearly.

Annual math: $44.99/yr ≈ $3.75/mo. Show this on the paywall as "less than a coffee a month" equivalent framing.

---

## Paywall Trigger

The paywall is surfaced when a user has **≥ 10 completed sessions** AND attempts to access a premium feature (insight card, full peer match quality, etc.).

Under 10 sessions, premium features show an "insight forming" state — informational, no paywall. This is not a teaser, it is honest: the insight genuinely needs data to be meaningful.

At ≥ 10 sessions, the real data is shown blurred (Skia LinearGradient veil via `gate-fade.tsx`) with a real paywall CTA.

---

## What Free Users Get

- Full reflect loop (unlimited sessions)
- Timeline (all past sessions)
- Peer reflections — tag-based matching (current quality, improves with RAG but free tier stays tag-based)
- Insight teasers in "forming" state (< 10 sessions) or blurred real data (≥ 10 sessions)
- All themes
- Streak tracking

Free is not crippled. The core product — process an emotion, get a mirror, choose a path — is fully free forever.

---

## What Xolace+ Unlocks

### Insights (primary driver)
- **Emotional frequency map** — which emotions show up most, at what intensity, over time
- **Intensity history** — week-over-week intensity chart (currently gated in `convex/profile.ts` behind `premiumRequired`)
- **Word patterns** — your most frequent texture words and emotional vocabulary (words teaser card)
- **Session streak + milestones** — earned-access acknowledgment of consistency
- **Longitudinal patterns** _(future)_ — month-over-month emotional shifts, seasonal patterns

### Peer Matching (secondary driver)
- **Semantic matching** — RAG-powered (`@convex-dev/rag`) instead of tag cascade. Finds reflections that actually sound like yours, not just share an emotion label.
- Free tier keeps tag-based matching (still functional, just lower precision at scale)

### AI Quality _(future, not in v1)_
- Potential: free tier uses `claude-haiku`, Xolace+ keeps `claude-sonnet-4-6` for the articulator. Not confirmed for v1 — don't gate AI model until we have user feedback on whether it matters.

---

## What Xolace+ Does NOT Include

- No chat threads or conversation history with AI
- No public profile or social features
- No therapist referral or clinical tools
- No export (yet — may be a future Plus feature)
- No family sharing (RC handles this automatically if configured on the product)

---

## Paywall Copy Direction

- **Do not** use "unlock premium" language — it implies the free product is broken
- **Do** frame it as: "You've processed X moments. Here's what the data shows." → paywall
- **Tone**: earned access, not upsell. The user did the work. This is the reward.
- **CTA**: "See my Xolace+" or "Start your 7-day trial" (annual), "Continue with Xolace+" (monthly)
- No guilt copy. No "you're missing out." No countdown timers.

---

## Revenue Model Notes

- Annual is the target mix. Monthly is the fallback. Optimize conversion toward annual.
- Churn on monthly subscriptions in emotion/wellness apps is high (3–6 months average). Annual cohort retention is structurally better.
- Trial on annual only — reduces risk of the bigger commitment and captures users who want to test before paying $44.99.
- No promotional pricing at launch. No launch discount. First impression sets the price anchor.
