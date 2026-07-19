# Architecture Context

Recorded decisions that reviews and future refactors should treat as settled.
One entry per concept; newest first.

## Mirror plan (2026-07-19)

`convex/ai/mirrorPlan.ts` owns the pure decision core of mirror generation:
`decideMirrorOutcome()` takes the gathered inputs (classification, safeguard,
preferences, entry type) and returns a flat `MirrorPlan` — tone (with the
witnessed→adaptive premium downgrade), claim strength, escalation/follow-up/
risk/crisis flags, and the matched exercise title. `generateMirror` in
`convex/ai/process.ts` is deliberately a thin imperative driver: gather →
decide → articulate → execute. Do not re-derive these decisions inline in the
driver (e.g. `safeguard.level === "crisis" || ...`) — read them from the plan.
Safeguard consequences (`isEscalation`, `riskFlag`, `isCrisis`) are computed
once in `evaluateSafeguard`'s final return, never at call sites.

Deliberate non-moves: the action was NOT split into smaller actions (more
`runQuery` round-trips, worse locality), and the `clarify.ts`/`process.ts`
back-half duplication is a separate deferred candidate.
