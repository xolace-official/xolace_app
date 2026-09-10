# Kindling generation is a standalone model call, not a job of the Reflection Agent

Kindling generation (`docs/paths-v1.md` §2) is a new model call: one Haiku-class
request under `convex/ai/paths/`, fired as a background sibling off
`completeSession`. The Cognition Layer already has a background "slow mind" — the
Phase 3 Reflection Agent (`docs/cognition-layer-phase3.md`) — that runs
post-completion, reads Understanding + Memory, and is explicitly the component
that "decides what the person needs next"
(`docs/cognition-layer-architecture.md` §0, System 2). Folding kindling into it,
as a fourth deferred write-tool alongside `queue_follow_up` /
`propose_notification` / `write_insight`, was the obvious alternative. We are not
doing that for v1.

**The Constitution Rule permits this call.** "No feature may call an LLM to
re-derive something the Understanding already knows … A new model call is
justified only for genuinely new signal." Kindling generation does not
re-derive: it takes `getUnderstanding` (including the new `supportNeed` field),
the rendered semantic profile, and the action catalog as *input*, and produces a
genuinely new artifact — an ordered selection of 2–3 action types with a
user-safe `why` per twig. That is a new artifact type, which the rule names as a
valid reason for a new call. And it lives under `convex/ai/`, as the rule
requires.

**Why standalone, not a Reflection Agent tool:**

- **Cadence mismatch.** Kindling must generate *now*, off this one completed
  session, so the notification and Today row can appear within minutes. The
  Reflection Agent's light pass is completion-only but its substantive work is
  the **consolidation pass**, which fires on a `≥ 5 sessions OR ≥ 7 days` gate —
  the wrong clock for a per-session artifact.
- **The Reflection Agent's kindling-relevant write-tools are deferred.** Phase 3
  ships the light + consolidation passes but explicitly defers
  `queue_follow_up` / `propose_notification` / `write_insight` behind "absorb one
  at a time behind a comparison period." Attaching kindling to that surface means
  waiting on that absorption schedule and building inside a tool-use loop that
  does not exist yet.
- **Blast radius.** The Reflection Agent is the one component allowed to *write
  Memory* (`semantic_profiles`). Kindling writes its own `paths` / `path_steps`
  tables and touches nothing in Memory. Keeping it out of the agent keeps the
  agent's write surface exactly as Phase 3 scoped it, and keeps a kindling bug
  from being a Memory-integrity bug.
- **Determinism where it counts.** Only the *selection* is a model call; binding
  a twig to a concrete track / exercise / xolacer is a pure downstream function
  (spec §2.3). The agent's tool-use framing would invite giving the model the
  binding decision too.

## Consequences

**Two background model calls now fire off `completeSession`:** the Reflection
Agent trigger and `internal.ai.paths.generate.run`, as adjacent
`scheduler.runAfter(0, …)` siblings in `finalizeCompletion`. Both are
best-effort, off the critical path, failures logged not thrown. The kindling call
is additionally gated to the `completeSession` route (not `completePath`) and to
premium users.

**A `PATHS_MODEL` / `PATHS_VERSION` pair joins the others in
`convex/ai/providers/anthropic.ts`**, and a per-profile rate-limit bucket joins
`convex/lib/rateLimits.ts`. This is the same shape as every other call-site the
Cognition Layer was meant to eventually unify — accepted as a known, bounded
addition, not a regression toward the twelve-independent-call-sites problem,
because the input is Understanding + Memory and the output is a new artifact.

**If kindling selection quality proves to need cross-session reasoning** — the
episodic-RAG-in-the-input fog item, or "twig outcomes feed consolidation" —
that is the point to reconsider folding the *selection* into the consolidation
pass. The standalone call is the v1 choice, not a permanent boundary; the spec
carries both as explicit v2 notes (§16).

**Cross-reference:** `docs/cognition-layer-phase3.md` (agent scope, deferred
write-tools, the completion-mutation trigger points this call sits beside).
