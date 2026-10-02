# How well-being products score people without feeling clinical

Research for #485 (Compounding Layer map #484). Feeds the scoring-engine and formula tickets (#487 onward).

**Question:** how do validated instruments and consumer apps turn self-report and journaling signal into per-area or overall well-being numbers, which design choices keep a score honest and supportive rather than clinical or shaming, and which statistical and LLM methods hold up on sparse, irregular personal data like ours?

**Short answer:** The validated scales that read as "well-being, not diagnosis" have the same three traits: a positive frame, a 0–100 transform, and a fixed recall window. None of the consumer apps we looked at publishes a 0–100 well-being score. They show raw mood averages and factor correlations, and they gate those insights behind a minimum amount of data. On data like ours (sparse, irregular, sampled when distress triggers a session), the defensible engine is deterministic. It uses a time-decayed EWMA per life area, shrinks toward a prior until the area has enough evidence, and flags change only when it clears a reliability band. The LLM should stay where it already is, as the per-session classifier, and should not score areas directly.

Legend: **[P]** primary source (scale manual, official docs, peer-reviewed paper). **[C]** Xolace codebase fact. **[I]** inference or recommendation from this research, not a sourced fact.

---

## 1. What Xolace already has (the input reality)

- `emotional_metadata.intensity` is a 1–10 rating **of distress in what the user brought**, set by the classifier prompt. The anchors run from "1 = I feel a little off" to "10 = I can't take this anymore". **[C]** `convex/ai/prompts/classifier.ts` (intensity block, ~L86–98).
- `thematicTags` holds life areas from a closed vocabulary of 32 tags, including work, relationships, family, health, finances, studies, sleep, burnout, and housing. **[C]** `convex/lib/understandingVocab.ts` `THEMATIC_TAGS`.
- The other fields: `primaryEmotion` with `primaryEmotionConfidence` (0–1, where below 0.6 is ambiguous), `supportNeed`, `riskFlag`, and `classifierVersion`. **[C]** `convex/schema.ts` `emotional_metadata`.
- `postSessionMood` is one of lighter, same, heavier, or unsure, and is optional (set only if the user answers). **[C]** `convex/schema.ts`.
- `follow_up_responses` stores the reflection text and the "heavier" menu choice for each follow-up card. **[C]** `convex/schema.ts`.
- The classifier runs on a pinned dated snapshot (`claude-haiku-4-5-20251001`), and each row records `classifierVersion`. **[C]** `convex/ai/providers/anthropic.ts`. No `temperature` is set anywhere under `convex/ai/`, so the provider default applies. **[C]** (grep).

**The structural problem [I]:** every data point is a *session*, and people open Xolace when something is weighing on them. That makes this event-sampled, distress-triggered data, not the scheduled, unconditional sampling that validated scales and EMA studies rely on. Two consequences follow:

1. A low `intensity` average for an area does not mean the area is steady. It may only mean the user brings that area when it is mildly off.
2. **Silence is ambiguous.** No sessions about Work could mean Work is fine, or it could mean the user has stopped using the app. A steadiness score cannot treat absence as evidence of steadiness without saying so out loud. This is exactly what the map's required honesty caveat ("what Xolace knows from how you've used Xolace") covers.

---

## 2. Validated well-being scales

### WHO-5 Well-Being Index
- Five positively worded items about the **last two weeks**, each rated 0 ("at no time") to 5 ("all of the time"). The raw 0–25 score is **multiplied by 4 to give 0–100**. **[P]** CORC summary of WHO-5.
- A 213-article systematic review found high clinimetric validity, good responsiveness as a trial outcome, and good sensitivity and specificity as a **depression screener**, with very broad applicability. **[P]** Topp, Østergaard, Søndergaard & Bech (2015), *Psychother Psychosom* 84(3):167–76, PMID 25831962.
- The usual screening cut-off is ≤50, which CORC also cites. The Topp review discusses ≤50 for screening and ≤28 for likely depression, and treats a 10-point change as meaningful. **[P]** (review; the cut-off values are reported from the review abstract and secondary summaries, so check the full text before quoting numbers in-app.)
- **Lesson [I]:** WHO-5 is the best example of a well-being number that does not read as clinical. Every item is a positive statement ("I have felt cheerful…"), so a higher number means more presence of something good, not less pathology. Its cut-offs, though, are depression-screening cut-offs. **Xolace should never show a threshold line on a steadiness score**, because that turns a well-being number back into a screener.

### Personal Wellbeing Index (PWI-A), International Wellbeing Group
- Seven core items, each asking for satisfaction with one **life domain**: standard of living, health, achievement in life, personal relationships, personal safety, community connectedness, and future security. Each is rated 0 ("completely dissatisfied") to 10 ("completely satisfied") and multiplied by 10, so each domain gets its own 0–100 score. The overall score is the mean of the domains. "Life as a whole" is asked separately and kept out of the composite. **[P]** PWI-A form (NovoPsych copy of the IWG instrument), IWG *PWI Manual*, 6th ed.
- The theory behind it is **subjective-wellbeing homeostasis**. Most people hold a stable, positive set-point. Australian population means stay remarkably steady at about 74–77 points out of 100, and individual set-points usually fall between roughly 70 and 90. **[P]** Cummins et al., *Developing a national index of subjective wellbeing: The Australian Unity Wellbeing Index* (Social Indicators Research, 2003), plus the Australian Unity Wellbeing Index reports.
- **Lesson [I]:** this is the closest validated match to the product's "0–100 per life area" idea. Per-domain 0–100 scores are a legitimate, published construct, which supports the Steadiness format. Homeostasis theory also argues for a **personal baseline**: what matters is the drop from *your own* set-point, not distance from 100. The population norm (~75) works as the *prior* for shrinkage (§4), not as a target.

### WEMWBS (Warwick-Edinburgh Mental Wellbeing Scale)
- Fourteen positively worded items, each rated 1–5, for a total of **14–70**. The population mean is 51 (SD 7). The authors' guidance names the top 15% "high" (60–70) and the bottom 15% "low" (≤42). **[P]** Warwick Medical School, *Collect, score, analyse and interpret WEMWBS*.
- At the individual level, the minimum detectable change is **3–8 points**, and the authors suggest 3 as "meaningful change". **[P]** same.
- The authors themselves say: **"Neither of the measures was developed for monitoring change at the individual level or in clinical settings."** **[P]** same.
- **Lesson [I]:** even the instrument owners treat single-person trajectories carefully. Change claims should come with a minimum-change band, and "your score moved 2 points" should never be presented as a real change.

### PHQ-9 / GAD-7 (contrast only)
- These count **symptom frequency**, and higher means worse. Their output is a severity band ("moderate", "severe"). **[I]** That severity framing, built around higher-is-sicker scores and diagnostic labels, is exactly what Xolace's non-clinical voice rules out. Never map steadiness onto PHQ or GAD bands and never borrow their band names. WEMWBS's published cut-points were benchmarked against CES-D and PHQ-9, which shows how easily well-being scales get pulled back into clinical use. **[P]** WEMWBS guidance.

---

## 3. Consumer apps: how they score

| Product | What the user sees | How it's computed (documented) | Non-clinical design choices |
|---|---|---|---|
| **Bearable** | Mood on a 1–10 scale. A Factor Effect Report shows which factors move mood, symptoms, and sleep. | Compares outcome scores on days *with* a factor against days *without* it, taking timing into account. Needs **≥3 entries with the factor and ≥3 without** before a factor appears. **[P]** Bearable support, *The Factor Effect Report*. | Correlations, not grades. Tells users to "be critical of the results." No composite well-being score. |
| **Daylio** | A five-point mood scale, average mood charts, and "Influence on Mood" per activity. | The method is undisclosed. Each insight carries a **Low, Medium, or High confidence** label: "Low confidence might describe a specific trend, but you should not take it at face value." It needs many occurrences *and* entries without the activity. **[P]** Daylio FAQ, *Activity and Mood Statistics*. | **Shows confidence explicitly, next to the number.** |
| **How We Feel** | The Mood Meter: a pleasantness × energy grid with four quadrants and about 144 emotion words. Weekly insights and HealthKit correlations. | Built from the Yale Center for Emotional Intelligence's (Brackett) RULER Mood Meter. Data stays on the device unless the user opts into anonymised research. **[P]** App Store listing, Mood Meter materials. | **No score at all.** It uses position on a 2D map and names the feeling. Every quadrant is legitimate, and calm (low energy, pleasant) is a "good" place, not a low score. |
| **Finch** | A pet bird that gains energy from goals the user sets. Streaks. | No well-being score. Progress comes from self-care actions. | The bird never dies or suffers from absence, and streaks can be **paused without loss**: "no guilt, no pressure." **[P/secondary]** Finch team posts and app descriptions. |
| **Rosebud** | AI entry reflections, weekly reports, auto-tags, long-term memory, and themes over time. | Built on an LLM. Its own docs admit: "Rosebud doesn't have a great sense of time, and does better recalling topics vs. specific dates." **[P]** Rosebud Help, *Long-term memory*. | Qualitative patterns, not numbers. The vendor states the LLM's limits openly. |
| **Stoic** | A mood tracker with factors, "personalized insights", streaks, and badges. | Not documented. Its features page lists no numeric well-being score. **[P]** getstoic.com/features. | Patterns and streaks, no grade. |
| **"Growth Area 0–100 rings"** (a Dribbble and concept pattern, with Wheel of Life as its ancestor) | One ring per life area, each with a 0–100 number. | **No shipped product we found documents how these rings are computed.** They are mock-ups. **[I]** | Visually appealing, but nobody publishes the method behind them. Xolace would be the first to ship one with an honest method. |

**Cross-cutting findings [I]:**
1. **No mainstream consumer app we found ships a computed 0–100 per-area well-being score.** The validated precedent is PWI, which is self-rated satisfaction, not inferred. Xolace's score is inferred from sessions, which is new ground and needs stronger honesty framing than anything above.
2. **Minimum-data gates are standard.** Bearable uses 3+3 and Daylio uses confidence tiers. Both map directly onto the map's "thin areas unlock" mechanic, so the unlock can honestly be described as a **data-sufficiency gate**, not just a paywall.
3. **Show confidence beside the number.** Daylio does this. It is the most direct non-clinical way to say "this might be wrong."
4. **Absence is never punished.** Finch makes this a product rule, and it fits the silence-is-ambiguous problem in §1.
5. **Explain causes as correlations, not verdicts.** Bearable tells users to question results. Rosebud admits its weaknesses.

---

## 4. Baselines and change detection on sparse, irregular self-report

### Smoothing: EWMA
- The standard form is `EWMA_t = λ·Y_t + (1−λ)·EWMA_{t−1}`, with λ usually set to **0.2–0.3**. The control band is `EWMA_0 ± k·s·√(λ/(2−λ))`, usually with k = 3. **[P]** NIST/SEMATECH *e-Handbook of Statistical Methods* §6.3.2.4.
- **Irregular spacing breaks plain EWMA.** A fixed λ treats a gap of 1 day and a gap of 30 days the same way. Eckner's unevenly-spaced-series algorithms use a **time-decayed EMA** that sets the weight from the gap (`w = e^{−Δt/τ}`) and show that the naive form is biased toward the first sample, then offer an unbiased variant. **[P]** Eckner, *Algorithms for Unevenly Spaced Time Series* (implemented in the `RcppUTS` package and in NAG `tsa.inhom_iema`).
- **[I] Recommendation:** use a time-decayed EMA per (user, area), with τ given in days (a starting value might be a ~21-day half-life, to be tuned in #487). The baseline is a slower EMA (half-life ~60–90 days), and "now" is the faster one.

### Change significance: reliable-change bands, not raw z-scores
- Jacobson & Truax's **Reliable Change Index** is `RCI = (x₂ − x₁)/S_diff`, where `S_diff = √2·SE` and `SE = s·√(1−r)`. A change counts as reliable when |RCI| ≥ 1.96. **[P]** Jacobson & Truax (1991), *J Consult Clin Psychol* 59(1):12–19, via psyctc.org.
- WEMWBS uses a 3-point minimum individual change, and WHO-5 conventionally uses 10 points (§2). **[P]**
- **[I]** Rolling z-scores need a stable personal SD. With fewer than about 10 points in an area, the SD estimate is noise and z-scores will throw false alarms. Instead, **pool the SD across areas for each user, or use a population SD** until the area has enough data. That is the RCI approach: use an SD you trust, not one estimated from the user's last 4 sessions.

### Cold start: Bayesian shrinkage to a prior
- The classic result is that **shrinking each unit's mean toward the group mean beats using each raw mean** on total error when per-unit data is noisy (James-Stein, and Efron & Morris's 1975 baseball example). **[P]** Efron & Morris (1975), *JASA* 70:311–319. The normal-normal partial-pooling estimator is `θ̂ = (n·ȳ/σ² + μ₀/τ²)/(n/σ² + 1/τ²)`. **[P]** Gelman et al., *Bayesian Data Analysis*, ch. 5.
- **[I] For Xolace:** an area's displayed steadiness is `w·personal + (1−w)·prior`, where `w = n/(n+k)`. The prior is the **user's own cross-area mean** first, and the **population mean for that area** if the user is new. k sets how many sessions it takes for the personal signal to dominate (with k = 5, 5 sessions gives a 50/50 blend). This replaces a hard "unknown" state with an honest "mostly prior" state. The UI can then **unlock** an area when `w ≥ 0.5`, or a similar threshold, which turns the premium unlock into a statistically meaningful event.

### Minimum-data thresholds (what the field uses)
- Bearable requires ≥3 days with a factor and ≥3 without. **[P]**
- Daylio uses Low/Med/High confidence instead of a hard gate. **[P]**
- PWI substitutes the mean when one item is missing and does not score at all when more are missing. **[P]** PWI-A form (per the NovoPsych copy).
- **[I] Proposal for #487:** no score with fewer than 3 sessions tagged to an area in the window. Show the score with a "still learning" label from 3 sessions, and show it fully once `w ≥ 0.5` and the area has at least 2 distinct weeks of data, so one bad weekend cannot set a baseline.

### "Compounding" detection: research precedent
- In EMA data, rising **autocorrelation, variance, and cross-emotion correlation** came before transitions into and out of depression (critical slowing down). **[P]** van de Leemput et al. (2014), *PNAS* 111(1):87–92, PMC3890822. That study used dense sampling (several prompts a day over 5–6 days, N = 628).
- **[I]** Xolace's sampling is far too sparse and irregular to estimate autocorrelation reliably, so treat this as a direction for the roadmap only. What sparse data *can* support for v1:
  1. **Level shift:** fast EMA minus baseline EMA, beyond an RCI-style band.
  2. **Frequency rise:** an area's share of sessions climbing, which counts as signal in itself, because a user returning to the same area is what "compounding" means.
  3. **Co-occurrence growth:** two areas tagged together more often (for example sleep with work), which echoes the cross-correlation finding above.
  4. **Recovery failure:** a rising share of heavier or same `postSessionMood` responses on an area.

---

## 5. LLM-based scoring of free text

- **Stability across runs:** LLM judges show **low intra-rater reliability** when scoring the same input across runs. Ratings can be "almost arbitrary in the worst case." **[P]** Haldar & Hockenmaier, *Rating Roulette: Self-Inconsistency in LLM-As-A-Judge Frameworks* (arXiv 2510.27106). Temperature 0 does not guarantee determinism, because serving-level nondeterminism remains. **[P]** Song et al., *The Good, the Bad, and the Greedy* (arXiv 2407.10457).
- **Drift:** the same model *name* behaved very differently three months apart (GPT-4 prime identification fell from 84% to 51% accuracy, and instruction-following declined). **[P]** Chen, Zaharia & Zou, *How Is ChatGPT's Behavior Changing over Time?* (arXiv 2307.09009). Pinning a dated snapshot, as Xolace already does, mitigates this but does not remove the risk when the model is upgraded.
- **Calibration:** LLMs are **overconfident** when they state their own confidence. Consistency across multiple samples helps, but no method was reliably best. **[P]** Xiong et al., *Can LLMs Express Their Uncertainty?* (ICLR 2024, arXiv 2306.13063). This applies directly to `primaryEmotionConfidence`, which is a self-reported number from the model.
- **Known judge biases:** position bias (consistent only 65% of the time when answers were swapped), verbosity bias (longer answers scored higher), and self-enhancement bias. **[P]** Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* (NeurIPS 2023, arXiv 2306.05685). **[I]** Verbosity bias has a likely Xolace counterpart. The classifier prompt says "long reflective writing" signals LOW intensity and "very short punchy input" signals HIGH intensity, so **intensity is partly a measure of writing style**. Users who write long entries may score as steadier. Audit this before trusting intensity as a cross-user input to the prior.

**[I] Implications for the engine:**
1. **Don't ask an LLM for an area score.** A call that turns history into a 0–100 number would be unstable across runs, would drift with model upgrades, and would re-derive what the Understanding already holds, which violates the Constitution Rule. Area steadiness should be a **deterministic function of the stored per-session Understanding**.
2. **Treat each session's `intensity` as a noisy measurement, not ground truth.** EMA smoothing and shrinkage absorb per-run classifier noise, which is a statistical reason to prefer them over showing any single session's intensity.
3. **Partition by `classifierVersion`.** When the classifier version changes, check whether the intensity distribution shifts by comparing the old and new versions on the same inputs, if a re-classification run exists. Otherwise, baselines can show a fake "compounding" step that the model upgrade caused.
4. **Prefer user-given signals where they exist.** `postSessionMood` and follow-up responses are self-reports, closer to how validated scales measure, and immune to model drift. Weight them meaningfully even though they are sparser. The open weekly check-in question (Q4b) would add exactly the kind of PWI-style self-rated satisfaction the validated literature trusts most.

---

## 6. What makes a score honest but not clinical: design rules distilled

1. **Positive direction:** higher means steadier. WHO-5, PWI, and WEMWBS all score this way. Never invert the scale and never call a number "distress." **[P→I]**
2. **No thresholds or bands on screen.** Cut-offs belong to screeners (WHO-5 ≤50, WEMWBS ≤42). Showing them turns the feature into a diagnosis. **[P→I]**
3. **Compare to *your* baseline first, and never to a norm on screen.** Homeostasis theory supports personal set-points. The population norm is only a prior. **[P→I]**
4. **Show confidence or data sufficiency next to the number**, the way Daylio does, and phrase it in the Xolace voice. **[P→I]**
5. **Use a minimum-data gate and call it an unlock**, like Bearable's 3+3. **[P→I]**
6. **Don't call a change real unless it clears a minimum-change band** (RCI, WEMWBS's 3, WHO-5's 10). Small wobble is "about the same." **[P→I]**
7. **Silence is not steadiness, and absence carries no penalty**, as in Finch. Without recent data, a score should *fade to "not recently"* rather than drift upward. **[P→I]**
8. **Explain correlations as possibilities**, as Bearable and Rosebud do. **[P→I]**
9. **Carry the scope caveat on every score surface** (map requirement). WEMWBS's own authors add a similar caveat about individual change. **[P→I]**

---

## 7. Open questions this research cannot settle (for #487 and onward)

- How to turn an intensity of 1–10 plus `postSessionMood` plus follow-ups into a 0–100 steadiness value. One candidate is `100 − 10·(intensity_ema − 1)·(10/9)`, adjusted by recovery signals, but this is a formula decision that needs the prototype skill on real anonymised distributions.
- The population prior per area needs data. Query the current distributions of `intensity` by `thematicTags` across users before choosing μ₀ and τ.
- Whether "lighter" and "heavier" should be read as within-session *recovery* (a resilience signal) separately from the level. The research suggests yes, because homeostasis is about recovering to a set-point, not about never dipping.
- The 32 tags have to be grouped into the scored life areas (map note). PWI's seven domains are a validated example of a small, stable domain set.

---

## Sources

**Scales**
- Topp CW, Østergaard SD, Søndergaard S, Bech P. *The WHO-5 Well-Being Index: a systematic review of the literature.* Psychother Psychosom 2015;84(3):167–76. https://pubmed.ncbi.nlm.nih.gov/25831962/
- CORC, *WHO-5*. https://www.corc.uk.net/outcome-experience-measures/the-world-health-organisation-five-well-being-index-who-5
- International Wellbeing Group, *Personal Wellbeing Index – Adult* (form). https://novopsych.com/wp-content/uploads/2023/02/pwi-a.pdf; PhenX protocol: https://phenxtoolkit.org/protocols/view/661301
- Cummins RA et al., *Developing a national index of subjective wellbeing: The Australian Unity Wellbeing Index.* https://dro.deakin.edu.au/articles/journal_contribution/Developing_a_national_index_of_subjective_wellbeing_the_Australian_unity_wellbeing_index/20533413
- Warwick Medical School, *Collect, score, analyse and interpret WEMWBS.* https://warwick.ac.uk/fac/sci/med/research/platform/wemwbs/using-old/howto

**Apps**
- Bearable, *The Factor Effect Report.* https://bearable.app/support/howto/the-factor-effect-report/
- Daylio FAQ, *Activity and Mood Statistics.* https://daylio.net/faq/?p=5703
- How We Feel, App Store listing. https://apps.apple.com/us/app/-/id1562706384
- Rosebud Help, *Long-term memory.* https://help.rosebud.app/ai-analysis/long-term-memory
- Stoic, *Features.* https://www.getstoic.com/features
- Finch: Internet Matters overview, https://www.internetmatters.org/advice/apps-and-platforms/wellbeing/finch/ (pause-without-losing-streak and no-death design are described by the Finch team in community posts; there is no official help page, so treat these as secondary)

**Methods**
- NIST/SEMATECH e-Handbook, *EWMA Control Charts.* https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc324.htm
- Eckner A., *Algorithms for Unevenly Spaced Time Series* (RcppUTS). https://eddelbuettel.r-universe.dev/RcppUTS/doc/manual.html; NAG inhomogeneous EMA: https://support.nag.com/numeric/py/nagdoc_latest/naginterfaces.library.tsa.inhom_iema.html
- Jacobson NS, Truax P. *Clinical significance: A statistical approach to defining meaningful change in psychotherapy research.* JCCP 1991;59(1):12–19. Explainer: https://www.psyctc.org/psyctc/root/stats/rcsc/
- Efron B, Morris C. *Data analysis using Stein's estimator and its generalizations.* JASA 1975;70:311–319.
- Gelman A et al. *Bayesian Data Analysis*, 3rd ed., ch. 5 (hierarchical models).
- van de Leemput IA et al. *Critical slowing down as early warning for the onset and termination of depression.* PNAS 2014;111(1):87–92. https://pmc.ncbi.nlm.nih.gov/articles/PMC3890822

**LLM scoring**
- Haldar R, Hockenmaier J. *Rating Roulette: Self-Inconsistency in LLM-As-A-Judge Frameworks.* https://arxiv.org/abs/2510.27106
- Song Y et al. *The Good, The Bad, and The Greedy: Evaluation of LLMs Should Not Ignore Non-Determinism.* https://arxiv.org/abs/2407.10457
- Chen L, Zaharia M, Zou J. *How Is ChatGPT's Behavior Changing over Time?* https://arxiv.org/abs/2307.09009
- Xiong M et al. *Can LLMs Express Their Uncertainty?* ICLR 2024. https://arxiv.org/abs/2306.13063
- Zheng L et al. *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* NeurIPS 2023. https://arxiv.org/abs/2306.05685
