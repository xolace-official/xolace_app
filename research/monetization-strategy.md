# Xolace — Monetization Strategy

Generated: 2026-06-15
Branch: subcription-research
Status: DRAFT

> Companion to `research/insight-features-research.md` (the free/premium feature
> catalog) and `research/xolace-user-research-synthesis.md` (the brand guardrails).
> This doc covers packaging, tier structure, pricing, the paywall moment, the
> validation approach, subscription lifecycle, and billing infrastructure.

---

## 1. Posture: where we actually are

Xolace is **not pre-launch** — we are retrofitting subscriptions onto a **live app**
with real usage and a rich longitudinal dataset already accruing per user. That is the
strong position. We don't have to guess what premium should be; the insight features
research already proves it: **"deeper self-knowledge that compounds over time."** The job
now is packaging, pricing, the paywall moment, and the lifecycle plumbing.

**Inputs that shaped this plan (decisions on record):**
- **Market:** Global / US-led. Price to US/EU wellness norms; USD anchor.
- **Launch posture:** App already live; monetization layered on next, via the OTA
  release path where possible.
- **Free/premium line:** Depth-gated. Core loop stays free but is **rate-limited**
  (cost/abuse control), with possible **session-quality** tiers. Free is generous, not crippled.
- **Validation approach:** **Intent-only teasers** first (no price, no buy button) to
  measure desire before billing exists. See §6.

**The governing constraint** (from user research, Profile E — the guarded, high-EQ,
high-value retention target): **anything that feels extractive loses this user
permanently.** That is the boundary every decision below is tested against. The question
for any monetization choice: *does this feel like the fire asking for something, or the
fire giving more?*

---

## 2. Economic reality: Xolace is NOT zero-marginal-cost software

Most subscription pricing advice assumes a SaaS where serving one more user costs ~$0.
**Xolace does not work that way, and this single fact reshapes tiers, pricing, and
lifetime.** Every premium feature carries real per-user COGS:

- Mirror + refinement generation (Anthropic tokens, per session)
- Memory / RAG (P14) — embeddings + a larger injected context on every session
- Weekly weather (P13), monthly report (P16) — scheduled AI generation
- Voice mirror (ElevenLabs TTS) — the genuinely expensive one
- Insight video (P17)

A heavy daily premium user plausibly runs **~$1–4/month in COGS (~$24–48/year)**, and that
cost **scales with engagement** — our most-loved-by users cost the most to serve. Hold this
number; it is the through-line for the tier and lifetime decisions below.

---

## 3. Tier structure — One now. Optionally two later. **Never three.**

Launch **binary**: Free vs **one** paid tier. A three-tier ladder
(Premium / Pro / Ultra) is wrong for Xolace — and not just at this stage. The team should
understand *why*, because it will be tempting:

1. **It fragments one coherent promise.** Premium is a single emotional pitch:
   *"deeper self-knowledge that compounds."* The moment we split it into three columns, we
   have to answer *"why is MY emotional memory locked behind Ultra and not Pro?"* — and every
   answer feels arbitrary and extractive. On an app whose #1 brand risk is feeling extractive
   (Profile E), a 3-column pricing grid is actively off-brand. It reads SaaS-dashboard, not
   campfire.

2. **Decision fatigue at the worst possible moment.** The paywall fires when someone is in a
   vulnerable, reflective state. Asking them to comparison-shop three tiers there suppresses
   conversion.

3. **We have zero pricing data.** Multi-tier is an optimization you *earn* after you
   understand the single-tier funnel — not a launch structure.

So: **launch one paid tier.** Call it **`Xolace+`** (or a campfire-metaphor name — that's
the team's call), **not "Premium,"** because the generic SaaS-ladder vocabulary undercuts
the brand.

**The one legitimate reason to add a second tier later** is *not* "good/better/best"
psychology — it is **COGS defense.** The AI-generative features (weekly weather, monthly
reports, voice mirror, insight video, deep memory) are where margin erodes. If usage data
later shows the base tier bleeding on heavy users, we introduce a higher tier that *houses
the expensive AI-generative stuff*, so the people who want it fund it. That is a
cost-defensible split, not an upsell trick. **Architect for it; do not ship it day one.**

| Now | Later — only if usage/cost data demands |
|---|---|
| **Free** — core loop (rate-limited) + top-3 insights | same |
| **Xolace+** — unlimited + full insight layer + AI-generative features | **Xolace+** — unlimited + full insight layer |
| | **(new top tier)** — high-COGS AI-generative features move here |

Never three at once. Max two, and only when the numbers force it.

---

## 4. The free / premium line

The "unlimited but rate-limited, maybe quality tiers, still free" intent resolves into
three layers:

| Layer | Free | Xolace+ |
|---|---|---|
| **Core loop** (reflect → mirror → path) | Always. Rate-limited generously. | Unlimited / higher ceiling |
| **Session quality** | Genuinely good (standard mirror, text) | *Additive*: voice mirror, more refinement turns, priority/faster processing, deeper memory context |
| **Insight depth** | Top-3 snapshot (F1–F6) | Full longitudinal layer (P1–P16) |

**Two non-negotiable guardrails:**

1. **Rate-limit is cost control, not scarcity theater.** Set the free cap high enough that
   only power users and abuse hit it (e.g. a few full sessions/day). Frame any limit gently
   ("You've processed a lot today — that's worth honoring. Come back tomorrow, or go
   unlimited."). **Never hard-block a user mid-distress, and never gate the
   safeguard/escalation path.** Gating someone in crisis is the one thing that is actually
   dangerous and brand-fatal. This exception overrides all caps.

2. **"Quality" must be additive, not degraded.** The #1 existing research problem is
   *generic mirrors*. If free mirrors feel deliberately worse, we amplify our worst flaw and
   confirm Profile C's "is this even real?" skepticism. Free mirrors must stay genuinely good
   — ship the `userLanguageTags`-in-articulation fix to **everyone**. Premium *adds* (voice,
   unlimited "say more," priority processing, longer memory window); it never subtracts.

**The peer layer stays free.** Research shows peers are wanted badly *and* are the only real
differentiation vs ChatGPT ("actual human recognition, anonymously"). Gating it would
kneecap both acquisition and retention.

### Premium feature inventory

The team's working list of premium ideas, vetted against two lenses — **COGS** (cheap
cosmetics vs expensive AI) and **brand risk** (does gating it feel extractive?). "Status"
reflects current build state (as of June 2026). Note the pattern: **most of the Wave-1 offer
is already built or one config away** — the remaining work is *gating*, not features.

| Feature | Tier fit | COGS | Verdict | Status |
|---|---|---|---|---|
| More custom themes | Xolace+ | ~0 | ✅ Ideal — zero-cost perceived value | 🟡 Infra done (Uniwind); needs premium themes authored + gating |
| Change app icon | Xolace+ | ~0 | ✅ Ideal — classic safe unlock | 🔴 Not started |
| Widgets (quotes on home) | Xolace+ | ~0 | ✅ Great — *also* a between-session touchpoint | 🔴 Not started |
| Personalized quotes from sessions | Xolace+ | low | ✅ On-brand keepsake (AI cost tiny / one-time) | 🟢 Built — gating only |
| Special mirror tones | Xolace+ | low–mod | ✅ Yes — *don't* degrade the free default tone | 🟡 Tone system built (current = free); needs a *premium tone* defined |
| Unlimited / higher rate limits | Xolace+ | cost lever | ✅ This *is* the core-loop lever (§4) | 🟡 Built — needs per-tier limit config |
| Higher cap for full vent | Xolace+ | cost lever | ✅ Yes — keep the free floor generous (Profile B) | 🟡 Vent built — needs per-tier cap config |
| View insights into emotions | Xolace+ | low | ✅ Heart of premium (P1–P16) | 🔴 Not started |
| AI-generated insight video | **2nd tier later** | **high** | ✅ Premium, ringfence — COGS-defense candidate (P17) | 🔴 Not started |
| Better voice transcribing + emotional context | **2nd tier later** | **mod–high** | ✅ Premium — voice is the expensive lever | 🟡 Free transcription done; premium ElevenLabs STT not yet wired |
| View full timeline | ⚠️ reconsider | ~0 | Don't gate the diary — see caution 1 | 🟢 Screen built — **gating decision pending (lean: keep free)** |
| Private journal | ⚠️ reconsider | low | Positioning call first — see caution 2 | 🔴 Not started — *positioning call before building* |
| Priority support (technical + emotional) | ⚠️ split it | varies | Technical only — see caution 3 | 🟡 Technical lane exists (needs definition); emotional = free, never a SKU |

**Three cautions the team must not skip:**

1. **"View full timeline" — be very careful gating this.** The timeline is the user's *own
   words, their own history.* The strategy's sharp line: insights *about* the data = premium;
   the **raw data the user themselves created = free.** Paywalling someone's own past
   reflections is the textbook move that makes Profile E feel the product is holding their
   vulnerability hostage. At most: free shows *recent* timeline, Xolace+ unlocks the *full*
   archive — but lean toward keeping the timeline free and selling the *patterns across it*
   instead. **Don't gate the diary; gate the analysis of the diary.**

2. **"Private journal" — flag for product-philosophy review, not COGS.** Cheap to build, but
   it cuts against the thesis (*"not a journaling app"*). It risks turning Xolace into Day One
   with extra steps and diluting the articulation→mirror loop that is the actual
   differentiation. Decide whether it *strengthens or blurs* the core promise before pricing
   it. Positioning call first, pricing call second.

3. **"Priority support" — keep technical, drop emotional.** Technical priority support is a
   fine, cheap perk. **"Priority emotional support" is not:** it contradicts the core thesis
   (*"the fire is not a participant"*), and it is a **duty-of-care / liability minefield** in a
   mental-health context — promising paid emotional support sets a safety expectation we may
   not be staffed or qualified to meet. And the safety corner — escalation, crisis resources —
   must be **free and immediate for everyone, never a paid tier** (same guardrail as §4).
   → *Technical priority = Xolace+. Emotional/crisis support = free for all, always.*

**The strategic gift in this list:** many items are **near-zero-COGS** (themes, icon,
widgets, mirror tones, personalized quotes). They pad the Xolace+ offer with real perceived
value *without eroding margin* — which is exactly what justifies $44.99/yr without piling on
AI cost. **Lead the pitch with insight depth (the emotional hook); let the cosmetics be the
"and also all this" that makes it feel generous.** The expensive items (video, voice) are
what eventually justify the *second* tier (§3). And two of these — **widgets + personalized
quotes** — quietly answer the research's open question *"what happens between sessions?"*:
they are retention surfaces, not just perks.

---

## 5. Pricing (Global / US-led)

```
Monthly      $7.99        ← anchor, expect <20% of subs to pick this
Annual       $44.99       ← HERO. ~53% off monthly, framed "$3.75/mo"
Trial        7 days free  ← on annual only
```

- **Push annual hard.** The value (compounding insight + emotional memory) is inherently
  long-horizon; monthly churn cuts users off right before the payoff lands. Annual aligns
  price with value delivery — and at $44.99 it **covers even a heavy user's annual COGS with
  margin** (see §2).
- Enable **App Store automatic regional pricing** on top of the USD anchor so
  emerging-market users aren't priced out (cheap insurance even though the core is US-led).

### Lifetime — deliberately NOT a standing SKU

An earlier draft proposed a permanent $99 lifetime tier. **We are dropping it as a standing
option, and the team should understand why** — because for an AI-COGS product it is the
weakest possible structure:

- Heavy premium user ≈ **$24–48/year** to serve (§2).
- $99 lifetime breaks even in **~2–4 years**, then **loses money every year after, forever.**
- **Adverse selection makes it worse:** lifetime buyers skew toward believers and power
  users — exactly the highest-COGS cohort, the ones who *will* stay 5+ years and *will* use
  voice/memory/reports. We'd be selling an unbounded-cost liability at a fixed price to the
  users most likely to max it out.

Lifetime only makes sense for zero-marginal-cost software (not us) **or** as a deliberate,
**bounded founding-member offer** — cohort-capped and/or time-boxed — sold to early
believers to trade long-term margin for upfront cash + evangelists + willingness-to-pay
validation. If we ever ship lifetime, it is that: a *limited campaign*, ideally excluding
the highest-COGS AI-generative features — **not** a forever button in the paywall. (Tracked
in §12.)

---

## 6. Premium teasers + the validation approach

### What a teaser is

A teaser is **the free profile/insights screen showing that a premium insight exists —
rendered with the user's *real* data — but with the depth blurred or locked.** It is the
opposite of a generic 🔒 padlock row.

Three concrete examples mapped to actual features:

- **Constellation (P1):** Free user sees one real stat — *"Your most common emotion is
  anxiety, in 60% of your sessions."* Directly below: a **blurred star-cluster shaped from
  their own data**, labeled *"See the full map of what keeps showing up."* They can tell
  there's something rich there, shaped like *them* — they just can't read it yet.
- **Specificity growth (P3):** *"Your words are finding you — avg clarity 7.2 ▓▓ (see how
  far you've come)."* The current number teases; the trend line is blurred.
- **Your language (P5):** *"Words that keep finding you: trapped · invisible · ▓▓▓▓ ·
  ▓▓▓▓."* Two real words shown, the rest fogged.

**Why it converts where a padlock doesn't:** a padlock advertises *a feature*. A teaser
advertises *something true about you that you can't quite see yet.* That's desire, and it's
specific to that user. It gets more compelling the more they use the app — which is exactly
why the conversion trigger fires at a **data milestone**, not on a clock (see §7).

### The validation approach — intent-only teasers (no price, no buy button)

We want to measure whether teasers create desire **before** building billing. The chosen
approach is **intent-only teasers**:

- The teaser shows the blurred insight (real data) as above.
- Tapping it opens **not a paywall**, but a *"These insights are coming — want to be first?"*
  sheet (notify-me / waitlist). **No price. No "Subscribe" button. No payment surface.**
- We instrument the tap-through and waitlist opt-in in PostHog. That's pure desire signal.

**Why not a mock paywall — the App Store rejection risk.** Shipping a fake/non-functional
"buy" button to the App Store triggers two real rejections:

- **Guideline 2.1 (App Completeness):** a buy/unlock button that doesn't actually transact
  is non-functional/placeholder → rejected.
- **Guideline 3.1.1 (In-App Purchase):** unlocking digital features requires Apple IAP;
  anything that *looks* like taking money another way → rejected.

The **teaser visual itself is completely fine** — apps ship locked "Premium" sections all
the time. The rejection risk lives *only* in the CTA's destination. By making the CTA a
waitlist instead of a purchase, we stay fully clear of both 2.1 and 3.1.1.

### Mapping to our OTA release path

This fits the OTA path cleanly: the intent-only teaser is **pure JS/UI** (blurred render +
waitlist sheet + PostHog events) with **no native billing module**, so it can ship as an OTA
update. Real IAP later **cannot** ship via OTA — it requires a native module
(`react-native-purchases` / RevenueCat) and therefore a full store build. So the sequence is:

1. **OTA:** ship intent-only teasers, measure desire.
2. **Store build (later):** when desire is proven, add the native billing module + real
   paywall via a versioned App Store / Play submission.

---

## 7. The paywall moment — the single biggest leverage point

**The non-obvious insight: premium value is data-gated, not time-gated.** A brand-new
user's constellation is empty — a trial offered at onboarding sells nothing. Premium becomes
*real* only after ~10+ sessions of accumulated data.

So invert the usual playbook:

1. **From day one (soft):** teasers on the profile screen with *real, blurred* data (see §6).
2. **The hard conversion trigger fires at an *earned data milestone*** — not a clock, not a
   usage cap:

   > *"You've processed 10 moments. Your constellation is ready. Start your free week to see
   > what's been showing up."*

   This is the most on-brand paywall we can build: **earned, not extracted.** Fire milestone
   triggers at 10 / 30 sessions and at first monthly-pattern generation. (During the
   intent-only phase, this same trigger opens the waitlist sheet instead of a paywall.)
3. **Paywall hygiene** (Apple requires + Profile E demands): visible close button, "Restore
   purchases," honest trial copy, frictionless cancellation. **No fake urgency, no
   streak-guilt, no countdown manipulation.** Easy cancellation builds trust with the most
   valuable users and reduces refund/chargeback rate.

---

## 8. Subscription lifecycle

| Stage | Play | Brand guardrail |
|---|---|---|
| **Trial start** | 7-day, triggered at data milestone | Frame as "see what you built," not "unlock premium" |
| **Trial nurture** | Gentle value touchpoints day 1/3/5 — show the constellation filling in | No guilt, no "don't lose access" pressure |
| **Trial → paid** | Default annual; clear "what you keep" not "what you lose" | Honest |
| **Active** | Deliver compounding value: weekly weather (P13), memory (P14) — things that *get better the longer you stay* | This is the anti-churn engine |
| **Billing retry / dunning** | Store grace periods + RevenueCat retry. Quiet, non-alarmist recovery copy | Never lock out abruptly over a failed card |
| **Cancellation** | One-tap, no dark-pattern maze. Offer pause > discount > goodbye | Easy exit = trust = win-back later |
| **Churn / win-back** | "Your emotional memory is still here. Pick up where you left." | The moat (P14) *is* the win-back hook |

**The lifecycle moat is Personal Emotional Memory (P14).** Once a user has 6+ months of
indexed sessions, churning means losing the AI that remembers their exact emotional texture
from 3 months ago. That is the switching cost — prioritize it in Wave 3 specifically
*because* it is the retention/win-back engine, not just a feature.

---

## 9. Infrastructure

Current state: `users.isPremium: v.boolean()` is stubbed ("Reserved for future premium
enforcement. Always false at MVP."); PostHog is wired. No billing SDK yet.

Recommended stack:

- **RevenueCat** (not raw StoreKit / Play Billing). Handles iOS + Android + trials + grace
  periods + entitlements + receipt validation we do *not* want to hand-roll. Expo-compatible
  via `react-native-purchases`. **Native module → requires a store build, not OTA.**
- **RevenueCat → Convex webhook** → flip `users.isPremium` + store entitlement / expiry.
  Single source of truth, server-side.
- **Gate on the Convex query side, always** (resolves open-question #2 in the insight doc):
  premium queries return data only if entitled, else `null` + `premiumRequired: true`. Never
  trust a client-side gate for access control.
- **PostHog events:** intent phase → `teaser_viewed`, `teaser_tapped`, `waitlist_joined`;
  billing phase → `paywall_viewed`, `trial_started`, `trial_converted`,
  `subscription_renewed`, `subscription_cancelled`, `churn`. Structural events keyed on
  `tokenIdentifier` (per existing PostHog convention). RevenueCat also pipes revenue events
  to PostHog natively.

---

## 10. Metrics to instrument

| Metric | Why it matters here |
|---|---|
| Teaser tap-through / waitlist opt-in (intent phase) | Validates desire **before** billing is built |
| Sessions-to-trial-trigger | Validates the data-milestone paywall thesis |
| Trial → paid conversion | Target 40–60% |
| Annual vs monthly mix | We want annual-dominant |
| Churn by cohort (session-count at subscribe) | Tests whether data-rich users retain better (they should) |
| Free → paid conversion rate | Wellness norm 2–5%; data-gated paywall should beat it |
| ARPU / LTV vs AI cost per user | Premium must clear AI generation costs (§2) |

---

## 11. Sequencing (maps onto the insight-features waves)

1. **Now (OTA):** Ship profile screen + free tier (Wave 1) + **intent-only teasers**
   (blurred real data → waitlist sheet) + PostHog intent events. No billing, no native
   module. Measure desire.
2. **~Weeks 2–4 (Wave 2 features):** Build the real insight features the teasers point at
   (constellation, specificity growth, your-language) so there's genuine depth behind the gate.
3. **Store build (when desire is proven):** Add RevenueCat + the Convex entitlement webhook +
   server-side gating, swap the waitlist CTA for the real data-milestone paywall, ship via a
   versioned store submission.
4. **Wave 3:** Memory (P14) + weekly/monthly reports — the retention/win-back moat that
   justifies *annual* and makes churn expensive.

---

## 12. Net recommendation

- **Tiers:** one paid tier now (`Xolace+`), architect for an optional second
   COGS-defense tier later, never three.
- **Pricing:** annual-forward — **$44.99 hero, $7.99 anchor.** No standing lifetime SKU.
- **Validation:** intent-only teasers (real blurred data → waitlist, no price/buy button) via
   OTA; real IAP via store build only once desire is proven.
- **Moat:** build Personal Emotional Memory (P14) deliberately as the churn defense.

The premium pitch is never "unlimited sessions." It is:
**"Deeper self-knowledge that compounds over time."**

---

## 13. Open decisions

1. **`Xolace+` name** — keep `Xolace+` or a campfire-metaphor name. Not "Premium."
2. **Free rate-limit value** — exact cap (sessions/day or /week) before it bites. Needs a
   read on current per-user session volume + AI cost per session.
3. **Session-quality tiers** — which enhancements are premium (voice mirror? unlimited
   refinement turns? priority processing? memory window length?) vs shipped to all.
4. **Trial length** — 7 days assumed; could test 14 given the data-richness ramp.
5. **Founding-member lifetime** — optional bounded, cohort-capped offer to the ambassador
   cohort to validate willingness-to-pay early. Campaign only, never a standing SKU.
6. **Second-tier trigger** — what COGS/usage signal justifies introducing the higher tier.

---

## Status

DRAFT — current plan: intent-only teasers via OTA first, real billing via store build once
desire is proven. Pending decisions in §13, and the RevenueCat + Convex entitlement-webhook
implementation plan as the concrete next engineering step (store-build phase).
