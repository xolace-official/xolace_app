# Architecture Context

Recorded decisions that reviews and future refactors should treat as settled.
One entry per concept; newest first.

## Screen projection (2026-07-19)

`projectScreen()` in `src/features/reflect/session-service.ts` is the single
authority for "server session state → which reflect screen". The server owns
authoritative advances (processing, mirror/escalation delivery, confirmed →
path-selection, error, terminal); local reducer state owns pre-processing
input screens, optimistic transitions, and mirror-phase sub-modes (clarify,
gave-up). It has **edge semantics**: `use-reflection-machine.ts` applies it
only when `serverState` changes (via `prevServerStateRef`), which is what
disambiguates (mirror_delivered, processing) — optimistic before a refinement
round-trips vs. new-mirror-delivered after. Do not re-add per-transition
`if (state.screen !== …)` echo cases to the machine, and do not apply the
projection on every render — the edge guard is load-bearing. Mirror text is
read from `session.mirrorText` (via `useSession`), never copied into reducer
state. Server rejections the client branches on use typed `ConvexError`
codes (`max_refinement_turns`, `input_too_long`), not message matching.

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
