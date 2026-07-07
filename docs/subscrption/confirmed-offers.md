# Xolace+ — Confirmed Offering

_Last updated: 2026-07-02_

---

## Tier Name

**Xolace+** (user-facing)  
Internal entitlement ID: `xolace-plus`

There is one tier. No freemium tiers with partial unlocks, no enterprise, no lifetime (yet). Free + Xolace+.

---

## Pricing

| Plan | List Price | Trial |
|------|-----------|-------|
| Annual | **$49.99 / yr** | 7-day free trial |
| Monthly | **$9.99 / mo** | No trial |

**Hero price is annual.** The paywall leads with annual. Monthly is the anchor — it exists to show the annual discount and catch users who resist committing yearly.

Annual math: $49.99/yr ≈ **$4.17/mo** vs. $9.99/mo month-to-month = **~58% cheaper**. Show the per-month equivalent on the paywall ("$4.17/mo, billed yearly") — the weekly/monthly framing beats the sticker year price.

**Why monthly is $9.99, not $7.99:** monthly subscribers in emotion/wellness apps churn fast (3–6 month average lifetime), and they are — by definition — the cohort rejecting the annual commitment. Pricing the flexibility they're asking for at $9.99 raises realized monthly LTV ~25% *and* widens the annual discount, making the hero plan look better. Annual stays at $49.99 — it's correctly placed; only the monthly moved.

---

## Early-Bird / Founding Pricing (launch window)

We will run a **time-boxed founding-member discount** at launch for FOMO — this reverses the earlier "no launch discount" stance (see Revenue Model Notes for why the original caution still partly holds).

**Do it right so it doesn't permanently reset the price anchor:**
- Always show the list price struck through next to the founding price ("~~$49.99~~ **$34.99** — founding price, ends [date]").
- Frame as **founding member**, not a sale. Scarcity is identity ("you were here first"), not a coupon.
- **Box it** — a hard end date or a member cap. Open-ended discounts destroy the anchor.
- Served via a separate RevenueCat Offering (e.g. `founding`) set as `current` during the window, then swapped back to `default` remotely — no app update. See `revenuecat-config.md`.

**⚠️ iOS constraint (must decide):** On the App Store a user is eligible for **only one introductory offer per subscription** — you can give the annual *either* a 7-day free trial *or* a discounted intro price, **not both** to the same user. So the launch annual is a fork:
- **Option A — Founding price, no trial:** annual = "$34.99 first year, then $49.99." Best for the engaged ≥5-session cohort who have already felt the value and don't need a trial to de-risk.
- **Option B — Trial, no founding price:** keep the 7-day trial, run the founding discount on *monthly* only, or via **offer codes** distributed to early users.

Recommendation: **Option A** for the founding window (discounted first year, no trial), then switch `default` to trial-based annual after the window closes. Confirm the discount amount before configuring.

---

## Paywall Surfaces

The paywall is reachable through **three** entry points — it is not locked behind a single session gate.

**1. Explicit entry (always available).** A quiet "Xolace+" row on the profile screen, available from session 1. No guilt, no countdown — just there for the user who already knows this helped them and wants in early. Captures identity/goodwill conversions that never hit a feature wall.

**2. Locked/blurred feature tap (always available).** Gated features render with a lock or Skia blur veil (`gate-fade.tsx`). Tapping one surfaces the paywall directly — regardless of session count. If a user reaches for it, they've expressed intent; meet it.

**3. Insight data gate (session-aware).** The insight cards themselves follow a two-state model keyed on session count:
- **< 5 completed sessions** — "insight forming" state. Informational, no paywall push. This is honest, not a teaser: the frequency map genuinely needs data to mean anything.
- **≥ 5 completed sessions, not premium** — real data shown blurred (Skia LinearGradient veil via `gate-fade.tsx`) with a real paywall CTA. The threshold dropped from 10 → **5**: five sessions is enough emotional variance to render a meaningful first map, and waiting for 10 gated monetization to only the deepest cohort.

> The "forming" gate only suppresses the *insight-data* CTA below 5 sessions. Surfaces 1 and 2 remain live from session 1, so an eager user is never blocked from paying.

---

## What Free Users Get

- Full reflect loop (unlimited sessions, **standard** rate limits + standard vent cap)
- Timeline — **recent history** (extended/full timeline is a Plus perk, see note below)
- Peer reflections — matching (tier/quality split **under review**, see note below)
- Insight teasers in "forming" state (< 5 sessions) or blurred real data (≥ 5 sessions)
- Base theme set (light/dark + a curated free selection). Premium themes are a Plus perk.
- Streak tracking

Free is not crippled. The core product — process an emotion, get a mirror, choose a path — is fully free forever.

**Peer matching gate — OPEN, under review.** Two tensions to resolve before locking:
- *For gating:* matching quality is a real constraint, and constraints are what make people upgrade. Semantic-only-for-Plus is a legitimate second lever alongside insights, and reserving the higher-precision experience gives Plus tangible weight beyond analytics.
- *Against gating:* matching lives in the core loop (one of the three promised paths). Deliberately degrading free matches risks resentment that's hard to phrase ("your matches are worse because you didn't pay") and could sour the exact feature — peer connection — that drives retention.
- *Likely middle:* both tiers get *functional* matching; Plus gets a **precision boost framed as a bonus**, never free framed as a downgrade. Decide the exact split after seeing how much semantic actually beats tag-based on real pool data.

---

## What Xolace+ Unlocks

Plus is intentionally **multi-driver** — insights are the anchor, but not the only reason to upgrade. The value spans analytics, personalization, depth/limits, and voice. A single-driver subscription is fragile; this spreads the reasons to convert and the reasons to renew.

### A. Insights — the anchor
- **Emotional frequency map** — which emotions show up most, at what intensity, over time
- **Intensity history** — week-over-week intensity chart (currently gated in `convex/profile.ts` behind `premiumRequired`)
- **Word patterns** — your most frequent texture words and emotional vocabulary (words teaser card)
- **Session streak + milestones** — earned-access acknowledgment of consistency
- **Longitudinal patterns** — month-over-month emotional shifts, seasonal patterns.
  > This is the **renewal engine.** A static frequency map is check-once value that sells the *first* purchase; the evolving longitudinal picture is what makes someone still-paying at month 12. Treat it as core to the subscription, not a "nice later" — if it slips, annual LTV collapses to a single $49.99 with no recurring reason to stay.
- **Personalized quotes from your sessions** — surfaced reflections/mirrors worth keeping. Also feeds Widgets + AI video below.

### B. Personalization
- **Premium themes** — the extended theme set beyond the free base selection.
- **Change app icon** — alternate icons (identity signal; cheap to build, punches above its weight for the "I'm a supporter" cohort).

### C. Depth & limits
- **Higher rate limits** — much higher caps on the reflect loop for heavy users.
- **Higher vent cap** — extended cap for the full vent experience (free gets a standard cap).
- **Full / extended timeline** — free sees recent history; Plus sees the complete archive.
  > ⚠️ Sensitivity: gating a user's access to *their own past* can read as extractive against the brand's anti-dark-pattern stance. Keep the free window **generous** (e.g. 30 days), so it lands as "extended history + export-grade archive," not "we're hiding your memories behind a paywall."

### D. Voice & mirror expression
- **Special mirror tones** — additional mirror voice/personality tones.
- **More expressive mirror audio** — richer TTS driven by ElevenLabs audio tags, the same technique already used on the vent side.
- **Better voice transcription with emotional context** — higher-quality, emotion-aware transcribe for spoken input.
- **Select your own mirror voice** — customize your mirror voice to match your personality or preferences.

### E. Peer matching _(gate under review — see Free section note)_
- **Semantic matching** — RAG-powered (`@convex-dev/rag`) instead of tag cascade. If gated, it's the likely "precision boost framed as a bonus"; if not, it's table-stakes for all tiers.

---

### Not shipping in the first paywall release

| Idea | Status | Note |
|------|--------|------|
| **AI-generated insight video** — your emotional story as a generated video | 🚫 Not in v1 | Compelling flagship perk for a later release; feeds off personalized-quotes data |
| **Home-screen widgets** — quotes from your sessions on the home screen | ❔ Maybe | Not committed; revisit after v1 |
| **AI model tiering** (free `claude-haiku` vs Plus `claude-sonnet-4-6` articulator) | 🚫 Not in v1 | Don't gate model quality until user feedback says it matters |

> Some Depth/Voice/Personalization items above may still be pre-implementation at paywall ship. **Only advertise on the paywall what is actually live at launch** — list the rest as "coming to Xolace+" so early subscribers see the roadmap without paying for vapor.

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
- Churn on monthly subscriptions in emotion/wellness apps is high (3–6 months average). Annual cohort retention is structurally better — hence monthly priced at $9.99 (capture more before they churn) and annual as the hero.
- Trial on annual only — reduces risk of the bigger commitment and captures users who want to test before paying $49.99. **Note:** during the early-bird window this may flip to a discounted-first-year annual with *no* trial (iOS one-intro-offer rule — see Early-Bird section).
- **Early-bird / founding discount at launch** — reverses the original "no launch discount" position for deliberate FOMO. The original caution still holds *in part*: an open-ended or un-anchored discount permanently lowers the price anchor. Mitigate by always showing list price struck-through, framing as founding-member, and hard-boxing the window (date or cap). Anchor is protected by *visibility of the real price*, not by refusing to discount.

---

## Target Metrics (set the baseline to measure against)

These are targets to instrument via PostHog from day one, not guarantees:

| Metric | Target | Why it matters |
|--------|--------|----------------|
| % of installs reaching **session 5** | Measure first, then set | Defines the addressable base for the insight-data gate; if very low, lean harder on surfaces 1 & 2 |
| Free → Plus conversion | 3–6% (wellness range) | Overall monetization health |
| Trial → paid | 40–60% | The Day-5 trial reminder is the biggest lever here — do not ship the trial without it |
| Annual share of new subs | ≥ 60% | Annual LTV/retention is the whole thesis |
| Early-bird window conversion vs. post-window | Compare | Validates whether founding FOMO actually lifts conversion or just discounts existing intent |

> Events already scoped in the setup plan (`premium_gate_hit`, `paywall_opened/dismissed`, `purchase_started/completed/failed`) cover most of this. Add a `session_count` property to `paywall_opened` so you can see which surface (profile row / locked feature / insight gate) converts best.
