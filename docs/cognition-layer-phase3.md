# Phase 3 — The Reflection Agent (Cognition Layer)

## Context

The Cognition Layer (`docs/cognition-layer-architecture.md`) turns "AI-powered
sessions" into "an AI that knows you." **Phase 1 (Memory)** and **Phase 2
(Understanding)** are already shipped and wired:

- Episodic memory (`convex/episodicMemory.ts`) — per-session composites in the
  user's personal RAG namespace, ingested from `process.ts` step 9.5, purged in
  `dataRetention` / `dataWipe` / `accountDeletion`.
- Semantic profile scaffolding (`convex/semanticProfiles.ts`, `semantic_profiles`
  table, `emotional_profiles.currentSemanticProfileId`) — append-only versions
  with `createVersion` / `revertToVersion`, already swept by the wipe pipeline.
- Understanding (`convex/understanding.ts`, extended `emotional_metadata`) —
  `getUnderstanding(sessionId)`, `safeguardLevel/Trigger`, `episodicMatchKeys`,
  `profileVersion`.
- Working memory — `convex/ai/context.ts` already feeds `semanticProfile` +
  `semanticProfileVersion` into the hot path.

**What's missing is the only thing that _writes_ Memory: the Reflection Agent.**
Today `semantic_profiles` is never populated — every user's `semanticProfile` is
`null`, so the hot path's longitudinal input is dead weight. Phase 3 builds the
background "slow mind" (doc §3) that reads Understanding + Memory and writes the
narrative profile, closing the loop.

**Decisions locked this session:**
- Build **both passes now** (light + consolidation), including `update_profile_section`
  and the 6 read tools. Strangler write-tools (`queue_follow_up` /
  `propose_notification` / `write_insight`) are **deferred** — doc mandates
  "absorb one at a time behind a comparison period," and there is no `insights`
  table yet.
- **Light pass patches the current version in place; only consolidation appends a
  new version.** Version numbers stay meaningful (= consolidation snapshots) for
  rollback + "confirmation dropped after v14" attribution; the fast-moving
  `trajectory` line is knowingly not independently audit-frozen.

**Constraints honored:** hot path stays untouched (both passes run post-completion,
off the critical path); crisis/escalation stays rule-code in `safeguard.ts` — the
agent never makes safety decisions; the agent never _sends_ anything; all model
calls live under `convex/ai/`; files kept < 200 lines; camelCase Convex filenames
(no hyphens); no `useMemo`/`useCallback` (backend only anyway); **no `convex deploy`**
(local codegen/tsc/eslint only).

---

## Cadence & trigger (doc §3)

Two tiers, activity-gated, whichever-first — **no blind cron** over all users.

1. **Post-session light pass** — single Haiku call, no loop. Runs after each
   genuine completion. Refreshes `trajectory`.
2. **Consolidation pass** — Sonnet tool-use loop. Fires when, since the last
   consolidation, the user has **≥ 5 completed sessions OR ≥ 7 days elapsed (with
   ≥ 1 session)**. Deep pass: rewrites `recurringThemes` + `emotionalSignatures`
   + `trajectory` as a new version.

Trigger point: both completion mutations in `convex/sessions.ts`
(`completePath` ~L267, `completeSession` ~L325) already
`scheduler.runAfter(0, profileStats.updateAfterSession, …)`. Add one sibling
`scheduler.runAfter(0, internal.ai.reflectionAgent.trigger.onSessionComplete, …)`
right after each. (Not `finalizeFollowUp` / abandon — light pass is completion-only.)

---

## Files

### Schema — `convex/schema.ts` (one field)
- `emotional_profiles`: add `lastConsolidationAt: v.optional(v.number())`. Set
  only by the consolidation pass; anchors the gate. `undefined` → anchor on
  `firstSessionAt ?? createdAt`.

### Write paths — `convex/semanticProfiles.ts` (extend, reuse `createVersion`)
- Add `updateTrajectory` internalMutation `(emotionalProfileId, trajectory)` —
  patches `currentSemanticProfileId`'s `trajectory` in place (no new version). The
  light pass calls this; if no current version exists it falls back to
  `createVersion({ trajectory, writerVersion })` for v1 bootstrap.
- Guard the write paths (`createVersion` + `updateTrajectory`): if
  `profile.dataWipeInProgress === true`, no-op — prevents a mid-wipe consolidation
  from re-materializing derived PII after the wipe swept the rows.

### Model constants — `convex/ai/providers/anthropic.ts` (append)
- `REFLECTION_LIGHT_MODEL = "claude-haiku-4-5-20251001"`,
  `REFLECTION_LIGHT_VERSION = "reflect-light-v1-haiku-4.5"`.
- `REFLECTION_CONSOLIDATION_MODEL = "claude-sonnet-4-6"` (= `ARTICULATOR_MODEL`),
  `REFLECTION_CONSOLIDATION_VERSION = "reflect-consolidation-v1-sonnet-4.6"`.
  (`writerVersion` mirrors the `mirrorModelVersion` format.)

### Rate limits — `convex/lib/rateLimits.ts` (append two buckets)
- `reflectionLightPass`: token bucket, ~12/hour capacity 4, keyed by profile
  (runaway guard; light pass is ~1/session).
- `reflectionConsolidation`: fixed window, ~4/day per profile (the "per-user token
  budget", doc §3). A global pool-ceiling bucket is a noted hardening TODO.

### Orchestrator — `convex/ai/reflectionAgent/trigger.ts` (new)
- `getLightPassContext` internalQuery `(emotionalProfileId, sessionId)` — the just-
  completed session's Understanding (`emotional_metadata` by_session) + rendered
  current profile (`semanticProfiles.getCurrent` + `renderSemanticProfile`) +
  last ~8 metadata rows (recency).
- `getConsolidationGate` internalQuery `(emotionalProfileId)` — returns
  `{ due: boolean }`. `anchor = lastConsolidationAt ?? firstSessionAt ?? createdAt`;
  count completed sessions with `createdAt > anchor` (bounded `.take(6)`),
  `due = count >= 5 || (now - anchor >= 7d && count >= 1)`.
- `onSessionComplete` internalAction `(emotionalProfileId, sessionId)` — **no
  `"use node"`** (SDK is fetch-based, per `followUps.ts`): rate-limit light pass
  → build prompt (`prompts/reflectionLight`) → Haiku call → write via
  `updateTrajectory`/`createVersion` → check gate → if due & consolidation bucket
  ok, `consolidationWorkflow` start. All best-effort; failures logged, never
  thrown (off critical path). PostHog `reflect_light_pass`.

### Light-pass prompt — `convex/ai/prompts/reflectionLight.ts` (new)
- `buildLightPassPrompt(ctx)` + `parseLightPassResponse(raw)` → `{ trajectory }`,
  1–3 sentences, user-safe / non-clinical, length-validated. **Negative examples
  only** (per `feedback_prompt_examples_cause_fixation`).

### Consolidation loop — `convex/ai/reflectionAgent/consolidation.ts` (new)
- `const workflow = new WorkflowManager(components.workflow)` (fresh instance;
  multiple managers on the shared component are supported — same pattern as
  `followUps.ts`).
- `consolidationWorkflow` = single durable `step.runAction(runConsolidation)` with
  `onComplete: onConsolidationComplete` (honors decision-log #6 "custom loop on
  workflow" for durable retry, minimal surface).
- `runConsolidation` internalAction `(emotionalProfileId)` — the ~150-line
  `while (stop_reason === "tool_use")` loop against `getAnthropicClient()` with
  `tools: REFLECTION_TOOLS`, capped at ~8 iterations. On each `tool_use` block →
  `dispatchTool` → push `tool_result`. Terminal `update_profile_section` →
  `createVersion`. Then `markConsolidated` (patch `lastConsolidationAt`). PostHog
  `reflect_consolidation_written`.
- `onConsolidationComplete` internalMutation → `workflow.cleanup`.
- `markConsolidated` internalMutation → patch `lastConsolidationAt = now`.

### Tools — `convex/ai/reflectionAgent/tools.ts` + `toolQueries.ts` (new)
- `tools.ts`: `REFLECTION_TOOLS: Anthropic.Tool[]` (input_schema per tool) +
  `dispatchTool(ctx, emotionalProfileId, name, input) → string`. Read tools →
  `ctx.runQuery`; `search_episodic_memory` → `rag.search` inline;
  `update_profile_section` → `ctx.runMutation(createVersion)` (restricted to the
  four narrative sections + `writerVersion`).
- `toolQueries.ts`: bounded internalQueries backing the read tools —
  `getEmotionTimeline`, `getRecentSessions`, `getMoodDeltas`,
  `getConfirmationStats`, `readSemanticProfile` (reuse `getCurrent` +
  `renderSemanticProfile`). All `.take(n)`, per query guidelines.

### Consolidation prompt — `convex/ai/prompts/reflectionConsolidation.ts` (new)
- System prompt: the "slow mind" — gather evidence via tools, detect patterns
  across episodic memory, then call `update_profile_section` **once** with
  `recurringThemes` + `emotionalSignatures` + `trajectory` (leave `calibration`
  for the Phase 4 tone loop). User-safe language; explicit safety boundaries
  (never crisis/escalation, never send). Negative examples only.

### Wipe tidy — `convex/jobs/dataWipe.ts` (~L133, one line)
- In the profile patch that sets `currentSemanticProfileId: undefined`, also clear
  `lastConsolidationAt: undefined`.

---

## Out of scope (deferred, per doc)
- Strangler write-tools `queue_follow_up` / `propose_notification` (need a
  comparison period against live `generateNotification` + `followUpCardWriter`)
  and `write_insight` (no `insights` table yet).
- Phase 4 feedback loops (tone adaptation, uncertainty routing, relevance
  feedback, eval harness) — `calibration` section stays unwritten for now.
- Global pool-ceiling rate limit; storing in-flight consolidation `workflowId`
  for mid-flight cancellation (the `dataWipeInProgress` write-guard covers the
  privacy case for v1).

---

## Verification (no deploy)
1. **Static:** `bunx convex codegen`, then `bunx tsc --noEmit` and `bun expo lint`
   clean. Confirm `runConsolidation` works **without `"use node"`** (SDK + `rag.search`
   are fetch-based); add `"use node"` only if `rag.search` errors at runtime.
2. **Light pass:** complete a session in the running app (argent iOS sim) → verify
   a `semantic_profiles` row appears/patches (`trajectory` set) and
   `emotional_metadata.profileVersion` populates on the _next_ session; check
   PostHog `reflect_light_pass`. Confirm the mirror still delivers unchanged (hot
   path untouched).
3. **Consolidation gate:** via `mcp__convex__run`, backdate a test profile's
   `lastConsolidationAt` (or clear it and complete a 5th session) → confirm
   `consolidationWorkflow` fires, tool calls appear in Convex logs, a **new
   version** is appended, and `lastConsolidationAt` advances. `reflect_consolidation_written`
   in PostHog.
4. **Privacy:** set `dataWipeInProgress` on a test profile → confirm
   `createVersion`/`updateTrajectory` no-op.
5. **Rollback:** `revertToVersion` still points the pointer at an older row.
