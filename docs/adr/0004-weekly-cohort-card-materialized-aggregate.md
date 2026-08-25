---
status: accepted
---

# Weekly cohort card computed via materialized weekly aggregate, not live query

Convex has no `.count()` primitive, so the Discovery screen's weekly "22
campers sat with sadness..." card — a per-emotion count of distinct campers
over a calendar week — would otherwise mean scanning an unbounded, growing
set of rows on every screen load.

`@convex-dev/aggregate` is already installed (`convex/lib/aggregates.ts`, for
reflection rank) and **can** group by a dynamic value: a `TableAggregate`
takes a `namespace: (doc) => …` alongside its `sortKey`, so
`namespace: (doc) => doc.primaryEmotion` with `sortKey: (doc) => doc.createdAt`
would give per-emotion counts over a time range in O(log n). It is not used
here for two narrower reasons:

1. **One document maps to exactly one namespace.** `isCohortMatch` counts a
   session toward its primary *or* secondary emotion (user story 6), so a
   session carrying `anger` over `sadness` belongs in two cohorts. A
   `TableAggregate` can only file it under one.
2. **`count()` counts rows, and there is no COUNT DISTINCT.** The copy says
   "22 campers", which we read as 22 *people* — one camper with three sad
   sessions is one. A tree count gives sessions.

A namespaced aggregate over a separate marker table (one row per
`weekStart`/`emotion`/`profileId`, two rows when a secondary is present,
deduped by a unique index) would clear both and give live counts. That costs a
table, a write on every classification, trigger wiring and a backfill, against
one cron and one row per week — not worth it at current volume, but it is the
upgrade path if the week-long lag ever becomes the problem.

We compute it with a new weekly cron (Monday, same slot as the existing
`rankAudit` job in `convex/crons.ts`) that counts the distinct campers
matching each of the 13 fixed emotion labels over the prior calendar week
(distinct campers, not sessions — the copy says "22 campers") and writes the
result into a small materialized summary doc. The Discovery card reads that
precomputed doc, keyed by the viewer's own most recent emotion, instead of
counting anything live.

**No safeguard filter is applied**, which is a deliberate departure from
`poolability.ts` and from user story 5 of issue #196 ("As a camper in crisis,
I want my session excluded from ever appearing in someone else's cohort
count"). That story was written by analogy to the peer pool, and the analogy
doesn't hold: `isPoolable` gates *content* — a stranger reads someone's actual
words, so a crisis session must never qualify. The cohort card gates an
*integer*. No content, no attribution, no routing; a crisis session being one
of the 22 discloses nothing about that person to anyone, so there is no
boundary for it to cross. Excluding it would buy no protection and cost real
accuracy on a card whose only job is telling someone they aren't alone.

The same reasoning settles rows with no `safeguardLevel` at all — those
written before the safeguard verdict moved onto `emotional_metadata`
(2026-06-28). They count, like everything else.

**Consequences:** the card's number can lag up to a week behind reality,
which is acceptable since it's a "this week" stat by definition, and is cheap
to read on every Discovery load. Adding a new emotion label or redefining
what "week" means requires a cron change, not just a query change.
