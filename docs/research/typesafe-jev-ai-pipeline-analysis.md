# TypeSafe Jev across Xolace's AI pipeline: a full analysis

**Status:** Research only. No code was changed and nothing here is decided. Written 2026-09-25 against `205ddd9`.
**Scope:** Every place the codebase calls a model, embeds text, moderates, or classifies. Each one is judged on its merits. The repo's own rules (the Cognition Layer constitution, "all model calls live under `convex/ai/`", "hot path stays deterministic") are set aside here, as the brief asked. Where a proposal collides with one of those rules, the collision is noted and the proposal still stands on its merits.
**Relation to `docs/research/typesafe-jev-for-ai-pipeline.md`:** that earlier note is narrower. It covers six pipeline steps and treats the constitution as binding. This file is a superset and sometimes reaches different conclusions. Two examples: it recommends Jev for the crisis lanes as a *layer* under a labeled eval, and it finds several gaps the first note missed (see §6).

---

## 0. TL;DR

1. **Jev is a judgment engine, not a writer.** The article-length outputs in Xolace are the mirror, distilled reflections, quotes, notification copy, follow-up cards, bridge drafts, the vent acknowledgement, the profile narrative and the kindling `why` lines. Jev replaces **none** of them. It *can* gate, verify and route every one of them.
2. **The best fits are the calls that are already "one Haiku call, N atomic questions, hand-parsed JSON".** Two stand out. The first is the **Xolacer DM moderation classifier** (`convex/ai/chat/classify.ts:54-119`), where four questions share one self-reported confidence and a parse failure silently becomes "no crisis". The second is the **emotion classifier's judgment fields** (`convex/ai/prompts/classifier.ts:28-155`).
3. **Jev's ~100 ms latency could reopen a design the team rejected.** The DM *pre-delivery* lane was rejected because "a 1.5–5 s fail-open window cannot host a model call" (`CONTEXT.md:300`). A roughly 100 ms judgment call might fit that window. This is a new capability, not just a cost saving.
4. **The crisis lanes have gaps worth fixing whether or not Jev is adopted** (§6):
   - The reflect safeguard's "high intensity + distress emotion" rules compare against emotion words that the classifier can never emit (`safeguard.ts:105-122` against `understandingVocab.ts:8-22` and `anthropic.ts:135-137`).
   - Moderation outages fail open on the reflect hot path (`process.ts:143-145`, `moderation.ts:45-49`).
   - The vent pipeline only runs a crisis check on transcripts that contain one of 8 literal keywords (`vent.ts:115-124`, `vent.ts:255-263`).
   - DM moderation turns any parse failure into "no crisis" (`classify.ts:98-107`).

   Jev is a good *second, independent* detector for all of these. It should run in shadow first, and it should not replace anything until it clears a labeled eval.
5. **Calibration is the pitch, and it is unproven for this domain.** TypeSafe says its models are "trained for calibrated decisions". It publishes no reliability numbers (no ECE, no reliability diagrams), and it says outright that thresholds are domain-specific ([system-one](https://docs.typesafe.ai/concepts/system-one.md), [ml primer](https://docs.typesafe.ai/introduction/machine-learning-primer.md), [confidence](https://docs.typesafe.ai/confidence.md)). Treat calibration on crisis text as a hypothesis to measure.
6. **Privacy is the gating question, not engineering.** The DPA does not address health or special-category data ("Sensitive data transferred … N/A"). The published documents mention neither HIPAA nor a BAA. Retention is "as long as necessary". Zero data retention is available only to enterprise customers through sales ([models](https://docs.typesafe.ai/models.md), [DPA](https://typesafe.ai/legal/data-processing), [privacy policy](https://typesafe.ai/legal/privacy-policy)). Sending raw reflection text to a new processor needs a signed ZDR agreement and a DPA amendment first.
7. **Suggested first experiment:** a shadow-mode Jev battery on the Xolacer DM lane plus the reflect crisis questions. Log only verdicts, never text. Compare against the existing verdicts and the existing labeled eval cases. Details are in §8.

---

## 1. What Jev is: verified facts vs. vendor claims

All claims below come from TypeSafe's own docs, fetched 2026-09-25. **Nothing about Jev's accuracy was independently verified in this pass.** No API key was used and no calls were made. "Documented" means TypeSafe states it. "Measured (vendor)" means TypeSafe reports a number from its own cookbook.

### 1.1 Contract (documented)

| Fact | Source |
|---|---|
| `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer`, body `{state, model, questions}` | [api](https://docs.typesafe.ai/api.md) |
| `state` is a string, a JSON object, or an array of text. Text only: no image, audio or video | [models](https://docs.typesafe.ai/models.md), [state](https://docs.typesafe.ai/concepts/state.md) |
| **Choice** takes 1–255 options and returns `choice`, `probabilities` and `confidence` | [api](https://docs.typesafe.ai/api.md), [choice](https://docs.typesafe.ai/primitives/choice.md) |
| **Score** takes 2–10 ordered levels. `score` is the probability-weighted level index, so it can be fractional. It also returns `legend`, `probabilities` and `confidence` | [score](https://docs.typesafe.ai/primitives/score.md) |
| **Noul** returns `noul` = P(true). It has no confidence field. `criteria.true/false` are optional | [api](https://docs.typesafe.ai/api.md), [noul](https://docs.typesafe.ai/primitives/noul.md) |
| Confidence is a statistic of how peaked the distribution is, e.g. `(3 × max − 1)/2` for 3 options. It is **not** a separate calibrated estimate | [confidence](https://docs.typesafe.ai/confidence.md) |
| Model `jev-1.13.0`. Aliases `jev-latest` and `jev-preview` both point to 1.13.0. Pin the versioned id to stay stable | [models](https://docs.typesafe.ai/models.md) |
| $0.042 per M **input** tokens. **Output tokens are free** | [models](https://docs.typesafe.ai/models.md) |
| Context: 64k tokens per request, 32k for `state` plus the longest question | [models](https://docs.typesafe.ai/models.md) |
| Rate limits: 250k tokens/s and 1,200 req/min, "adjusting dynamically" | [models](https://docs.typesafe.ai/models.md) |
| Errors: 401, 422, 429, 529. The SDKs back off automatically | [api](https://docs.typesafe.ai/api.md) |
| JS SDK `@typesafe-ai/sdk`, **Node 20+**. It is unverified whether it runs in Convex's default V8 runtime. Raw `fetch` works there, and the repo's own rules confirm `fetch` needs no `"use node"` | [sdk/javascript](https://docs.typesafe.ai/sdk/javascript.md) |
| "Questions are evaluated independently and in parallel. One primitive's result does not become hidden context that changes another primitive's result" | [how-to-build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md) |
| "System One models do not write replies, produce code, or generate explanations of their reasoning" | [system-one](https://docs.typesafe.ai/concepts/system-one.md) |

### 1.2 Vendor claims, checked against what the docs actually say

| Claim in the brief | What the docs actually say | Verdict |
|---|---|---|
| ~150 ms latency | "Most queries complete in about **100 ms**" ([how-to-build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md)). Measured (vendor): **111 ms** per query against 1.1–13.9 s for the LLMs compared ([consistency_noul](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md)). A 13-question batch over a ~54k-character document took 0.27 s ([parallel_questions](https://docs.typesafe.ai/cookbooks/parallel_questions.md)). [models](https://docs.typesafe.ai/models.md) gives no latency SLA | Plausible. **No SLA.** Our number must be measured from Convex's region, since TypeSafe is US-hosted ([privacy policy](https://typesafe.ai/legal/privacy-policy)) |
| "100x cheaper" than LLMs | Stated as a **target**: "greater than 100× intelligence-to-speed-and-cost ratio" ([how-to-build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md)). Measured (vendor): about **1/25 to 1/800** of the cost of the LLM configurations compared ([consistency_noul](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md)) | Order of magnitude is plausible. For our shapes, see §1.3 |
| Adding questions barely changes latency or cost | "Adding questions barely changes the response time" ([introduction](https://docs.typesafe.ai/introduction.md)). Batching 13 questions was "12.2x cheaper, 10.0x faster" than 13 separate calls, because the shared state is billed once. The vendor notes the speed gain shrinks if you compare against *concurrent* single calls ([parallel_questions](https://docs.typesafe.ai/cookbooks/parallel_questions.md)) | Holds for *cost* when the state dominates the tokens. Each question's instructions and criteria are still input tokens |
| Calibrated probabilities | "trained for calibrated decisions … Calibration is measured across groups of predictions; it does not guarantee that an individual answer is correct" ([system-one](https://docs.typesafe.ai/concepts/system-one.md)). **No ECE or reliability data is published** ([ml primer](https://docs.typesafe.ai/introduction/machine-learning-primer.md)) | **Unverified.** Must be measured on our data |
| No context rot between questions | See the independence quote above. Separately, "Accuracy falls as the state grows with content unrelated to the decision" ([jev-1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md)) | Questions don't contaminate each other, but a **bloated state still hurts**. Keep state minimal |
| Stable answers | Mean per-question probability SD **0.0102** across 15 repeats, below every LLM condition tested. The most variable answer still ranged 0.43–0.53 and crossed its 0.5 threshold ([consistency_noul](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md)) | Better than LLM self-reports, but not deterministic at the threshold. Use uncertainty bands, not a single cut |
| English-primary | "English is the primary training language and where accuracy is currently best"; other languages "not equally well" ([models](https://docs.typesafe.ai/models.md), [state](https://docs.typesafe.ai/concepts/state.md)) | Real constraint. See open question Q3 |

### 1.3 Documented weaknesses that matter for us ([jev-1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md))

- **Literal reading.** "Scoping words, negations, and implied conditions are read at face value." This is directly relevant to crisis text ("I'm not going to do anything stupid, I just want it to stop"). It must be an eval category.
- **Adversarial content.** State is not treated as hostile, so injected instructions can move outputs. This matters for DMs, where one user's text is judged on another user's behalf, and for anything that verifies model output.
- **No counting, no math, no date comparison.** Keep thresholds, windows and counts in code. The codebase already does this.
- **Complex indirection and double negatives** degrade answers. Write questions positively ("Does the sender express intent to…"), not negatively ("Is it not the case that…").
- **Contradictory instructions and criteria** degrade answers. Each question must be atomic. This matches the docs' main design rule: "Break broad judgments into narrow, typed questions" ([how-to-build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md)).

### 1.4 Rough cost comparison for our shapes

These are estimates, not measurements. Token counts are rough reads of the prompt sizes in the files cited. Pricing: Haiku 4.5 at $1/M input and $5/M output; Sonnet 4.6 at $3/M input and $15/M output; Jev at $0.042/M input with free output ([models](https://docs.typesafe.ai/models.md)).

| Call | Today (approx.) | Jev equivalent (approx.) |
|---|---|---|
| Emotion classifier (`classifier.ts` system prompt ~2.5k tokens, plus pattern summary and input, 512 max out) | ~3k in / ~250 out on Haiku ≈ **$0.004 per session** | State ~0.5k plus ~10 questions × ~150 tokens ≈ 2k in ≈ **$0.00008**. Only if the whole call is replaced, which it can't be (§4.A) |
| DM moderation (`classify.ts` ~600-token system, 200 max out) | ≈ **$0.0015 per message** on Haiku | ≈ **$0.00005** |
| Episodic rerank (new) | n/a | 3–8 candidates × ~300 tokens ≈ **$0.0001** |

Per call, Jev is roughly 30–80× cheaper than Haiku here. At Xolace's current volume, `aiMirrorRequest` is capped at 8/hour per user (`convex/lib/rateLimits.ts:47`), so **cost is not the strongest argument**. The strongest arguments are latency (it opens real-time surfaces), typed output (no parsing failure modes), and probability distributions (it replaces the self-reported "discrete menu" confidence the team already rejected, `docs/confidence-aware-mirroring.md:119-129`).

---

## 2. Privacy, retention and compliance

This matters for a mental-health app. Here is everything the published documents say, and what they leave out.

| Topic | What exists | Source |
|---|---|---|
| Training on customer data | "Jev is not trained on customer requests or responses". The privacy policy says: "We will not train or fine tune any artificial intelligence or machine learning models on your prompts or other Input." | [models](https://docs.typesafe.ai/models.md), [privacy policy](https://typesafe.ai/legal/privacy-policy) |
| Retention | DPA: retained "for as long as necessary taking into account the purpose of the Processing". Privacy policy: "as long as reasonably necessary". **No concrete retention period for API inputs or logs** | [DPA](https://typesafe.ai/legal/data-processing), [privacy policy](https://typesafe.ai/legal/privacy-policy) |
| Zero data retention | **Enterprise only**, "contact sales@typesafe.ai" | [models](https://docs.typesafe.ai/models.md), [legal](https://docs.typesafe.ai/legal.md) |
| Hosting | "hosted in the United States" | [privacy policy](https://typesafe.ai/legal/privacy-policy) |
| GDPR transfers | EU SCCs Module 2, UK Addendum, Swiss law recognized | [DPA](https://typesafe.ai/legal/data-processing) |
| Sensitive or health data | DPA annex: "Sensitive data transferred (if applicable) … **N/A**". The privacy policy has no health-data provisions | [DPA](https://typesafe.ai/legal/data-processing), [privacy policy](https://typesafe.ai/legal/privacy-policy) |
| HIPAA / BAA | **Not mentioned anywhere** in the legal docs | [legal](https://docs.typesafe.ai/legal.md) |
| SOC 2 / ISO 27001 | **Not mentioned in the docs.** `trust.typesafe.ai` renders client-side and returned no content to the fetcher, so certifications and the subprocessor list **could not be read** | [DPA](https://typesafe.ai/legal/data-processing) → trust.typesafe.ai |
| Subprocessors | Listed at trust.typesafe.ai/subprocessors (unreadable in this pass). 15-day notice and objection window | [DPA](https://typesafe.ai/legal/data-processing) |
| Breach notice | Within 72 h | [DPA](https://typesafe.ai/legal/data-processing) |
| Minors | Does "not knowingly collect … personal data from children under 18" | [privacy policy](https://typesafe.ai/legal/privacy-policy) |

**Assessment.** Xolace already sends raw reflection text to Anthropic (Claude), OpenAI (moderation and embeddings, `convex/ai/providers/moderation.ts:68-78`, `convex/rag.ts:51-55`) and ElevenLabs (vent STT and TTS, `convex/vent.ts:200-346`). Jev would be a fourth processor of the most sensitive text in the product. The minimum bar before any live traffic, including shadow traffic:

- a signed ZDR agreement;
- a DPA annex that names health or special-category data;
- the subprocessor list;
- written confirmation of what is logged (request bodies or not) and for how long.

**Mitigation for shadow mode:** the Understanding pipeline already produces a non-text feature vector (`emotional_metadata`). Some Jev questions can run on *derived* state instead of raw text. Crisis and faithfulness questions cannot; they need the words.

Separately, a hygiene issue Jev would not create but worth noting: raw user text and model outputs are already written to Convex function logs.
- `console.log("classifier prompt ", classifierPrompt)` includes the raw input (`convex/ai/process.ts:134`).
- `console.log("raw ", raw)` logs the classifier output (`convex/ai/providers/anthropic.ts:116`).
- The pattern summary is logged (`process.ts:114`).
- The moderation result is logged (`safeguard.ts:230`).
- The retry path dumps the raw model output (`convex/ai/cachedActions.ts:81-86`).
- The vent acknowledgement is logged (`convex/vent.ts:281`).

Any Jev integration must not add to this.

---

## 3. Inventory: every AI touchpoint

"Gen" means the call's product is text. "Judge" means its product is a decision. Latency-sensitive means a user is waiting on the call.

| # | Area | File(s) | Provider / model | Produces | Gen/Judge | User waits? |
|---|---|---|---|---|---|---|
| 1 | Emotion classifier | `convex/ai/prompts/classifier.ts:21-195`, `convex/ai/cachedActions.ts:48-93`, parse `convex/ai/providers/anthropic.ts:113-183` | Haiku 4.5 (`anthropic.ts:25`), cached 7 d (`cached.ts:18-29`) | 12-field JSON: emotion, confidence, granular, secondary, intensity, specificity, tags, verbatim phrases, temporal, requiresFollowUp and reason, supportNeed | Mostly judge; 3 fields extractive or generative | **Yes.** It gates the articulator (`process.ts:141-158` → `204-229`) |
| 2 | Input moderation | `convex/ai/providers/moderation.ts:60-104`, `cachedActions.ts:17-46` | OpenAI `omni-moderation-latest` | Category flags and scores | Judge | Yes (parallel with #1) |
| 3 | Safeguard engine | `convex/ai/safeguard.ts:143-530` | none (rule-code over #1 and #2) | none/gentle/elevated/crisis, reject, resources | Judge (rules) | Yes |
| 4 | Claim-strength / mirror plan | `convex/ai/routing.ts:97-138`, `convex/ai/mirrorPlan.ts:46-93` | none (rules) | reaching/holding/measured/confident, exercise pick | Judge (rules) | Yes |
| 5 | Episodic recall (RAG) | `convex/ai/helpers/episodicSearch.ts:46-79`, `convex/rag.ts:51-55`, ingest `convex/episodicMemory.ts:145-180` | OpenAI `text-embedding-3-small` via `@convex-dev/rag` | Top-3 past composites plus cosine `topScore` | Retrieval | Yes |
| 6 | Mirror articulator | `convex/ai/prompts/articulator.ts`, call `process.ts:224-235` | Sonnet 4.6 (`anthropic.ts:28`), 300 max tokens | Mirror prose | **Gen** | Yes (dominant latency) |
| 7 | Mirror refinement ("Not quite" / "Say more") | `convex/ai/clarify.ts:142-345` | Re-runs #1, #2 and #5, then Sonnet | Revised mirror | Gen, plus judge re-run | Yes |
| 8 | Meta-narration guard | `articulator.ts:155-186` | Regex | Fallback trigger | Judge (regex) | Yes |
| 9 | Mirror TTS | `convex/ai/tts.ts:105-133` | ElevenLabs | Audio | Gen (speech) | Async |
| 10 | Exercise slot fill | `convex/ai/slotFill.ts:44-110` | Haiku | 2–6-word phrase (grounded-token check) | Extractive gen | No (scheduled) |
| 11 | Reflection distiller | `convex/ai/prompts/distiller.ts:29-87`, `convex/jobs/reflectionDistiller.ts:15-65` | Haiku, cached 30 d | Anonymized first-person reflection, or `NULL` | **Gen** plus embedded gate | No |
| 12 | Peer pool contribute | `convex/jobs/reflectionAnonymizer.ts:49-79`, `convex/reflections.ts:242-277`, `convex/lib/poolability.ts:19-25` | none | Public reflection row | none | No |
| 13 | Peer matching | `convex/lib/reflectionMatching.ts:15-78`, `convex/reflectionsRag.ts:185-205`, `convex/reflections.ts:32-63` | Embeddings (Plus) and tag cascade | 4 reflections | Retrieval / rules | Yes |
| 14 | Reflection Agent light pass | `convex/ai/reflectionAgent/trigger.ts:41-84`, `prompts/reflectionLight.ts:101-112` | Haiku | Trajectory line | Gen | No |
| 15 | Reflection Agent consolidation | `convex/ai/reflectionAgent/consolidation.ts:36-193`, `tools.ts` | Sonnet tool loop, ≤8 iterations | Semantic profile narrative | Gen (agentic) | No |
| 16 | Calibration ("what lands") | `convex/ai/reflectionAgent/calibration.ts:44-73` | none (rules) | Profile section | Rules | No |
| 17 | Kindling / Paths | `convex/ai/paths/generate.ts:23-167`, `paths/prompt.ts:155-209`, `paths/bind.ts` | Haiku | 3–4 action types (8-entry catalog) plus `why` lines | Judge (pick) plus gen (why) | No |
| 18 | Follow-up card | `convex/followUps.ts:197-264` | Haiku | Card copy | Gen | No |
| 19 | Push notification copy | `convex/ai/generateNotification.ts:29-171`, triggers `convex/jobs/notificationTriggers.ts` | Haiku (≥3 sessions), else templates | ≤120-char lock-screen text | Gen | No |
| 20 | Daily quotes | `convex/ai/quotesDistiller.ts`, `quotesRequest.ts:25-91`, `quotesQuality.ts:47-103`, `loadEmotionalContext` `quotesDistiller.ts:~20` | Haiku, validated by regex/blocklist | Quote plus title | Gen | No (batch) |
| 21 | Trusted Bridge draft | `convex/ai/bridge.ts:253-330` | Sonnet | Message to a real person | Gen | **Yes** |
| 22 | Vent | `convex/vent.ts:115-160`, `213-346`, `convex/ai/ventAcknowledge.ts` | ElevenLabs Scribe STT → keyword+moderation crisis → Haiku → ElevenLabs TTS | 1–2 sentence acknowledgement plus audio | Gen, plus crisis judge | **Yes** |
| 23 | Xolacer DM moderation | `convex/ai/chat/classify.ts:13-119`, `chat/moderate.ts:41-184` | Haiku | crisis level, harassment, spam, contact, confidence | **Judge** | No (post-delivery) |
| 24 | Library "For you" / "Up next" | `convex/library/home.ts:14-70`, `convex/library/next.ts:8-54` | none (facet rules) | Entries | Rules | Yes |
| 25 | Xolacer specialty suggestion | `convex/lib/xolacerSuggestion.ts:102-122` | none (rules) | Specialty | Rules | Yes |
| 26 | Evals | `convex/ai/prompts/__evals__/harness.eval.ts`; 4 labeled suites (chatModeration 17, reach 42, requiresFollowUp 16, supportNeed 11 cases); online `convex/ai/evalMetrics.ts` | Live Haiku | Accuracy gates / confirmation rates | — | — |

The brief asked about "voice/speech". Voice *reflections* enter the classifier as `entryType: "voice"` (`classifier.ts:175-179`). Voice transcripts in DMs live only in Stream (ADR 0011). Jev is text-only ([models](https://docs.typesafe.ai/models.md)), so it can only see transcripts, never audio.

---

## 4. Area-by-area analysis

Format for each area: **Verdict → Proposal (state + questions + consuming logic) → Replaces/augments → Gain → Risks.**
Question sketches use the documented shape `{ type, instructions, criteria }` ([api](https://docs.typesafe.ai/api.md)).

### 4.A Emotion classifier (#1): **Partial, and the strongest augmentation target on the hot path**

**What it does today.** One Haiku call returns 12 fields in hand-parsed JSON. Its known failure modes:

- **Fence and prose stripping.** Haiku appends a hotline note *after* the JSON on crisis input. The comment says this "failed on exactly the input that must not fail" (`anthropic.ts:117-124`).
- **One JSON-repair retry**, then a throw (`cachedActions.ts:59-90`). The throw is *not* caught in `generateMirror` (`process.ts:146-149`, no `.catch`), so a double parse failure **fails the whole session** (`process.ts:423-438`). `clarify.ts:177-179` does catch it.
- **Silent coercion.** An out-of-vocabulary emotion becomes `"confusion"` (`anthropic.ts:135-137`). Missing intensity or specificity becomes 5 (`anthropic.ts:143-144`).
- **Self-reported confidence is a "discrete menu".** 0.72, 0.75 and 0.85 account for 140 of 218 dev rows. The team dropped it from the reach gate for that reason (`docs/confidence-aware-mirroring.md:119-129`; `routing.ts:22-25`).
- **The cache rarely hits.** The cache key includes the full system prompt with the per-user pattern summary (`cached.ts:18-29`, `classifier.ts:154-155`), so it only hits on an identical retry.

**Which fields Jev can own.** The rest cannot move to Jev:

| Field | Jev primitive | Notes |
|---|---|---|
| `primaryEmotion` | **Choice**, 13 options (`understandingVocab.ts:8-22`) | Returns the full distribution. Keep the top-2 for `secondaryEmotion` *only* if the eval shows the runner-up is meaningful |
| `intensity` | **Score**, 5 levels built from the anchors at `classifier.ts:86-100` | Fractional score maps back to 1–10 in code. Don't use the fractional value as an exact magnitude ([jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md), "Math Score Interpolation") |
| `specificity` | **Score**, 3–5 levels built from `classifier.ts:102-107` | Feeds the reach gate (`routing.ts:120`) |
| `temporalContext` | **Choice** past/present/future/unclear | |
| `thematicTags` | **Noul per tag** (17 tags, `understandingVocab.ts:24-42`), keep those with p ≥ τ | Speculative fan-out is the documented pattern ([fan-out](https://docs.typesafe.ai/patterns/fan-out.md)) |
| `requiresFollowUp` | **Noul** with the true/false criteria from `classifier.ts:123-135` | Has a 16-case eval |
| `supportNeed` | **Choice** none/light/active | Has an 11-case eval |
| `granularLabel` | **Choice conditioned in code on `primaryEmotion`.** One Choice per primary emotion, all sent speculatively, then pick the one matching the primary. This is the hierarchical pattern ([hierarchical_classification](https://docs.typesafe.ai/cookbooks/hierarchical_classification.md)) | Requires turning the open vocabulary into a **closed one**. That is a product decision (see §6.1 for why it matters for safety) |
| `userLanguageTags` (verbatim phrases), `followUpReason` (prose) | **Not Jev.** Extraction and generation | Stay on Haiku, or become a cheap rule (below) |

**Proposal.**

```
state = {
  entry_type: "free_text" | "texture_words" | "body_areas" | "voice_transcript",
  time_of_day: "late_night",
  text: "<raw input>"
}
```

Deliberately *leave out* the pattern summary: "accuracy falls as the state grows with content unrelated to the decision" ([jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md)). The classifier prompt itself says "Classify THIS input on its own merit" (`classifier.ts:146`).

Questions: one request with about 25 questions (13-way Choice, 2 Scores, 17 tag Nouls, 3 more). The docs say added questions cost little extra latency ([fan-out](https://docs.typesafe.ai/patterns/fan-out.md)).

**Architecture options**, in increasing ambition:

1. **Shadow (recommended first).** Run Jev alongside Haiku and log both. Zero behavior change.
2. **Split.** Jev owns the judgment fields. Haiku becomes a small extractor for `userLanguageTags`, `followUpReason` and `granularLabel` if that stays open. The articulator needs `classification`, which includes `userLanguageTags` (used by `buildArticulatorPrompt`, `process.ts:204-222`), so the extractor still sits before the articulator. **This option wins on reliability (typed fields, no JSON failure on crisis text) and calibration, not on latency.**
3. **Jev-only hot path.** Derive `userLanguageTags` in code instead of with a model: a lexicon or noun-phrase heuristic over the input, validated like `slotFill.ts:88-104` already does. The articulator then waits only on Jev (about 100 ms) plus moderation plus RAG. This is the only variant that meaningfully cuts time-to-mirror. The size of the gain depends on the Haiku p50 on this path, **which the repo does not measure today** (`mirror_delivered` has no timing, `process.ts:274-296`). Add timing before deciding.

**Consuming logic.**
- `primaryEmotionConfidence` becomes Jev's `confidence` on the emotion Choice. Unlike today's self-report, it is a continuous function of the distribution ([confidence](https://docs.typesafe.ai/confidence.md)), which removes the "tripwire" objection in `confidence-aware-mirroring.md:121-127`. The threshold must be re-fit: 0.75 in `routing.ts:43` and 0.6 in `mirrorPlan.ts:89` are tuned to Haiku's menu.
- Low `confidence` on specificity is informative in itself: "the state doesn't say enough to place it" ([score](https://docs.typesafe.ai/primitives/score.md)). That is essentially the *definition* of a reach. Consider `reach = specificity ≤ 2 OR (specificity-confidence < c AND !memoryConnected)`, and test it in the existing reach eval (42 cases).

**Gains.** No JSON parse path on crisis text. Continuous confidence. Per-tag probabilities. Cost per call roughly 50× lower (§1.4).

**Risks.**
- Accuracy against Haiku on *subtext* ("I'm so angry at myself" → shame, `classifier.ts:63`) is unknown. System-One-style judgment may be weaker at "read through the surface" questions. **This is the central eval question.**
- English-primary accuracy (Q3).
- The classifier's version stamp (`CLASSIFIER_VERSION`, `anthropic.ts:26`) and every downstream threshold would need re-baselining.

### 4.B Reflect crisis / safeguard (#2, #3): **Partial (a layered second detector), safety-critical**

**What exists today.**
- Crisis detection is **entirely** OpenAI moderation self-harm scores: intent > 0.7 or the instructions flag, or self-harm > 0.5 with intensity ≥ 9 (`safeguard.ts:271-318`). Elevated is self-harm > 0.3 (`safeguard.ts:369`).
- The classifier contributes only intensity and emotion.
- **Moderation failure fails open.** `moderationCache.fetch(...).catch(() => MODERATION_UNAVAILABLE)` (`process.ts:143-145`), and `MODERATION_UNAVAILABLE` is "Unflagged — we don't block the pipeline if moderation is down" (`moderation.ts:41-49`). During an OpenAI outage, no session can reach `crisis` at all.
- The classifier's own emotion-based rules are largely unreachable (§6.1).
- **Survivor-narrative detection** uses a 3-way AND proxy: past-focused, specificity ≥ 6, emotion in a set (`safeguard.ts:197-215`). It decides whether a trauma disclosure is **rejected outright** (`safeguard.ts:234-258`).

**Proposal: a crisis battery, on raw text, every session.**

```
state = { text: "<raw input>" }   // nothing else; the literal-reading and distraction caveats argue for minimal state
questions = {
  si_intent:     { type: "noul",  instructions: "Does the writer say they intend or plan to end their life or seriously harm themselves?" },
  si_passive:    { type: "noul",  instructions: "Does the writer express a wish to be dead, to disappear, or to not wake up, without a stated plan?" },
  self_harm_now: { type: "noul",  instructions: "Does the writer describe currently harming themselves, or harming themselves in the last few days?" },
  means_access:  { type: "noul",  instructions: "Does the writer mention having access to a specific means of self-harm (pills, weapon, height)?" },
  in_danger_now: { type: "noul",  instructions: "Does the writer say someone is harming them or threatening them right now?" },
  survivor_past: { type: "noul",  instructions: "Is the writer recounting harm that was done to them in the past?" },
  hopelessness:  { type: "score", instructions: "How much hopelessness about the future does the writer express?",
                   criteria: ["none", "some discouragement", "strong hopelessness", "states nothing will ever get better"] },
  risk_tier:     { type: "choice", instructions: "Which best describes the writer's current safety?",
                   criteria: { none: "...", gentle: "...", elevated: "...", crisis: "..." } }  // copy the level definitions already written in chat/classify.ts:68-74
}
```

The level definitions in `chat/classify.ts:68-74` are already a well-written rubric. Reuse them so the reflect and DM lanes share one definition of a crisis.

**Layering and consuming logic: OR-escalate, never de-escalate.**

```
jevLevel = max over rules:
  si_intent ≥ T_hi  || means_access ≥ T_hi && si_passive ≥ T_mid      → crisis
  si_passive ≥ T_mid || self_harm_now ≥ T_mid || in_danger_now ≥ T_mid → elevated
  risk_tier.choice == crisis && risk_tier.confidence ≥ c                → crisis
finalLevel = max(existingSafeguardLevel, jevLevel)   // Jev may only RAISE
survivorNarrative = existingProxy || (survivor_past ≥ T_s && in_danger_now < T_low)
  // Jev may only SAVE a disclosure from rejection, never cause one
```

This is the same asymmetry `vent.ts:126-129` already adopts ("Moderation may only DE-escalate a keyword hit, never escalate"), inverted for the second detector.

When OpenAI moderation is unavailable, the Jev battery becomes the primary detector instead of "no detector". That alone closes the fail-open gap.

**Why calibration matters here, and how to use it.** With calibrated P(true), thresholds can be set from **costs**, not vibes. A missed crisis costs far more than an unnecessary resources card. The resources card is non-blocking: `crisis` still delivers a mirror (`process.ts:254-273`, `articulator.ts:300`). So T for crisis should sit where recall on the labeled crisis set is at least 0.98, and precision is whatever that costs. The documented uncertainty-band pattern fits well: 0.30–0.70 → "uncertain" (`consistency_noul` cookbook). For crisis, *uncertain rounds up* to elevated, which only shows support resources. **But calibration is only claimed** ([system-one](https://docs.typesafe.ai/concepts/system-one.md)). The thresholds must come from a reliability curve on Xolace-labeled data, not from the vendor's >0.9 / 0.5–0.9 / <0.5 tiers ([confidence](https://docs.typesafe.ai/confidence.md)).

**What an eval must contain before Jev changes a single verdict.**
- Labeled crisis, elevated and none cases, including passive ideation ("everyone would be better off"), negated statements ("I won't do anything, I just want it to stop"; literal-reading risk), idioms ("I could kill for a coffee", already an anchor in `chatModeration.eval.test.ts`), survivor narratives, and code-switched English.
- Report **false-negative rate on crisis** as the gating metric, and plot a reliability curve.
- The existing 17 chat-moderation cases are a seed, not a sufficient set.

**Replaces:** nothing. **Augments:** `checkCrisis`, `checkElevated`, `isSurvivorNarrative`.
**Gain:** a second independent signal, coverage during OpenAI outages, calibrated knobs.
**Risks:**
- Vendor calibration on crisis text is unknown.
- English only.
- A second vendor for crisis text (§2).
- No explanations. Store the per-question probabilities as `triggerEvidence` (the field exists, `safeguard.ts:39`), which is a *better* audit trail than today's free-text evidence.
- The constitution rule "crisis stays rule-code" (`docs/cognition-layer-architecture.md:31-33`, decision #8 at `:423`) is **respected** by this design: Jev supplies probabilities, and code applies fixed thresholds.

### 4.C Vent crisis check (#22): **Strong fit (as a layer), safety-critical**

**Today.** A check only runs if the transcript contains one of 8 phrases (`vent.ts:115-124`, gate at `vent.ts:257`). Any transcript without those phrases skips the check entirely, and Haiku writes a warm acknowledgement over it. Examples: "I just want to disappear", "I've been saving up my pills", "nobody would even notice". The file's own comment names this failure: "a false negative riffs warmly over suicidal content" (`vent.ts:128`). The keyword gate exists because moderation was treated as the confirmer, not the detector.

**Proposal.** Run the §4.B battery on **every** transcript of 20 characters or more (the existing floor, `vent.ts:243`), in parallel with the Haiku acknowledgement call.
- If Jev says elevated or crisis, discard the acknowledgement and use `CRISIS_FALLBACK` (`vent.ts:19`), or a support variant.
- Keep the keyword+moderation path unchanged as the other arm.
- Final `isCrisis = keywordConfirmed || jevCrisis`.

Latency: Jev (~100 ms) runs inside the Haiku call's window, so the added wall-clock is roughly zero.
Gain: closes the widest false-negative gap found in this review.
Risks: same as §4.B. Voice transcripts from STT carry fillers and repetitions, so include some in the eval.

### 4.D Xolacer DM moderation (#23): **Strong fit; the best first candidate**

**Today.**
- One Haiku call returns 4 answers plus **one** confidence "for the whole verdict" (`classify.ts:58-88`).
- The parser falls back to `QUIET_VERDICT` on anything malformed (`classify.ts:98-107`). A crisis message whose response doesn't parse is recorded as crisis `none`. The comment accepts this: "a missed crisis here is caught by the human the flag queue is for", but the flag queue only receives harassment, spam and contact (`moderate.ts:67`), not crisis.
- Docs and code disagree: `MIN_WORDS = 2` (`classify.ts:35`) but "under 3 words" (`CONTEXT.md:279`).

**Proposal.**

```
state = { sender_role: "seeker" | "listener", message: "<text>" }
questions = {
  crisis:     { type: "choice", criteria: <the 4 definitions at classify.ts:68-74, verbatim> },
  harassment: { type: "noul", instructions: "Is this message hostile toward the other person: insults, threats, sexual advances, or coercion?" },
  spam:       { type: "noul", instructions: "Is the sender selling, recruiting, or asking for money or for an outside program? Recommending Xolace or Xolace+ does not count." },
  contact:    { type: "noul", instructions: "Does the message share or ask for a way to talk outside this app (phone, handle, email, another messaging app)?" }
}
```

The spam instruction above contains a negation, and Jev reads negations literally. Put the exclusion in `criteria.false` instead ([api](https://docs.typesafe.ai/api.md)) and anchor it in the eval. The existing eval already anchors "Xolace+ upsell is not spam".

**Consuming logic.**
- Per-category thresholds with a review band: flag when p ≥ 0.7, and send 0.35–0.7 to a new `review` category. This is the documented guardrail policy shape ([llm_guardrails](https://docs.typesafe.ai/cookbooks/llm_guardrails.md)).
- For crisis: `elevated` resources when P(elevated) + P(crisis) ≥ T. Summing the tail of the distribution is something a single self-reported label can't do.
- No parse path, so no `QUIET_VERDICT` fallback. Keep a network-failure fallback that **retries** rather than recording "none".

**New capability: a pre-delivery lane.** `CONTEXT.md:300` rejected a before-send hook because a 1.5–5 s window "cannot host a model call". At about 100 ms, a pre-delivery Jev check could flag contact leaks and harassment *before* the other person sees the message, and it could attach the resources card on the same render. The product principle "crisis response is a reply, not a block" (`CONTEXT.md:284`) is preserved. Re-verify the Stream hook's actual time budget before committing.

**Gains:** typed per-question probabilities, lower cost per message, no fail-open parse path, and possibly pre-delivery.
**Risks:**
- Adversarial content: a sender can write text aimed at the classifier ([jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md) item 9). Stream's regex lane stays as the backstop.
- The eval (17 cases) must grow first.

### 4.E Mirror articulator (#6, #7): **Poor fit for generation; Partial as an output guardrail**

Jev cannot write the mirror ([system-one](https://docs.typesafe.ai/concepts/system-one.md)). What it can do is check the mirror *after* Sonnet writes it and *before* `deliverMirror` (`process.ts:254`).

Today the only output check is the meta-narration regex (`articulator.ts:167-186`). The articulator prompt carries a long list of rules that nothing verifies at runtime:
- "Never use clinical language or diagnose" (`articulator.ts:127`);
- no advice or reassurance (`:279`);
- on reach turns, exactly one question, no "or", no apology (`:349-358`);
- on holding turns, no question (`:364-369`);
- on crisis, "do not reflect hopelessness back without anchoring" (`:300`).

**Proposal: an output guardrail battery.**

```
state = { user_words: "<raw input>", mirror: "<candidate>", turn: "reaching" | "holding" | "measured" | "confident", safeguard: "crisis" | ... }
questions = {
  clinical:        { type: "noul", instructions: "Does the mirror use clinical or diagnostic language or name a mental-health condition?" },
  advice:          { type: "noul", instructions: "Does the mirror tell the person what to do or offer reassurance that things will be fine?" },
  unsupported:     { type: "noul", instructions: "Does the mirror state a fact about the person's life that is not in user_words?" },   // faithfulness
  meta:            { type: "noul", instructions: "Does the mirror talk about its own instructions, rules, or process?" },          // semantic backup for the regex
  hopeless_echo:   { type: "noul", instructions: "Does the mirror agree that things are hopeless without offering any steadiness?" },  // consumed only when safeguard == crisis/elevated
  asks_question:   { type: "noul", instructions: "Does the mirror ask the person a question?" }                                     // code checks it against the claim-strength contract
}
```

**Consuming logic.**
- Hard fail (clinical ≥ 0.8, meta ≥ 0.8, or hopeless_echo ≥ 0.7 on crisis): regenerate once, then fall back to `FALLBACK_MIRROR` (`process.ts:35`).
- Soft fail: log to PostHog `mirror_delivered` as a property, so rules can be tuned against confirmation rates (`evalMetrics.ts`).
- The "question count" contract is partly checkable in code. Use Jev only for "is this a question" when the text has no `?`.

**Cost to the user:** about 100 ms more on the critical path, after Sonnet. Regeneration on a hard fail would add a full Sonnet call, so measure the hard-fail rate in shadow first.

**Faithfulness** (`unsupported`) is the documented citation-check shape ([citation_check](https://docs.typesafe.ai/cookbooks/citation_check.md)). It is the most valuable of these checks for a product whose promise is "we reflect *your* words", and the most at risk from Jev's literal reading. Eval it.

**Risks:** false positives replace a good mirror with a generic fallback. That is worse than the failure it prevents, the same trade `articulator.ts:162-166` already reasons about. Start log-only.

### 4.F Claim-strength / reach gate (#4): **Partial (inputs only)**

The gate is deterministic code, and it should stay that way on merit, not only because of the constitution: code is cheap, testable and explainable. Jev can improve its *inputs*:
- A continuous emotion confidence replaces the discrete menu (`confidence-aware-mirroring.md:119-129`), so `HIGH_CONFIDENCE` can be re-fit (`routing.ts:43`).
- Specificity confidence as an added reach signal (§4.A).
- `memoryConnected` from a relevance judgment instead of a raw cosine cut (§4.G).

The constant `EPISODIC_CONNECT_FLOOR = 0.35` is explicitly "provisional … not defended as correct" (`confidence-aware-mirroring.md:926-930`).

### 4.G Episodic memory recall (#5): **Strong fit (rerank and relevance)**

**Today.** Top-3 by cosine × importance. Below-floor memories still reach the articulator (`episodicSearch.ts:41-44`). "Connected" is a pure cosine cut at 0.35, and importance is inert in practice (`confidence-aware-mirroring.md:937-941`). Cosine measures topical similarity, not whether a past moment is *the same thing coming back*. That is exactly the question the articulator's recall rules care about (`articulator.ts:192-223`).

**Proposal.** Fetch 6–8 candidates (`limit: 8` instead of 4, `episodicSearch.ts:56`). For each candidate, make one Jev request, or one request with an array state:

```
state = { tonight: "<raw input>", past_moment: "<composite text>" }
questions = {
  same_thread: { type: "noul",  instructions: "Is past_moment about the same situation or relationship as tonight?" },
  same_feeling:{ type: "noul",  instructions: "Does past_moment express the same feeling as tonight?" },
  relevance:   { type: "score", instructions: "How useful is past_moment for understanding tonight?", criteria: ["unrelated", "loosely related", "related", "clearly the same thing returning"] }
}
```

**Consuming logic.**
- Rank by `0.5·same_thread + 0.3·relevance_norm + 0.2·cosine` (composite scoring, [composite-scoring](https://docs.typesafe.ai/patterns/composite-scoring.md)).
- Pass the top 3 to the articulator.
- `memoryConnected = max(same_thread) ≥ T`, which replaces or ANDs with the cosine floor.
- Persist the Jev score next to `episodicTopScore` (`process.ts:332-334`) so the §10 calibration protocol can compare both.

**Evidence (vendor-measured):** on legal retrieval, reranking lifted top-1 from 5% to 18% and top-10 from 38% to 62% over BM25; 1,200 calls cost $0.0645 ([rerank](https://docs.typesafe.ai/cookbooks/rerank_typesafe.md)). That is a different domain against a weaker baseline than embeddings, so treat it as directional only.
**Latency:** run the requests in parallel, about 100–200 ms. RAG is already in the `Promise.all` alongside moderation and the classifier (`process.ts:141-158`), so if the classifier stays on Haiku, this is hidden. The ideal hot-path cost is recall followed by rerank, which is sequential.
**Risks:** composites contain past raw text, so this sends more sensitive text (§2). A rerank also can't surface what the embedding shortlist missed ([rerank](https://docs.typesafe.ai/cookbooks/rerank_typesafe.md) caveat).

### 4.H Peer reflection pool (#11, #12, #13): **Strong fit (pre-publish verification); Partial (matching)**

This is the only place where **one user's text is shown to strangers**. `poolability.ts:8-11` calls it "The single most safety-critical predicate in the product". Today:
- **No content check runs on the text that gets published.** `contribute` inserts `displayText` directly (`reflections.ts:242-277`). Moderation ran on the *raw* input, not on the distilled rewrite.
- Anonymization is trusted to the distiller prompt alone (`distiller.ts:44-49`). Nothing verifies that names or places were actually removed.
- If distillation didn't run or returned NULL, the pool falls back to the **mirror text** (`reflectionAnonymizer.ts:65-69`). The mirror "weaves the user's own words back in" (`articulator.ts:118`), so it may carry identifying details and is written in the AI's second person.
- `result === "NULL"` is a strict equality (`reflectionDistiller.ts:51`). An output of "NULL." or "Null" would be **published as a reflection**.
- Only crisis sessions are excluded (`poolability.ts:23`). Elevated sessions can enter the pool.
- Removal after publication relies on 3 user reports (`reflections.ts:228-239`).

**Proposal: a pre-publish gate in `anonymize` (before `contribute`).**

```
state = { original: "<raw input>", candidate: "<distilledText or mirrorText>" }
questions = {
  identifying:     { type: "noul", instructions: "Does candidate contain a name, place, organization, or a detail that could identify a specific person?" },
  harmful:         { type: "noul", instructions: "Could candidate encourage self-harm or describe a method of self-harm?" },
  crisis_content:  { type: "noul", instructions: "Does candidate express intent to die or to seriously self-harm?" },
  first_person:    { type: "noul", instructions: "Is candidate written in the first person, as the person's own words?" },   // catches mirror fallback
  faithful:        { type: "noul", instructions: "Does candidate express the same feeling as original without adding new emotions?" },
  meaningful:      { type: "noul", instructions: "Would a stranger reading candidate understand what the person feels?" }    // replaces the NULL gate
}
```

**Consuming logic.** Publish only if:
- identifying < 0.2
- harmful < 0.1
- crisis_content < 0.2
- first_person ≥ 0.7
- meaningful ≥ 0.5

These thresholds are strict on purpose: a false negative here harms a stranger and deanonymizes the author. When the gate fails, skip publication silently, since the user already opted in. **Unlike the crisis lanes, a false positive here only costs a pool entry**, so strict thresholds are cheap. That makes this the lowest-risk way to use Jev for a safety decision.

The distiller's `NULL` gate (`distiller.ts:64-68`) can move to a `meaningful` pre-check *before* the Haiku call, which saves the call for inputs that won't qualify. The earlier note's pilot #1 was exactly this, and it is a sound first plumbing test.

**Matching (#13):** the tag cascade plus a ±3 intensity filter (`reflectionMatching.ts:33-78`) is crude. The Plus semantic path is cosine-only (`reflectionsRag.ts:194-203`). A Jev rerank of 8 candidates ("does this reflection express the same feeling as tonight?") is the same pattern as §4.G. Value: medium. It's a retention surface ("I feel this too", `reflections.ts:65`).

### 4.I Reflection Agent (#14, #15, #16): **Poor fit for generation; Partial as verification**

The light pass and consolidation write narrative prose (`trigger.ts:58-84`, `consolidation.ts:131-173`). Jev can't write them. The light-pass parser accepts any non-empty text (`reflectionLight.ts:101-112`), and the profile is injected into the articulator, notification, vent and quote prompts. A bad profile propagates everywhere.

**Proposal.** A verification battery at `createVersion` / `updateTrajectory`:
- **clinical**: diagnoses or condition names;
- **unsupported**: claims not grounded in evidence, with state = the tool results the agent read;
- **identifying**: third-party names.

If a check fails, keep the previous version. Low volume, low latency pressure, modest value. Keep calibration (#16) as rule-code. It is deterministic on outcome counts, and Jev adds nothing there.

### 4.J Kindling / Paths (#17): **Partial**

Haiku picks 3–4 of an 8-entry catalog (`catalog.ts`, 8 `actionType`s) and writes a `why` line for each. Twigs that fail validation are dropped, and fewer than `MIN_TWIGS` survivors means no path at all (`generate.ts:30-33`, `prompt.ts:155-209`).

**Proposal.** Split the pick from the prose. First, one Noul per catalog action: "Given this Understanding, would <action> help this person tonight?". The state is the Understanding row (derived data, so **no raw text is needed**, which is a privacy win). Rank in code and pick the top 3 above T. Then Haiku writes `why` lines only for the chosen types.

Gain: the pick becomes calibrated and loggable, and "no path" drops caused by `unknown_action_type` or `duplicate_action_type` disappear. It adds a round trip, but this path is off the critical path. Modest value overall.

### 4.K Exercise slot fill (#10): **Partial (better as Choice than extraction)**

Haiku extracts a 2–6-word `user_phrase`, then code rejects any token not found in the source (`slotFill.ts:88-104`). Since the answer must already be among known candidates, the task is really **selection**. Generate candidates in code (the `userLanguageTags`, plus n-grams of the mirror), then ask a Jev Choice: "Which phrase best names what the person feels?". Use it only if `confidence ≥ c`, otherwise fall back to `defaultContent` as today. This removes a generative call and its JSON parsing (`slotFill.ts:77-84`). Small value, trivial risk.

### 4.L Notifications (#19) and follow-up cards (#18): **Poor fit for copy; Partial for a lock-screen privacy check; Strong fit for nudge features**

- **Copy** stays on Haiku. The only validation is length ≤ 120 (`generateNotification.ts:129`) and ≤ `MAX_CARD_CHARS` (`followUps.ts:242`).
- **Lock-screen guardrail (new, cheap, and it matters).** Push text shows on a lock screen. Add a Noul: "Would someone glancing at this notification learn something private about the person's emotional life, relationships, or health?". If P ≥ 0.4, use the template fallback (`pickFallbackTemplate`). Add a second Noul for clinical language. State is the generated copy only, so no user text is involved.
- **Nudge timing and churn features** are covered in §5.4.

### 4.M Daily quotes (#20): **Partial (guardrail upgrade)**

`validateQuote` is a substring blocklist plus a proper-noun regex (`quotesQuality.ts:47-65`). It has false positives (any quote containing "therapy" or "symptom" is rejected, and "anxiety disorder" is matched only as a literal) and misses anything semantic ("your brain chemistry is off"). Replace or augment it with:
- Nouls for clinical/diagnostic framing;
- a Noul for "speaks about a specific identifiable person";
- a Score for "reads as an aphorism vs. an explanation". The retry nudge already cares about this: "drifted into explaining the reader" (`quotesRequest.ts:10-11`).

`loadEmotionalContext` (the cold-start metadata loader in `quotesDistiller.ts`) is a DB read and has no model decision to replace.

### 4.N Trusted Bridge (#21): **Partial**

- **Input side.** Closeness is an exact-match set of relationship strings (`bridge.ts:34-43`). Free text such as "my wife" (with "my"), "fiancée", "mum" or "partner of 5 years" falls to the cautious register. A Jev Choice over `{intimate, close_family, friend, colleague, formal, unclear}` on the free-text relationship fixes that for about $0.00002. Low risk: the fallback is "measured disclosure".
- **Output side.** A check for the prompt's explicit NEVER rules ("no need to respond"-style closers, `bridge.ts:247`). This is best done as a Noul ("Does the draft excuse the recipient from replying?"), because it is semantic, not lexical. The user is waiting here, but Jev's ~100 ms is small next to a Sonnet call.

### 4.O Library "For you" / "Up next" (#24) and specialty suggestion (#25): **Poor fit today**

Both are deterministic facet joins on the closed Understanding vocabulary (ADR 0015; `library/next.ts:8-54`; `library/home.ts:14-70`; `xolacerSuggestion.ts:102-122`). Adding a model to rank a small curated catalog adds cost and opacity for little gain. The one place Jev helps is **curator ingest**: a pre-screen that assigns facet *suggestions* to new entries (a Choice or Noul per facet) for a human to confirm before `safetyReviewedAt` (`library/ingest.ts:18-22`). That is a curator-efficiency win, not a user-facing change.

### 4.P TTS, STT, embeddings (#9, #22, #5 ingest): **Not applicable**

Jev takes text in and gives typed judgments out. It has no audio and no vectors ([models](https://docs.typesafe.ai/models.md)).

---

## 5. Cross-cutting opportunities

### 5.1 Model routing (cheap vs. expensive articulator)

Today every mirror uses Sonnet 4.6 (`process.ts:224-229`). A "difficulty" Score from the classifier battery could route the easy ones to Haiku. The docs' model-routing pattern, "escalate uncertain cases to a person or a more expensive reasoning model" ([how-to-build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md); [intent-routing](https://docs.typesafe.ai/patterns/intent-routing.md)), supports this. Easy inputs: word-cloud or body-scan input, high emotion confidence, low intensity, no safeguard.

**Honest caveat:** the mirror *is* the product, and quality differences between writers only show up in confirmation rates. Don't route on cost until an A/B shows equal `firstTryRate`/`landingRate` per `mirrorModelVersion` (`evalMetrics.ts`). The version stamping to measure this already exists. Priority is low unless Sonnet spend becomes a problem.

### 5.2 Output guardrails and faithfulness

See §4.E (mirror), §4.H (pool), §4.L (push), §4.M (quotes), §4.N (bridge) and §4.I (profile). A **single shared "non-clinical" question definition**, reused everywhere, would enforce the product rule "Not clinical (no diagnoses, no therapeutic terminology)" (CLAUDE.md) consistently. Today it lives in six separate prompts and one blocklist.

### 5.3 RAG reranking

See §4.G (episodic) and §4.H (peer matching). The Reflection Agent's `search_episodic_memory` tool (`tools.ts:30-44`) could return reranked results too, but its consumer is a Sonnet agent that can judge relevance itself. Skip it.

### 5.4 Feature extraction for retention, churn and nudge timing

The documented "autoresearch" pattern turns text into numeric features for a predictive model. Vendor-measured on wine reviews: RMSE from 2.47 with word counts down to 1.77 with 38 Jev questions ([autoresearch](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md)). For Xolace:
- **Outcome labels already exist:** `postSessionMood`, `confirmationState`, returns within 48 h, and `gentle_return` success (`notificationTriggers.ts`, `generateNotification.ts:75-76`).
- **Candidate features:** per-session Nouls and Scores such as "expresses isolation", "unresolved relationship conflict", "mentions sleep", "future dread", "positive agency".
- **Uses:** predict "likely to return tomorrow" or "at risk of lapsing". Pick *when* to send `gentle_return` instead of a fixed 48 h window (`notificationTriggers.ts:1`). Choose `pattern_nudge` topics.

**Caveats.** It needs a training set and an owner. It is a retention project, not an integration. Computing features on raw text sends more of it off-platform; computing them from the Understanding row alone may get most of the value with no new text exposure. Start from the Understanding.

### 5.5 Real-time client uses (typing-time signals)

At about 100 ms, Jev could run on the input *while the user types*, debounced. Possible uses: a gentle "take your time" cue when intensity is rising, prefetching the right exercise, or showing crisis resources *before* submit when `si_intent` is high.

**Don't.** This is the one idea in this doc to reject on merit:
- It would send every keystroke-window of unsent, possibly deleted, text to a third party.
- It turns a private writing space into a monitored one, against the "campfire" metaphor and user trust.
- The request would need a client-side key or a Convex relay per debounce.

The only defensible version is **on submit**, which is what §4.A/B already do.

### 5.6 Analytics tagging

`mirror_delivered` already carries the gate's inputs (`process.ts:274-296`). Adding Jev's per-question probabilities to it (only the numbers, never text) makes every threshold re-tunable offline, the same way `episodicTopScore` is persisted so the floor can be retuned without a backfill (`confidence-aware-mirroring.md:926-930`). The same rule fits Jev: **persist raw probabilities and derive decisions at read time.**

### 5.7 Eval harness

`__evals__/harness.eval.ts` is built for live model calls with labeled cases, anchors and an accuracy threshold. A Jev runner is a new `run` function over the same case lists (chatModeration, requiresFollowUp, supportNeed, reach). Add two metrics the harness lacks:
- a **reliability curve** (bucketed predicted probability vs. observed rate), since calibration is the whole claim;
- **false-negative rate on crisis-labeled cases** as a hard gate.

The existing sets are small (11–42 cases). The crisis set needs a few hundred cases before any live decision.

---

## 6. Findings that stand on their own (with or without Jev)

These came up during the inventory. Each one is either a bug or a gap in safety or privacy.

1. **Distress-emotion rules compare against words the classifier never emits.**
   - `HIGH_DISTRESS_EMOTIONS` = despair, hopelessness, numbness, worthlessness, helplessness. `DISTRESS_EMOTIONS` adds emptiness, anguish and grief (`safeguard.ts:105-122`).
   - `primaryEmotion` is restricted to 13 values (`understandingVocab.ts:8-22`), and anything else is coerced to `"confusion"` (`anthropic.ts:135-137`). Only `numbness` and `grief` overlap.
   - The checks use `granularLabel ?? primaryEmotion` (`safeguard.ts:386`, `:412`, `:458`). A present granular label (free text, examples at `classifier.ts:72-79`: "flatness", "heartbreak", "emptiness"…) therefore **overrides** a matching primary. Example: numbness + "flatness" at intensity 10 never trips the elevated rule.
   - The unit test builds `primaryEmotion: "despair"` (`safeguard.test.ts:80-86`), a value the parser can never produce. The test passes while the production path cannot reach that state.
   - **Fix options:** match on the primary *and* granular label, and map the sets onto the actual vocabulary. Or close the granular vocabulary (§4.A). Verify on prod `emotional_metadata` how often `safeguardTrigger` came from these rules.
2. **Reflect moderation fails open.** An OpenAI outage means no `crisis` level is reachable (`process.ts:143-145`, `moderation.ts:41-49`, `clarify.ts:190-192`). By contrast, vent fails *safe* (`vent.ts:147-150`). The two lanes should agree.
3. **The vent crisis check is keyword-gated** to 8 phrases (`vent.ts:115-124`, `:257`).
4. **DM moderation parse failure means crisis "none"** (`classify.ts:98-107`), and crisis is not in the human flag queue (`moderate.ts:67`).
5. **The peer pool publishes unverified text.** It has no PII or harm check on the distilled text, falls back to mirror text, and treats only an exact `"NULL"` as the sentinel (`reflectionAnonymizer.ts:65-69`, `reflectionDistiller.ts:51`, `reflections.ts:242-277`).
6. **One classifier double-parse failure fails the session** (`process.ts:146-149` has no catch, unlike `clarify.ts:177-179`).
7. **Raw user text is written to function logs** (`process.ts:114`, `:134`; `anthropic.ts:116`; `cachedActions.ts:81-86`; `vent.ts:281`).
8. **Doc drift:** DM skip rule `MIN_WORDS = 2` (`classify.ts:35`) vs. "under 3 words" (`CONTEXT.md:279`).
9. **No latency instrumentation** on the mirror hot path (`mirror_delivered`, `process.ts:274-296`). Any latency argument for or against Jev is unmeasurable until this exists.

---

## 7. Prioritized opportunities

Impact is in safety, UX or capability. Effort is engineering time. Risk covers accuracy, privacy and product risk. Everything assumes §2 (ZDR + DPA) is resolved first.

| # | Opportunity | Impact | Effort | Risk | Priority |
|---|---|---|---|---|---|
| 0 | Fix §6.1–6.7 in code (no Jev needed) | High | Low | Low | **Do now** |
| 1 | DM moderation on Jev, shadow → replace (§4.D) | High | Low | Medium | **1** |
| 2 | Crisis battery as an OR-escalate layer for reflect and vent, shadow first (§4.B, §4.C) | **Very high** (safety) | Medium (labeled eval is the work) | High until evaled | **2** (shadow now, live after eval) |
| 3 | Peer-pool pre-publish gate (§4.H) | High (privacy, safety) | Low | Low (strict thresholds, cheap false positives) | **3** |
| 4 | Episodic rerank plus Jev-based `memoryConnected` (§4.G) | Medium–High (mirror quality) | Medium | Medium (more text off-platform) | 4 |
| 5 | Classifier judgment fields on Jev, shadow (§4.A) | Medium (reliability, calibration) | Medium–High (threshold re-fit everywhere) | Medium | 5 |
| 6 | Mirror output guardrail, log-only (§4.E) | Medium | Low | Low while log-only | 6 |
| 7 | Push lock-screen privacy check (§4.L) | Medium | Very low | Very low | 7 (quick win) |
| 8 | Quote / bridge / profile guardrails (§4.M, §4.N, §4.I) | Low–Medium | Low | Low | 8 |
| 9 | Kindling pick, slot fill as Choice (§4.J, §4.K) | Low | Low | Low | 9 |
| 10 | Retention / nudge feature model (§5.4) | Potentially high | High | Medium | Separate project |
| 11 | Articulator model routing (§5.1) | Low (cost) | Medium | Medium (quality) | Only if cost pressure appears |
| ✗ | Typing-time client signals (§5.5) | — | — | High (trust, privacy) | **Don't** |

---

## 8. Suggested first experiment

**Goal:** answer three questions with real data and no user-visible change:
1. Is Jev as accurate as the current classifiers on our text?
2. Are its probabilities calibrated on crisis content?
3. What is its real latency from Convex?

**Prerequisites.**
- A signed ZDR agreement and DPA with TypeSafe (§2).
- Pin `jev-1.13.0`, not `jev-latest` ([models](https://docs.typesafe.ai/models.md)).
- Add timing to `mirror_delivered` (§6.9).

**Design: "Jev shadow" on two lanes.**
- **DM lane.** In `moderateChatMessage` (`moderate.ts:41-81`), after the Haiku verdict, fire the §4.D Jev battery. Write `{streamMessageId, jevAnswers (probabilities only), jevLatencyMs, modelVersion}` to a new shadow table. **No text.**
- **Reflect lane.** In `generateMirror`, add the §4.B crisis battery plus the §4.A emotion/intensity/specificity questions *inside* the existing `Promise.all` (`process.ts:141-158`), wrapped so any failure is ignored. Log the probabilities to a shadow table keyed by `sessionId`, alongside what the pipeline actually decided (`safeguardLevel`, classifier fields). A shadow table rather than `emotional_metadata`, so wipe and retention rules can be applied deliberately.
- Run it for 2–4 weeks in dev, then prod.

**Offline analysis.**
1. Run the 4 existing labeled suites through both systems. Grow the crisis set, then compute a reliability curve and the false-negative rate at candidate thresholds.
2. Measure agreement on prod: Jev vs. Haiku on `primaryEmotion`, `supportNeed` and `requiresFollowUp`; Jev crisis vs. the safeguard level. **Hand-review every disagreement where Jev says elevated or crisis and the pipeline said none.** Those cases are the argument for layering. This needs a consented, access-controlled review path, because the shadow table holds no text.
3. Plot Jev confidence against emotion `confirmationState` (was the mirror confirmed?). This is the only large-scale proxy label available.
4. Latency: p50/p95 from Convex, compared with the Haiku classifier p50/p95.

**Decision gates.**
- DM lane goes live if its accuracy is at least Haiku's on the eval and it has zero crisis false negatives on anchors.
- The crisis layer goes live as OR-escalate only once the labeled set shows recall at least equal to the current detector and the added elevated rate is acceptable.
- Everything else waits on these results.

---

## 9. Open questions for the team

1. **Privacy:** will TypeSafe sign ZDR and a DPA annex covering health data for a company our size? What exactly do they log? Can someone read the trust center (SOC 2 status, subprocessors) with a browser? It did not render for the fetcher.
2. **Constitution:** the crisis-layer design keeps decisions in rule-code, with Jev only as a probability input. Is that acceptable under decision #8 (`docs/cognition-layer-architecture.md:423`)? Is a new external judgment call on the hot path acceptable at all?
3. **Language:** what share of real inputs is non-English or code-switched (e.g. Twi or Pidgin with English)? The safeguard resources are Ghana-first (`safeguard.ts:79-97`), and Jev is English-primary ([models](https://docs.typesafe.ai/models.md)). Can we sample `emotional_metadata`-linked sessions to estimate this without reading text?
4. **Labeled crisis data:** who builds and owns a few-hundred-case labeled crisis/elevated/none set? What is the review protocol (consent, access control, clinician input) given that the product is explicitly non-clinical?
5. **Granular vocabulary:** should `granularLabel` become a closed list? It would fix §6.1, enable hierarchical Choice, and make Library facets cleaner, at the cost of expressiveness in the mirror.
6. **Latency baseline:** what are the p50/p95 today for the Haiku classifier and for time-to-mirror? Without them, the "Jev cuts time-to-mirror" case is speculation.
7. **Pre-delivery DM lane:** what is Stream's real before-send budget, and does the product want pre-delivery flags at all, given "venting must reach the listener" (`CONTEXT.md:271`)?
8. **Vendor risk:** Jev 1.x is new, its rate limits "adjust dynamically", and it has no deprecation policy ([models](https://docs.typesafe.ai/models.md)). What is the fallback when TypeSafe is down? For every proposal here, the answer must be "the current path", which is why everything is a layer, not a swap.
9. **Minors:** TypeSafe does not knowingly process data of under-18s ([privacy policy](https://typesafe.ai/legal/privacy-policy)). Does Xolace allow under-18 users? If so, how would their text be kept out of Jev calls?
