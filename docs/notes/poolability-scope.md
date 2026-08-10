# Poolability scope — findings from the 2026-07-21 anonymizer review

Context for the `isPoolable` extraction (`convex/lib/poolability.ts`). Two
findings recorded here so a later architecture review doesn't re-raise them.

## 1. "One safety question in three modules" was disproven

The originating report claimed one safety gate lived in three places
(`reflectionAnonymizer`, `reflectionDistiller`, `episodicMemory.ingestSession`)
and that missing any one lets user text escape. That doesn't survive the code —
the three sites answer three different questions with three different
destinations:

- **`reflectionAnonymizer`** → the shared anonymous pool. The only cross-user
  surface. Crisis is gated twice: never scheduled to distill
  (`process.ts` `!plan.isCrisis`) and re-checked in the anonymizer body.
- **`reflectionDistiller`** → private `distilledText` on the user's own session.
  Body checks `kept` only; crisis/fallback gated upstream at the scheduler.
- **`episodicMemory.ingestSession`** → the user's own private RAG namespace.
  Crisis is deliberately embedded metadata-only, not excluded.

"Miss one → text escapes" is false: only the anonymizer path is cross-user, and
crisis is double-gated there. The `{ poolable, distillable, ingestable }` bundle
the report proposed was rejected — it re-conflates the three destinations.

## 2. Poolability is a nameable domain term

The real invariant — `kept && contributedReflection && !crisis` — was the most
safety-critical predicate in the product, split between the scheduler and the
anonymizer body with no test. That is the whole scope of the extraction:
`isPoolable` + a truth-table test. Distiller and episodic memory were left
untouched; they're correctly gated for their own destinations.
