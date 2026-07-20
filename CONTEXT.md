# Architecture Context

Recorded decisions that reviews and future refactors should treat as settled.
One entry per concept; newest first.

## Feedback retention (2026-07-20)

Account deletion **anonymizes** `feedback` and `product_feedback` in place
rather than deleting them — `emotionalProfileId` is cleared, which both severs
the owner link and drops the row out of every by-profile index range (the same
mechanism `escalation_events` uses, and what keeps the batch loop in
`accountDeletion.purgeUser` terminating).

The two tables differ on `text`, deliberately:

- `feedback.text` is **stripped**. The product signal here is structural —
  `type`, `selectedOption`, `turnIndex`, `createdAt` — so "how often did
  mirror_miss fire and for which reason" survives while the user's words do
  not. Both `emotionalProfileId` and `text` are therefore optional in the
  schema; both are always set on insert.
- `product_feedback.text` is **retained**. The prose is the entire value of a
  bug/idea row; stripping it leaves a `kind` + `appVersion` husk worth nothing.

The accepted cost of that second choice: a bug report naming a person or place
outlives the account that wrote it. Treat `product_feedback.text` as
potentially identifying — it must never be surfaced in anything user-facing,
and it is the first thing to revisit if an erasure/GDPR question comes up.

Known gap, not yet decided: `dataWipe` ("wipe my content, keep my account")
does not touch either table, so feedback text survives a wipe still linked to
the live profile. `dataRetention` deletes `feedback` outright past the cutoff.

## Session cascade (2026-07-20)

`convex/lib/sessionCascade.ts` owns the reference graph for "what dies when a
session dies". `purgeSessions(ctx, profileId, sessions)` is the only place that
knows the answer, and all three deletion jobs — `jobs/dataWipe`,
`jobs/accountDeletion`, `jobs/dataRetention` — call it with a batch they have
already bounded. Do not re-inline a per-session delete loop in a job; that
divergence is exactly what left `follow_up_cards` orphaned by `dataRetention`
while the other two jobs purged them.

Every table with a `sessionId` is either in `SESSION_CASCADE_TABLES` or in
`SESSION_ID_EXEMPT` with a written reason. `sessionCascade.test.ts` walks
`schema.tables` and fails if a new one appears in neither — a new
session-referencing table must be classified, not merely remembered. Exempt
today: `escalation_events` (safety-audit tombstone, retained with `profileId`
stripped even past account deletion) and `feedback` (profile-scoped, retained
by policy).

Profile-level bulk deletes deliberately stay per-job — they diverge on
purpose, and there is no `purgeProfileChildren` umbrella. `dataWipe` and
`accountDeletion` still schedule `followUps.purgeForProfile` as a sweep for
legacy orphan cards predating the `by_session` index. Note that
`reflection_resonances`, `notification_log`, and `daily_quotes` are
profile-scoped with no `sessionId`: `dataRetention` leaving them alone is
correct, not drift.

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
