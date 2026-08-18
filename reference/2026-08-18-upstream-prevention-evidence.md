# Upstream Prevention: What the Evidence Actually Supports

Evidence review, 2026-08-18. Primary sources only (peer-reviewed journals, Cochrane, WHO, NICE).

Xolace's vision doc has carried a hypothesis: *"Most people aren't born with a mental health disorder — it's mostly things that piled up unaddressed,"* with success defined as *"how many people never needed the system in the first place."* This memo tests that against the literature. It is a strategy/evidence memo, not clinical guidance.

Short version: the hypothesis is **partially supportable and materially overstated as written**. The "not born with it" half has real support. The "unaddressed buildup" half is a folk-causal model with no direct evidence base, and the "never needed the system" success metric is contradicted by the best available burden modelling.

---

## Bottom line

- **Common mental disorders are neither purely inherited nor purely accumulated.** Twin heritability of major depression is ~37% (95% CI 31–42) — real but minority variance (Sullivan et al. 2000, *Am J Psychiatry*).
- **Childhood adversity is the single best-evidenced "things that piled up" pathway**, and its ceiling is quantified: eliminating *all* childhood adversities would reduce mood disorders by ~22.9% and all disorders by ~29.8% (Kessler et al. 2010, *Br J Psychiatry*). That is a real but bounded share — not "mostly".
- **"Unaddressed emotional buildup" is not a recognised causal construct.** No meta-analysis estimates variance attributable to it. Treat it as product metaphor, never as etiology.
- **Prevention works, modestly, and decays.** Best IPD evidence: incidence rate ratio 0.57 post-treatment, 0.67 at 12 months, **no significant effect at 24 months** (Ophuis/Buntrock-era IPD MA, *Lancet Psychiatry* 2024). Older MA: 21% incidence reduction, NNT 20 (van Zoonen et al. 2014, *Int J Epidemiol*).
- **Universal delivery is the weakest form.** The largest school trial ever run (MYRIAD, 84 schools, 8,376 pupils) found **no benefit** — SMD 0.005 (95% CI −0.05 to 0.06) for depression risk (Kuyken et al. 2022, *Evid Based Ment Health*).
- **Affect labeling is real in the lab and unproven as prevention.** No trial shows emotion naming prevents disorder onset.
- **Standalone app effects shrink sharply once publication bias is corrected**: g 0.45 → **0.18** for depression, 0.35 → 0.18 for anxiety (Kulke et al. 2025, *Lancet Digital Health*).
- **The "empty the queue" framing is contradicted by burden modelling**: even at 100% optimal treatment coverage, ~60% of mental disorder burden was judged unavertable with present knowledge (Andrews et al. 2004, *Br J Psychiatry*). Prevention shrinking demand is a plausible hope, not a demonstrated effect. **Unverified** — no modelling found that shows upstream digital tools reduce downstream service utilisation.

---

## 1. Etiology: what causes common mental disorders

**Heritability.** The canonical meta-analysis of five twin studies puts heritability of liability for major depression at **37% (95% CI 31–42%)**, with shared (family) environment at essentially 0% (95% CI 0–5%) and individual-specific environment plus measurement error at 63% (95% CI 58–67%) — Sullivan, Neale & Kendler (2000), *American Journal of Psychiatry*, https://doi.org/10.1176/appi.ajp.157.10.1552. This is the most load-bearing number in the whole debate: it means "born with it" is *wrong as a totalising claim* but ~a third of liability is genetic, and it means most of the remaining variance is **non-shared environment**, which is not the same as "things that piled up" — it includes measurement error, chance, and idiosyncratic events.

Molecular genetics finds the same disorder to be highly polygenic: 102 independent variants across 807,553 individuals, replicated in 1.3M (Howard et al. 2019, *Nature Neuroscience*, https://doi.org/10.1038/s41593-018-0326-7). SNP-based heritability is reported at ~8.9% on the liability scale — far below twin estimates ("missing heritability"). *Caveat: I could not verify the 8.9% and the 1.5–3.2% polygenic-score variance figures verbatim from an open abstract; treat as needing a source check before external use.*

**Adversity and chronic stress.** Hughes et al. (2017), *Lancet Public Health* — 37 studies, 253,719 participants — found people with ≥4 ACEs had odds ratios "of more than three to six" for mental ill health, and "more than seven" for self-directed violence, versus none. https://doi.org/10.1016/S2468-2667(17)30118-4. *The exact point estimate and CI for depression specifically could not be retrieved from open sources — unverified.*

The number that actually bounds the hypothesis is the population-attributable risk proportion. Kessler et al. (2010), *British Journal of Psychiatry* (WHO World Mental Health Surveys, 21 countries, 12 childhood adversities, 20 DSM-IV disorders) estimated that **eradicating childhood adversities would reduce mood disorders by 22.9%, anxiety disorders by 31.0%, and all disorders by 29.8%** — https://doi.org/10.1192/bjp.bp.110.080499. So even the strongest "pile-up" pathway, fully eliminated, leaves ~70% of disorder standing.

**Model status.** Diathesis-stress / biopsychosocial framing remains the field's working model, but the simple linear "stress accumulates → disorder" version is not how the field states it. Kessler et al. themselves report the associations are **subadditive** — adversities interact rather than sum — which directly falsifies the naive accumulation model. Prospective rumination research shows the *processing style* applied to stress matters as much as the stress (Nolen-Hoeksema, Wisco & Lyubomirsky 2008, *Perspectives on Psychological Science*, https://doi.org/10.1111/j.1745-6924.2008.00088.x).

**"Unaddressed emotional buildup":** I found no meta-analysis, review, or trial that treats this as a named causal pathway or estimates its variance contribution. The nearest evidenced constructs are rumination, emotion differentiation, and expressive suppression — and rumination points the *opposite* way (see §5). **Unverified as a causal mechanism.**

**Serotonin debate — relevance only.** Moncrieff et al. (2022), *Molecular Psychiatry*, https://doi.org/10.1038/s41380-022-01661-0 concluded there is no consistent evidence linking serotonin to depression. It drew substantive published rebuttals: Jauhar et al., "A leaky umbrella has little value", https://doi.org/10.1038/s41380-023-02095-y, and a further reply, https://doi.org/10.1038/s41380-023-02093-0. The takeaway for Xolace is *epistemic*, not mechanistic: the field's single most-repeated causal story turned out to be contested enough to trigger a public fight among specialists. Any confident single-cause claim from a consumer app — chemical or emotional — is a liability.

---

## 2. Does upstream prevention reduce incidence?

**Yes, modestly, and it fades.**

- van Zoonen et al. (2014), *International Journal of Epidemiology* — meta-analysis of prevention trials: incidence rate ratio **0.79 (95% CI 0.69–0.91)**, i.e. a 21% reduction in depression onset, **NNT = 20**. No significant difference between universal, selective, or indicated prevention, or between CBT/IPT/other. https://pubmed.ncbi.nlm.nih.gov/24760873/
- The strongest design available — individual participant data, 30 RCTs, 7,201 adults with subthreshold symptoms (*The Lancet Psychiatry*, 2024, https://doi.org/10.1016/S2215-0366(24)00316-X) — found incidence rate ratios of **0.57 post-treatment, 0.58 at 6 months, 0.67 at 12 months, and no significant effect at 24 months.** Benefit was larger for people with no prior psychotherapy and higher baseline symptoms.

**Durability is the weak point.** The 24-month null means the honest claim is *delay and short-horizon reduction*, not *prevention* in the everyday sense.

**Universal / school-based programmes: mixed to poor.**

- Werner-Seidler et al. (2021), *Clinical Psychology Review* — 118 trials, 45,924 participants: **g = 0.21 (depression), g = 0.18 (anxiety)** post-intervention, small effects persisting to 12 months; **targeted** programmes outperformed **universal** ones for depression. https://doi.org/10.1016/j.cpr.2021.102079
- MYRIAD (Kuyken et al. 2022, *Evidence-Based Mental Health*) — 84 secondary schools, 8,376 students aged 11–13, school-based mindfulness vs teaching as usual: **no benefit at 1 year.** SMD 0.005 (95% CI −0.05 to 0.06) for depression risk; 0.02 (−0.02 to 0.07) social-emotional-behavioural functioning; 0.02 (−0.03 to 0.07) wellbeing. https://pmc.ncbi.nlm.nih.gov/articles/PMC9340028/

MYRIAD is the most important single result in this memo for Xolace: a well-designed, well-funded, plausible upstream intervention delivered at scale to a general population produced **nothing**. Universal delivery of a "good for everyone" emotional skill is exactly the shape of Xolace's bet.

---

## 3. Emotion labeling and affect labeling

**Lab-level effects: real.** Torre & Lieberman (2018), *Emotion Review* 10(2):116–124, https://doi.org/10.1177/1754073917742706 review affect labeling across experiential, autonomic, neural and behavioural domains and frame it as *implicit* emotion regulation — it works without feeling like regulation, and participants generally don't expect it to work.

**One good clinical translation.** Kircanski, Lieberman & Craske (2012), *Psychological Science* 23(10):1086–1091, https://doi.org/10.1177/0956797612443830: spider-fearful participants who labelled their affect during exposure showed reduced skin-conductance response at a 1-week posttest with a different spider, and more negative-emotion words used predicted greater reduction and more exposure steps completed. Note the scope: a single-session laboratory exposure paradigm, small samples, physiological outcome — **not symptom remission and not onset prevention.**

**Emotion differentiation.** Higher negative-emotion differentiation is associated concurrently and prospectively (~1.5 years) with lower depression symptoms and appears to buffer the brooding→depression link (Kashdan, Barrett & McKnight 2015, *Current Directions in Psychological Science*, https://doi.org/10.1177/0963721414550708; Starr et al. reviewed in Nook 2021, *Frontiers in Psychology*, https://doi.org/10.3389/fpsyg.2021.700298). These are observational associations, not causal demonstrations, and directionality is unresolved — depression itself degrades granularity.

**Expressive writing.** Frattaroli (2006), *Psychological Bulletin* 132(6):823–865 — 146 randomised studies — average **r = .075**. That is a very small effect, roughly d ≈ 0.15. It is significant and cheap, and larger for people facing traumatic or recurring health stress, but it is not a large-effect intervention. https://doi.org/10.1037/0033-2909.132.6.823

**Bottom line for §3:** naming emotions has measurable short-term effects on physiology and self-report. **No study shows that emotion labeling prevents onset of a mental disorder.** That link is entirely unevidenced.

---

## 4. Digital mental health evidence base

- Linardon et al. (2024), *World Psychiatry* — 176 RCTs: depression **g = 0.28** (N=33,567, NNT 11.5); generalised anxiety **g = 0.26** (N=22,394, NNT 12.4). Larger effects for CBT-based apps, chatbot features, and mood monitoring. **Inactive control groups produced larger effects**, consistent with a digital placebo. https://doi.org/10.1002/wps.21183
- Kulke et al. (2025), *The Lancet Digital Health* — 72 RCTs, 21,702 participants, **standalone (unguided) apps specifically**: depression g **0.45** (95% CI 0.30–0.60); anxiety **0.35** (0.22–0.48); sleep **0.71** (0.51–0.92); PTSD **0.15** (0.02–0.28). No meaningful effects for smoking, self-injury, suicidal ideation, or alcohol misuse. Critically: **publication-bias adjustment cut depression and anxiety effects to g = 0.18 each.** Conclusion: standalone apps "might be offered … **if no evidence-based first-line intervention is available**" — i.e. positioned as fallback. https://doi.org/10.1016/j.landig.2025.100923
- **Real-world engagement is the binding constraint.** Baumel et al. (2019), *JMIR* 21(9):e14567 — 93 popular mental health apps, panel usage data: median **15-day retention 3.9%**, **30-day retention 3.3%**. Peer support (8.9%) and trackers (6.1%) did best at day 30; breathing-exercise apps 0.0%. https://doi.org/10.2196/14567
- **Harms are barely measured.** Linardon et al. (2024), *npj Digital Medicine* — only **55 of 171** mental health app trials reported adverse events at all; pooled deterioration rate 6.7% (95% CI 4.3–10.1), not different from controls (OR 0.79, 95% CI 0.62–1.01). https://doi.org/10.1038/s41746-024-01388-y
- **Regulatory posture.** NICE's Early Value Assessment programme conditionally admits digital mental health technologies to the NHS *while evidence is generated*, explicitly because the evidence base is immature; each EVA ships with an evidence-generation plan and a ~3-year review horizon (e.g. NICE HTE3, https://www.nice.org.uk/guidance/hte3; NICE HTE9, https://www.nice.org.uk/guidance/hte9).

---

## 5. Harms and counter-evidence (the strongest case against)

**Rumination.** Baseline rumination prospectively predicts increases in depressive symptoms *and onset of depressive disorders*; rumination worsens negative thinking, impairs problem-solving and erodes social support (Nolen-Hoeksema, Wisco & Lyubomirsky 2008, *Perspectives on Psychological Science*, https://doi.org/10.1111/j.1745-6924.2008.00088.x). A product whose core loop is "dwell on and elaborate what you feel" sits uncomfortably close to the best-documented cognitive risk factor for depression. The distinction that matters is *processing mode* (concrete/specific vs abstract/repetitive), and it is not automatic.

**Co-rumination.** Rose, Carlson & Waller (2007), *Developmental Psychology* 43(4):1019–1031 — co-rumination prospectively predicted **increases** in depressive and anxiety symptoms **and** increases in positive friendship quality, especially for girls. https://doi.org/10.1037/0012-1649.43.4.1019. This is the direct counter-evidence to peer-sharing features: the thing that makes users feel closer is the same thing that raises symptoms.

**Psychological debriefing — the cautionary precedent.** Rose, Bisson, Churchill & Wessely (2002), Cochrane Database of Systematic Reviews, CD000560: no consistent evidence that single-session debriefing prevents PTSD, and **two trials with longer follow-up reported adverse effects**; the review concluded debriefing is "either equivalent to, or worse than, control or educational interventions." https://doi.org/10.1002/14651858.CD000560. Debriefing was intuitive, well-intentioned, widely adopted, and net-harmful. It is the closest structural analogue to "get people to process the feeling early, before it escalates."

**Prevalence inflation / concept creep.** Foulkes & Andrews (2023), *New Ideas in Psychology* 69:101010 — awareness efforts may raise reported prevalence via (a) improved recognition and (b) **overinterpretation of normative distress as disorder**, with labelling potentially acting as a self-fulfilling prophecy. https://doi.org/10.1016/j.newideapsych.2023.101010. Note honestly: this is a *hypothesis paper with a call for testing*, not a demonstrated effect; a follow-up refines it (Foulkes & Andrews 2024, *New Ideas in Psychology*, https://doi.org/10.1016/j.newideapsych.2024.101086). The risk to Xolace is specific: a product that teaches emotional vocabulary and pattern-detection is, mechanically, an awareness intervention.

**Delayed help-seeking.** Reviews and commentary raise this concern, but I found **no controlled evidence** that self-help apps delay clinical help-seeking. **Unverified.** Do not cite it as established, in either direction — including as a reason to dismiss it.

---

## 6. The access/queue frame

**Treatment gap is real and large.** Thornicroft et al. (2017), *British Journal of Psychiatry* 210(2):119–124 — WHO World Mental Health Surveys, 21 countries: only **1 in 5** people with major depressive disorder in high-income countries and **1 in 27** in low-/lower-middle-income countries received minimally adequate treatment. https://doi.org/10.1192/bjp.bp.116.188078

**But the queue is not the whole problem.** Andrews et al. (2004), *British Journal of Psychiatry* 184:526–533 — population modelling across 10 mental disorders: optimal treatment at *current* coverage would avert ~20% of burden; **even at 100% coverage, ~60% of the burden was judged unavertable given present knowledge.** https://doi.org/10.1192/bjp.184.6.526

That single finding both helps and hurts Xolace. It helps: treatment alone provably cannot solve this, so there *is* a legitimate non-clinical lane. It hurts: it also means the bulk of burden is not sitting in a queue waiting for either treatment or prevention, and "never needed the system" is not a coherent success metric for most of it.

**Does upstream intervention reduce downstream service demand?** I found **no** modelling or trial evidence answering this for digital pre-clinical tools. **Unverified.** This is the single biggest empirical hole in the strategy.

---

## What Xolace can and cannot claim

Literal copy guidance. Left column is defensible against the sources above. Right column would overstate.

| Defensible | Overstates the evidence |
|---|---|
| "Mental health is shaped by genes, circumstances and experience — no single cause explains it." | "Mental illness isn't something you're born with — it's things that piled up." |
| "Childhood adversity and chronic stress are among the best-evidenced contributors to later mental health problems." | "Most disorders are caused by unprocessed emotional experience." |
| "Naming what you feel has measurable short-term effects on stress responses in lab studies." | "Naming your feelings prevents depression." / "Emotional awareness stops problems before they start." |
| "Early psychological support can reduce and delay the onset of depression in people with early symptoms — effects are modest and fade over about two years." | "Xolace prevents mental illness." |
| "Xolace is not treatment, not diagnosis, and not a substitute for professional care." | "Xolace means you may never need the mental health system." |
| "Most people who need mental health care don't get it — 1 in 5 in high-income countries receive minimally adequate treatment for depression." | "Xolace closes the treatment gap." / "Xolace reduces demand on services." |
| "Apps like this show small but real average benefits in trials; most of the evidence is short-term." | "Clinically proven." / "Backed by science." (unqualified) |
| "We help you notice patterns in what you're carrying." | "We detect risk." / "We catch problems before they become disorders." |
| "If what you're carrying feels bigger than this, here's how to reach real help." | (any framing where using Xolace is positioned as an alternative to care) |

Two hard rules that follow from §5: never use language that encourages repetitive dwelling ("sit with it until it makes sense", "go over it again"), and never frame normal distress in diagnostic vocabulary. Both are documented harm mechanisms, not stylistic preferences.

---

## Open questions / what evidence we'd need

To move the hypothesis from plausible to supportable, Xolace would have to measure, in its own product:

1. **Does the loop reduce symptoms, at what effect size, against an active control?** An unguided app benchmarked against a credible active comparator — not a waitlist. Note that inactive controls inflate effects (Linardon 2024) and publication-bias correction halves them (Kulke 2025); an internal pre-post number is worth roughly nothing.
2. **Retention against the real-world benchmark.** Day-15 and day-30 retention vs Baumel's 3.9% / 3.3% medians. If Xolace can't clear that, no efficacy claim matters.
3. **Rumination discrimination.** Instrument whether sessions produce concrete/specific processing or abstract repetitive processing (RRS brooding vs reflection subscales). A rising brooding score in heavy users would be a genuine harm signal.
4. **Prevalence inflation check.** Track whether extended use increases self-labelling and symptom endorsement independent of distress. This is testable and nobody has done it — it would be publishable.
5. **Help-seeking direction.** Measure whether users go on to seek professional care more or less than matched non-users. Currently unknown in either direction.
6. **Adverse events, reported.** 116 of 171 app trials didn't report AEs at all. Reporting them credibly is cheap differentiation.

**A clinical advisor review should cover:** crisis-detection sensitivity and escalation paths; whether any copy constitutes an implied diagnostic or preventive claim (regulatory exposure — see FDA digital health and NICE EVA framing); the rumination risk in the core loop and peer-reflection surfaces specifically; safeguarding for minors; and whether the product's outcome claims would survive an EVA-style evidence-generation plan.

---

## Sources

- Sullivan PF, Neale MC, Kendler KS (2000). Genetic epidemiology of major depression: review and meta-analysis. *Am J Psychiatry* 157(10):1552–62. https://doi.org/10.1176/appi.ajp.157.10.1552
- Howard DM et al. (2019). Genome-wide meta-analysis of depression identifies 102 independent variants. *Nature Neuroscience* 22:343–352. https://doi.org/10.1038/s41593-018-0326-7
- Hughes K et al. (2017). The effect of multiple adverse childhood experiences on health. *Lancet Public Health* 2(8):e356–e366. https://doi.org/10.1016/S2468-2667(17)30118-4
- Kessler RC et al. (2010). Childhood adversities and adult psychopathology in the WHO World Mental Health Surveys. *Br J Psychiatry* 197(5):378–385. https://doi.org/10.1192/bjp.bp.110.080499
- Moncrieff J et al. (2022). The serotonin theory of depression: a systematic umbrella review. *Molecular Psychiatry*. https://doi.org/10.1038/s41380-022-01661-0
- Jauhar S et al. (2023). A leaky umbrella has little value. *Molecular Psychiatry*. https://doi.org/10.1038/s41380-023-02095-y
- van Zoonen K et al. (2014). Preventing the onset of major depressive disorder: a meta-analytic review. *Int J Epidemiol* 43(2):318–329. https://pubmed.ncbi.nlm.nih.gov/24760873/
- (2024). Psychological interventions to prevent the onset of major depression in adults: systematic review and IPD meta-analysis. *Lancet Psychiatry*. https://doi.org/10.1016/S2215-0366(24)00316-X
- Werner-Seidler A et al. (2021). School-based depression and anxiety prevention programs: updated systematic review and meta-analysis. *Clin Psychol Rev* 89:102079. https://doi.org/10.1016/j.cpr.2021.102079
- Kuyken W et al. (2022). MYRIAD cluster randomised controlled trial. *Evid Based Ment Health* 25:99–109. https://pmc.ncbi.nlm.nih.gov/articles/PMC9340028/
- Torre JB, Lieberman MD (2018). Putting feelings into words: affect labeling as implicit emotion regulation. *Emotion Review* 10(2):116–124. https://doi.org/10.1177/1754073917742706
- Kircanski K, Lieberman MD, Craske MG (2012). Feelings into words. *Psychological Science* 23(10):1086–1091. https://doi.org/10.1177/0956797612443830
- Kashdan TB, Barrett LF, McKnight PE (2015). Unpacking emotion differentiation. *Curr Dir Psychol Sci* 24(1):10–16. https://doi.org/10.1177/0963721414550708
- Nook EC (2021). Emotion differentiation and youth mental health. *Front Psychol* 12:700298. https://doi.org/10.3389/fpsyg.2021.700298
- Frattaroli J (2006). Experimental disclosure and its moderators: a meta-analysis. *Psychol Bull* 132(6):823–865. https://doi.org/10.1037/0033-2909.132.6.823
- Linardon J et al. (2024). Current evidence on the efficacy of mental health smartphone apps: meta-analysis of 176 RCTs. *World Psychiatry* 23(1):139–149. https://doi.org/10.1002/wps.21183
- Kulke JK et al. (2025). Efficacy of standalone smartphone apps for mental health: updated systematic review and meta-analysis. *Lancet Digital Health*. https://doi.org/10.1016/j.landig.2025.100923
- Baumel A et al. (2019). Objective user engagement with mental health apps. *J Med Internet Res* 21(9):e14567. https://doi.org/10.2196/14567
- Linardon J et al. (2024). Adverse events in clinical trials of mental health apps. *npj Digital Medicine*. https://doi.org/10.1038/s41746-024-01388-y
- NICE. Guided self-help digital CBT for children and young people: early value assessment (HTE3). https://www.nice.org.uk/guidance/hte3
- NICE. Digitally enabled therapies for adults with anxiety disorders: early value assessment (HTE9). https://www.nice.org.uk/guidance/hte9
- Nolen-Hoeksema S, Wisco BE, Lyubomirsky S (2008). Rethinking rumination. *Perspect Psychol Sci* 3(5):400–424. https://doi.org/10.1111/j.1745-6924.2008.00088.x
- Rose AJ, Carlson W, Waller EM (2007). Prospective associations of co-rumination with friendship and emotional adjustment. *Developmental Psychology* 43(4):1019–1031. https://doi.org/10.1037/0012-1649.43.4.1019
- Rose S, Bisson J, Churchill R, Wessely S (2002). Psychological debriefing for preventing PTSD. *Cochrane Database Syst Rev* CD000560. https://doi.org/10.1002/14651858.CD000560
- Foulkes L, Andrews JL (2023). Are mental health awareness efforts contributing to the rise in reported mental health problems? *New Ideas in Psychology* 69:101010. https://doi.org/10.1016/j.newideapsych.2023.101010
- Thornicroft G et al. (2017). Undertreatment of people with major depressive disorder in 21 countries. *Br J Psychiatry* 210(2):119–124. https://doi.org/10.1192/bjp.bp.116.188078
- Andrews G, Issakidis C, Sanderson K, Corry J, Lapsley H (2004). Utilising survey data to inform public policy: comparison of the cost-effectiveness of treatment of ten mental disorders. *Br J Psychiatry* 184:526–533. https://doi.org/10.1192/bjp.184.6.526
