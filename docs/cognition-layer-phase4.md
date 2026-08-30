# Phase 4 — Feedback Loops + Routing (Cognition Layer)

## Context

The Cognition Layer (`docs/cognition-layer-architecture.md`) turns "AI-powered
sessions" into "an AI that knows you." **Phase 1 (Memory)**, **Phase 2
(Understanding)**, and **Phase 3 (the Reflection Agent)** are shipped and wired:
the hot path reads episodic memory + the semantic profile, every session
produces one versioned Understanding, and the background agent writes the
narrative profile on a light/consolidation cadence.

**What Phase 4 adds is the nervous system: the layer that learns.** Phases 1–3
built the machinery that reads and writes Memory; Phase 4 is the four feedback
loops (doc §4) that make that machinery *improve* — so session 50 is not just
informed by more history than session 5, but is measurably better tuned to this
person and this moment, and we can prove it.

All four loops are now built. This doc is the close-out.

**Constraints honored across every loop** (unchanged from Phases 1–3):
- **Hot path stays deterministic** (decision-log #8). Loops #1 and #2 shape the
  mirror through *rule-code*, never a model call — claim strength and
  calibration are computed, not asked. No loop touches crisis/escalation, which
  stays rule-code in `safeguard.ts`.
- **Constitution rule** — no loop calls an LLM to re-derive what Understanding
  already knows. Loop #1 and Loop #4 are pointedly model-free; they read the
  version/tone/outcome stamps the pipeline already records.
- All model calls (there are none new in Phase 4) would live under `convex/ai/`;
  camelCase Convex filenames (no hyphens); **no `convex deploy`** (local
  codegen/tsc/eslint + in-app verification only).

---

## The four loops (build order = doc §4)

### Loop #1 — Tone adaptation *(the loop that makes session 50 feel different)*

**What:** the "what lands" (`calibration`) section of the semantic profile,
learned per user from the longitudinal signal the pipeline already captures —
confirmation outcomes, mirror lengths, tone tallies, mood deltas. The
articulator already *read* this section via `renderSemanticProfile`; Phase 3's
consolidation prompt deliberately left it unwritten ("written by a separate
process"). Loop #1 is that missing write side.

**Key decision — deterministic by design.** Calibration is derived in rule-code,
not by a model, per the constitution rule. It runs as the final step of the
`consolidationWorkflow` (on the consolidation cadence), independent of the
agent's narrative write, patching `calibration` in place through the sanctioned
`writeCalibrationInternal` path. It stays quiet below `MIN_OUTCOMES` (5) landed/
missed outcomes — no confident calibration from noise — and scans a bounded
`SIGNAL_WINDOW` (40) of recent sessions so the newest "what lands" wins.

**Where wired:** `consolidation.ts` calls
`calibration.refreshCalibration` after the narrative write; the articulator
consumes the rendered section as a longitudinal prior that composes with Loop
#2's per-moment evidence.

### Loop #2 — Uncertainty routing *(the per-moment counterpart to #1)*

**What:** the classifier's own confidence about tonight's read
(`primaryEmotionConfidence`) and how formed the feeling is (`specificity`) gate
the mirror's **claim strength**. Low confidence *and* low shape → `tentative`
(offer the naming, invite correction); high *and* high → `confident` (name it
precisely, no hedging); everything mixed/middling → `measured` (the normal path,
which emits no extra instruction so the base rules stand).

**Key decision — pure and unpersisted.** `routeUncertainty` is a pure function
of two fields that already live in `emotional_metadata`, so there is nothing new
to persist and nothing for Understanding to re-derive — it is recomputed
wherever needed. The doc's "low/low → stronger model tier" Plus lever is
deferred until Plus tiering infra lands; today the signal only shapes the
prompt. In the clarify path, a `not_quite` on a `confident` read is softened one
notch (evidence that the sure read missed).

**Where wired:** `process.ts` and `clarify.ts` compute `claimStrength` and pass
it to the articulator, which emits `getClaimStrengthInstructions`. Distinct axis
from Intensity × Specificity (which governs *depth*); this governs *certainty*.

### Loop #3 — Memory relevance feedback *(memory that compounds, not just accumulates)*

**What:** episodic memories earn or lose their place in the mirror. Each session
carries a salience weight (`episodicImportance`, 0.2–1) mirrored into the RAG
vector's native importance, scaling how strongly that memory surfaces in future
searches. A confirmed mirror bumps the memories that informed it (recorded as
`episodicMatchKeys` on the Understanding — this is *why* Phase 2 records them);
a `gave_up` decays them. Growth is gentler than decay, floored at 0.2 so a
memory sinks but is never erased.

**Key decision — transactional weight, background re-embed.** The doc's "native
RAG feature" premise was incomplete: importance has no in-place setter
(`entryIsSame` treats a weight change as a new entry), so every adjustment
re-embeds. The weight therefore lives in `emotional_metadata` as the
transactional source of truth; `adjustEpisodicImportance` returns `changed` so
the bounded (K≈3) re-embed is paid only when a weight actually moves, in the
background. **The confirmation tap never waits.** `ingestSession` threads the
stored weight into `rag.add`, so re-ingestion never resets learning.

**Where wired:** a terminal hook in `confirmMirror` (`sessions.ts`) schedules
`applyMemoryFeedback` off the hot path.

### Loop #4 — Eval harness *(what makes #1–#3 measurable)*

**What:** two halves. **Online** — confirmation rate becomes the north-star per
prompt/model version. `summarizeConfirmations` folds terminal verdicts into
`firstTryRate` / `landingRate` over the *judged* set (confirmed + refined +
gave_up), with `abandoned` counted but held out of the quality denominator (same
"which states carry signal" read Loop #3 uses); it groups by version **and** by
tone, so Loop #1 is measurable too. `rankVersions` parks any version below
`MIN_JUDGED_FOR_RANKING` (20) so a small-N fluke never tops the board.
**Offline** — the `__evals__/` live-model pattern, factored into a reusable
harness so the next tone/profile eval is a `CASES` array + a one-line `run`.

**Key decision — pure infra, first consumer of a planted index.** No model call,
no re-derivation. The online queries are the first consumer of the
`by_model_version` index that has sat on `sessions` since day one "for quality
comparison across prompt iterations" and been read by nothing until now.

**The bundler gotcha (worth remembering):** Convex esbuild-bundles *every*
single-dot `convex/*.ts` as a deployable function module; a plain `harness.ts`
under `__evals__/` gets bundled and fails `codegen` on its `vitest` import.
The skip rule is a **2+-dot basename** (the same mechanism behind `*.test.ts`),
*not* the tsconfig `exclude` (which only governs `tsc`). Hence `harness.eval.ts`.

---

## Files

### Loop #1 — Tone adaptation (`e505e2c`)
- `convex/ai/reflectionAgent/calibration.ts` (new) — deterministic
  `refreshCalibration` internalMutation; `CALIBRATION_VERSION =
  "calibration-v1-deterministic"`; `SIGNAL_WINDOW`, `MIN_OUTCOMES`, per-signal
  minimum samples.
- `convex/ai/reflectionAgent/calibration.test.ts` (new) — unit tests.
- `convex/semanticProfiles.ts` (+`writeCalibrationInternal` sanctioned write path).
- `convex/ai/reflectionAgent/consolidation.ts` (+ final `refreshCalibration` step).

### Loop #2 — Uncertainty routing (`bf4a5df`)
- `convex/ai/routing.ts` (new) — pure `routeUncertainty` + thresholds
  (`LOW/HIGH_CONFIDENCE` 0.5/0.75, `LOW/HIGH_SPECIFICITY` 4/6).
- `convex/ai/routing.test.ts` (new).
- `convex/ai/process.ts` + `convex/ai/clarify.ts` (compute + thread `claimStrength`).
- `convex/ai/prompts/articulator.ts` (+`getClaimStrengthInstructions`).

### Loop #3 — Memory relevance feedback (`cbb27d1`)
- `convex/episodicImportance.ts` (new) — pure `adjustImportance` +
  `importanceDelta` + `isActionableFeedback` + tuning constants
  (`DEFAULT/MIN/MAX_IMPORTANCE`).
- `convex/episodicImportance.test.ts` (new).
- `convex/schema.ts` (+`episodicImportance` on `emotional_metadata`).
- `convex/emotionalMetadata.ts` (+`adjustEpisodicImportance` internalMutation,
  returns `changed` to gate the re-embed).
- `convex/episodicMemory.ts` (+`applyMemoryFeedback` action; `ingestSession`
  threads the stored weight into `rag.add`).
- `convex/sessions.ts` (+ terminal hook in `confirmMirror`, scheduled off the hot path).

### Loop #4 — Eval harness (this session)
- `convex/ai/evalMetrics.ts` (new) — pure `summarizeConfirmations` +
  `rankVersions` + `MIN_JUDGED_FOR_RANKING`.
- `convex/ai/evalMetrics.test.ts` (new) — 10 unit tests.
- `convex/evals.ts` (new) — `confirmationRateByVersion` (recent window via
  `by_date`) + `confirmationRateForVersions` (targeted A/B via
  `by_model_version`); both internalQuery, both bounded.
- `convex/ai/prompts/__evals__/harness.eval.ts` (new) — reusable `runLabeledEval`.
- `convex/ai/prompts/__evals__/requiresFollowUp.eval.test.ts` (migrated onto the
  harness, identical semantics — the harness's first live consumer).

---

## Out of scope (deferred, per doc)
- **Plus model-tiering** off Loop #2's `low/low` pole — waits on the Plus
  tiering infra (contemplated in the monetization docs).
- **A new live tone / profile-writing eval** — Loop #4 factored the harness and
  migrated the classifier eval onto it, but did not add a fresh flaky live-model
  eval speculatively. The harness is the substrate; the next eval is cheap to
  add before the next articulator/consolidation prompt change.
- **Global pool-ceiling rate limit** for background work (carried over from
  Phase 3's deferred list).

## What "measurable" now means (the honest caveat)
The online north-star is a correct instrument, but a version only *says*
anything once it accumulates ≥ `MIN_JUDGED_FOR_RANKING` (20) judged sessions —
so the first prompt-vs-prompt verdict arrives with volume, not on day one.
Likewise Loops #1 and #3 compound with episodic depth: their value shows up as
users return, which is exactly what Loop #4 exists to detect.

---

## Verification (no deploy)
1. **Static (all loops):** `bunx convex codegen`, `bunx tsc -p convex --noEmit`,
   and `bun expo lint` clean. Loop unit tests green:
   `bun run test convex/ai/evalMetrics.test.ts convex/ai/routing.test.ts
   convex/episodicImportance.test.ts convex/ai/reflectionAgent/calibration.test.ts`.
   The live `__evals__` suite skips cleanly without `ANTHROPIC_API_KEY`.
2. **Loop #2 (routing):** complete a session with a faint/unformed entry →
   confirm a softer, correction-inviting mirror; a sharp high-specificity entry →
   a direct one. Hot path unchanged in latency.
3. **Loop #3 (relevance):** confirm a mirror that surfaced a prior memory → via
   `mcp__convex__run`, confirm the matched `emotional_metadata` row's
   `episodicImportance` moved and the re-embed ran in the background only when
   the weight changed.
4. **Loop #1 (tone):** cross the consolidation gate on a test profile → confirm
   the `calibration` section populates once ≥ `MIN_OUTCOMES` outcomes exist, and
   stays empty below it.
5. **Loop #4 (eval):** `mcp__convex__run` `evals:confirmationRateByVersion` and
   `evals:confirmationRateForVersions` on real data → confirm per-version and
   per-tone rates, `truncated` flags honored, and low-N versions parked as
   `insufficient`.

---

**Status:** Phase 4 complete. The cognition layer now reads Memory to produce
each Understanding (Phases 1–2), writes Memory in the background (Phase 3), and
**learns from the result** (Phase 4). Remaining Cognition Layer work is Phase 5
(platform surface) and the Phase 3 strangler absorptions
(`queue_follow_up` / `propose_notification` / `write_insight`), each still
gated behind its comparison period.
