---
status: accepted
---

# Weekly cohort card computed via materialized weekly aggregate, not live query

Convex has no `.count()` primitive, and the existing `@convex-dev/aggregate`
`TableAggregate` (`convex/lib/aggregates.ts`) only supports a single fixed
sort key (session count, for rank) — not grouping by a dynamic value like
`emotional_metadata.primaryEmotion`. The Discovery screen's weekly "22
campers sat with sadness..." card needs a per-emotion count of matching
sessions in a calendar week, so counting live on every screen load would mean
scanning an unbounded, growing set of session rows per request.

We compute it with a new weekly cron (Monday, same slot as the existing
`rankAudit` job in `convex/crons.ts`) that counts matching sessions for each
of the 13 fixed emotion labels over the prior calendar week and writes the
result into a small materialized summary doc. The Discovery card reads that
precomputed doc, keyed by the viewer's own most recent emotion, instead of
counting anything live. Crisis sessions are excluded using
`sessions.safeguardLevel !== "crisis"` — the same field `poolability.ts`
already uses for peer-pool exclusion — not `emotional_metadata.riskFlag`,
because `riskFlag` is true for both `crisis` and `elevated` levels and would
over-exclude.

**Consequences:** the card's number can lag up to a week behind reality,
which is acceptable since it's a "this week" stat by definition, and is cheap
to read on every Discovery load. Adding a new emotion label or redefining
what "week" means requires a cron change, not just a query change.
