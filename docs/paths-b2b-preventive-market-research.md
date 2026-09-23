# Paths B2B preventive-care market research — does the "prevention layer" pitch fit Xolace

Grounds the B2B "prevention layer" pitch discussed with the founder against primary sources
and the actual Xolace codebase, to answer three questions: (1) does it generate real consumer
ideas, (2) can B2B sit alongside consumer, (3) or does it require tearing consumer down.

**One-line recommendation:** The $1-for-$4 figure is real but is a *treatment* scale-up ROI,
not a prevention-vs-treatment ROI — correct the pitch before using it externally. Dual
consumer+B2B is proven viable (Wysa, Modern Health) but always ships as two separate go-to-market
motions with distinct product surfaces, not one app wearing two hats — so the honest framing for
Xolace is **"add a second product on shared infrastructure," not "reposition the current app."**
No teardown is required; the existing Cognition Layer (episodic + semantic memory) is the actual
moat a B2B "passive detection" story would need and doesn't yet fully exist for individuals either.

---

## 1. Primary-source correction: the ROI figure

The earlier conversation cited "$1 invested in prevention returns $2–$4" from a secondary
aggregator (mindarchhealth.com). Re-verified at the source:

- **WHO's own mental-health-at-work fact sheet** states the productivity-loss figure precisely:
  "12 billion working days are lost every year to depression and anxiety at a cost of US$1
  trillion per year" — but **contains no ROI ratio** for prevention or treatment [1].
- The "$1 → $4" figure traces to **Chisholm et al. 2016, *Lancet Psychiatry*** (WHO-affiliated,
  peer-reviewed): scaling up **treatment** coverage for depression/anxiety in 36 countries,
  2016–2030, costs a net present value of **$147B**, and the modeled return is a
  **benefit-to-cost ratio of 2.3–3.0:1 (economic benefits only) to 3.3–5.7:1 (economic + health
  value)** [2][3]. This is a **treatment-scale-up** ROI, not a prevention-vs-cure comparison —
  the study models better *access* to existing depression/anxiety treatment, not earlier
  intervention before diagnosis.
- **Correction for the pitch deck:** there is no WHO/peer-reviewed study in this search directly
  quantifying "prevention layer catches it before it's clinical, therefore N× cheaper than
  treatment." That's a plausible economic argument (earlier, cheaper intervention is intuitive)
  but it is **not yet a sourced claim** — say "the WHO's own $1T figure is productivity lost to
  conditions that already reached clinical severity" and let the reader draw the prevention
  inference, rather than attributing a specific multiplier to WHO.

---

## 2. Does dual consumer+B2B have real precedent? (crux of Q2/Q3)

| Company | Model | Consumer app alongside B2B? |
|---|---|---|
| **Lyra Health** | Pure B2B — sells to employers/health plans only, no direct consumer product [4] | No |
| **Spring Health** | Pure B2B — employers and health plans [4] | No |
| **Modern Health** | Dual — serves individuals directly *and* companies [4] | **Yes** |
| **Wysa** | B2B2C — >80% of revenue from employers/health plans, but also runs a free/freemium consumer app with 6M+ downloads, positioned as a parallel channel that "reduces dependence on any single revenue source" [5] | **Yes** |
| **Headspace → Headspace Health (merged with Ginger, 2021)** | Started pure consumer (meditation), later added a **separate enterprise/EAP product line** post-merger, sold alongside the consumer app under one parent company [6][7] | **Yes, but as a bolt-on after a $3B merger**, not an organic feature of the original consumer product |

**Pattern that holds across every dual-motion company found:** none of them tried to make *one
app* serve both audiences. Modern Health, Wysa, and Headspace Health all run the B2B offering as
a **distinct surface** — different admin/manager dashboards, different onboarding (employer
sends an access code), different aggregate-not-individual reporting to the employer for privacy —
built on shared backend infrastructure (clinical content, coaching, AI triage) but not shared UI
or shared positioning. Headspace's case is the most instructive negative data point: it did not
evolve its consumer app into a B2B one — it **acquired a company (Ginger)** that already had B2B
DNA and ran the two in parallel for a year before even attempting a "unified" offering [7].

**No precedent found for tearing down a consumer product to go B2B-first.** Lyra and Spring
Health were *built* B2B-first; they are not consumer-pivots. There's no case in this search of a
consumer mental-health app abandoning its consumer base to become B2B.

---

## 3. Consumer retention precedent for the "preventive/skincare-routine" framing

- Headspace: **D1 ~30%, D7 ~12%, D30 ~6%** retention by one 2026 benchmark source (a second
  source cites 4.7% D30 — figures vary by methodology, both are low) [8][9].
- Industry-wide: **apps with daily streak reminders retain 2–3× more users at 30 days** than
  those without, and health/wellness apps average **7–10% monthly churn**, with the low end
  belonging to apps with strong habit-formation mechanics [8].
- Headspace's own retention levers, per public write-ups: **streak counters, milestone badges,
  and push notifications timed to the user's own past session pattern** (not generic reminders)
  [9]. This is the same mechanic Xolace already ships — see `docs/streak-calender.md` (a
  full-screen streak-reveal animation with per-day milestone copy at days 1/7/14/21/30/50/75/100)
  — so Xolace is not behind the state of the art here; it's already built the piece the market
  leader credits.

These are marketing/UX write-ups, not the companies' own investor-grade retention disclosures —
flagged as secondary but directionally consistent across independent sources.

---

## 4. Internal context: what Xolace actually has to build on

- `CLAUDE.md` states retention/gamification (streaks, milestones, insight unlocks, progress
  tracking) is an **explicit open mandate**, and the product metaphor is "a digital campfire...
  the AI illuminates and warms but is not a participant." Any B2B-flavored feature has to survive
  that constraint — the AI cannot become a workplace-surveillance participant.
- `docs/cognition-layer-architecture.md` — Xolace already has the technical primitive a B2B
  "passive detection" pitch would need for *consumers*: a **semantic profile** (AI-written
  narrative of who the person is emotionally, versioned, written by a background Reflection
  Agent) and **episodic memory** (per-session embeddings). This is a stronger foundation for
  "notice the person before they name it" than most B2B competitors' keyword/survey-based
  detection — it's a **consumer-side moat**, not something that needs a B2B pivot to unlock.
- `docs/follow-up-system.md` — Xolace already runs a **weight-tiered proactive check-in system**
  (Acute/Elevated/Standard cadences with `step.sleep` workflows) that re-engages a user *before*
  they've churned, triggered by escalation/abandon signals detected in-session. This is
  functionally the consumer analog of the B2B pitch's "catch pre-clinical stress before it
  compounds" — it already exists, just scoped to the individual, not an employer's roster.
- `docs/streak-calender.md` — the retention mechanic precedent from §3 is already mid-build.
- No ADR in `docs/adr/` mentions B2B, enterprise, or workplace — confirming this is genuinely
  unexplored territory, not a previously-rejected direction.

---

## 5. Answers

**Q1 — Can the B2B pitch generate real consumer ideas?** Yes, and Xolace is closer than the pitch
assumes. The B2B "passive detection + micro-intervention before burnout" concept translates
directly to consumer as: **use the existing semantic profile + follow-up cadence to proactively
surface a 60-second intervention when the Understanding layer detects a compounding pattern**
(e.g. three sessions in 10 days trending toward the same unresolved theme) — not a new
architecture, an extension of `followUpCadence` gating on a semantic-profile trend instead of only
single-session escalation. The "skincare routine" framing is a positioning/copy opportunity
layered onto the *existing* streak mechanic, not a new feature: reframe the streak card copy and
onboarding language around "maintenance" rather than "processing a crisis."

**Q2 — Can B2B sit alongside consumer?** Yes, with real precedent (Modern Health, Wysa) — but
only as a **separate product surface on shared backend**, never as a repositioning of the existing
app. Concretely: a B2B offering would reuse `convex/ai/*` (the cognition layer, safeguard,
process pipeline) and expose a new employer-facing admin surface with **aggregate-only,
anonymized** reporting (never individual session content — this is non-negotiable given every
competitor found gates employer visibility to aggregates, and it's the only way to keep Xolace's
privacy-first posture and the "AI is infrastructure, not a participant" metaphor intact for the
consumer product it sits beside).

**Q3 — Does this require tearing down consumer?** No. No company in this research pivoted an
existing consumer mental-health app into B2B; the ones with both built B2B as an addition
(Modern Health from inception, Wysa and Headspace Health as parallel/acquired lines). The
"teardown" framing that started this analysis, taken from the pitch's aggressive B2B
positioning, does not match how any real dual-motion company in this space actually executed it.

---

## Sources

[1] [WHO — Mental health at work fact sheet](https://www.who.int/news-room/fact-sheets/detail/mental-health-at-work)
[2] [Chisholm et al. 2016, "Scaling-up treatment of depression and anxiety: a global return on investment analysis" — The Lancet Psychiatry](https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(16)30024-4/fulltext)
[3] [Chisholm et al. 2016 — PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/27083119/)
[4] Business-model summaries for Lyra Health, Spring Health, Modern Health (secondary aggregators — vizologi.com, businessmodelcanvastemplate.com; used only for the B2B-only vs. dual-model distinction, cross-checked across multiple independent write-ups)
[5] [Wysa business breakdown — The Hemingway Report](https://www.thehemingwayreport.com/articles/43-wysa-x-april-deal-breakdown)
[6] [Ginger and Headspace merger announcement — BusinessWire](https://www.businesswire.com/news/home/20210825005262/en/Ginger-and-Headspace-Will-Merge-to-Meet-Escalating-Global-Demand-for-Mental-Health-Support)
[7] [A Year After $3B Mega Merger, Headspace and Ginger Roll Out 'Unified' Behavioral Health Offering — Behavioral Health Business](https://bhbusiness.com/2022/11/18/a-year-after-3b-mega-merger-headspace-and-ginger-roll-out-unified-behavioral-health-offering/)
[8] [App Retention Benchmarks for 2026 — enable3.io](https://enable3.io/blog/app-retention-benchmarks-2025)
[9] [Headspace gamification/retention strategies — StriveCloud](https://www.strivecloud.io/blog/headspace-gamification-features)

**Internal:** `CLAUDE.md`, `docs/cognition-layer-architecture.md`, `docs/follow-up-system.md`,
`docs/streak-calender.md`, `docs/feat-analysis.md`, `docs/adr/` (listing only, no B2B-relevant entries)
