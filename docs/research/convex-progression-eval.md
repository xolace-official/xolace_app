# Evaluate `convex-progression`: adopt / borrow / reject

**Status:** Research only. No app code changed. Written 2026-09-26 against `5cc9ff9`.
**Ticket:** #424 (research), blocks #426 (data-model design), under map issue #423 (Wayfinder: Streak system restructure).
**Subject:** `src/components/extras/sample-codes/convex-progression-main` (`@vllnt/convex-progression@0.1.0`, unpublished, vendored as sample code).

## Recommendation: reject the component, borrow two ideas

Do not adopt this package as a dependency, vendored or otherwise. Borrow, in our own code:

1. the **`expectedPrevious`-based gap-detection shape** for `recordActivity` (host supplies "what should the previous period key have been", component compares), and
2. the **threshold-ladder-as-array pattern** for level/XP (`thresholds: number[]`, level = count of thresholds crossed) — useful only if XP/leveling is in scope for the new streak system at all.

Everything else about the component either doesn't fit our requirements or duplicates infrastructure we already have and already trust more.

## Why reject as a dependency

### 1. It cannot supply what the ticket says we need regardless of the verdict

The research ticket states the app needs per-action-type daily activity history for a GitHub-style contribution graph. The component's entire schema is one table:

```ts
// src/component/schema.ts:9-21
progress: defineTable({
  key: v.string(),
  lastPeriodKey: v.optional(v.string()),
  level: v.number(),
  maxStreak: v.number(),
  scope: v.string(),
  streak: v.number(),
  subjectRef: v.string(),
  updatedAt: v.number(),
  xp: v.number(),
}).index("by_scope_subject_key", ["scope", "subjectRef", "key"]),
```

One row per `(scope, subjectRef, key)`. No day-by-day log, no timestamps beyond `updatedAt` (last write only), no way to reconstruct "was day N active" after the fact. We build that table ourselves no matter what happens with this component — it stores none of the data the profile screen needs to render. So the component's value proposition, if any, is narrowly "current streak count + XP/level bookkeeping," not "the activity history engine."

### 2. Single-`key`-per-subject does not fit "multi-action streak" naturally

`accrue` and `recordActivity` are keyed on `(scope, subjectRef, key)` (`src/component/mutations.ts:35-43`, `:99-107`). A "multi-action streak" — where completing *any* of several action types on a given day keeps the streak alive — has no representation here. To make one streak fed by N action types, the host has two options, both bad:

- **Pick one `key` and route every action type's `recordActivity` call through it.** This works mechanically (the row doesn't care what "activity" means), but then `expectedPrevious`/`periodKey` collisions between action types become a host-side coordination problem: if two different action types both fire `recordActivity` for the same `periodKey` on the same day, the second call's `samePeriod` branch (`mutations.ts:111,118`) just no-ops, which is *fine* for "was this day active", but the component has no concept of *which* action satisfied the day, so it can't back the contribution graph or "you kept your streak alive via journaling, not check-ins" copy.
- **Give each action type its own `key`, and have the host compute a derived "any of these N streaks is non-expired" union at read time.** Now the component's per-key `streak`/`maxStreak` numbers are wrong on their own (they're single-action streaks) and the host is re-deriving the actual multi-action streak from scratch anyway — at which point the component has added a layer of indirection with no logic reused.

Either way, the host ends up writing and owning the "which actions count toward the streak, on which day" logic. That's the hard part of "multi-action streak restructure," and the component doesn't touch it.

### 3. Maintenance risk is real and not offset by much reused logic

`package.json:2-3` — version `0.1.0`, not on the npm registry (confirmed absent per the ticket; README also states `registry availability is not asserted` — `README.md:33-35`). There is no `dist/` in the vendored tree — only `src/`, so nothing has even been built. To use it at all we would have to:

- vendor a built copy (currently not built — `pnpm build` was never run against this tree), or
- pull it as a git dependency against `github.com/vllnt/convex-progression` (single-maintainer repo, `README.md:134-138`, no org backing), or
- fork it into our own `convex/` tree, at which point it stops being "a dependency" and starts being "code we now own and must maintain identically to code we'd have written ourselves" — except it wasn't written for our schema, our auth model, or our multi-action requirement, so day one of ownership is a rewrite.

Given §2 (the core data shape doesn't fit) and the fact we must write the activity-history table ourselves regardless (§1), there's no scenario where installing this component nets us less code to maintain than writing our own `streak.ts`-adjacent mutations against our own schema, in our own file, following our own conventions (`convex/lib/streak.ts`, `convex/jobs/profileStats.ts` already exist and work).

### 4. Test coverage doesn't clear the bar this system needs

The package's own README is explicit about the limitation, unprompted:

> Tests use the `convex-test` in-memory simulation (`@edge-runtime/vm`), not a real Convex backend. They do not prove production OCC retries or scheduler behavior. (`README.md:114-115`)

And on its supplementary local-backend smoke script:

> This is bounded smoke evidence, not proof of every conflict schedule or production workload. (`README.md:126-128`)

This is honest and appropriately hedged — better than most vendored code's self-assessment — but it means the two properties that matter most for a *streak system under concurrent writes* (two sessions completing near-simultaneously, a scheduled `eraseSubject` batch racing a live `accrue`) are exactly the properties never verified against a real backend. `src/component/adversarial.test.ts` (119 lines, 5 `test()` blocks) checks XP overflow, threshold validation on reads with no row, streak-counter overflow, and partitioned erase — all boundary-value tests against the in-memory simulator, not concurrency tests. `src/component/lifecycle.test.ts` (86 lines) is unread in the concurrency sense too — it's lifecycle/erase-flow coverage. Given our app is a mental-health product where a wrong streak (a false reset, a phantom continuation) is a trust-eroding bug, not a cosmetic one, "unverified under real concurrency" is disqualifying for a direct dependency, though it's a fine bar for patterns we reimplement and test ourselves under our own Convex mutation guarantees (which the codebase already relies on — see `.claude/rules/convex_rules.md`'s mutation-as-transaction guidance).

## What's actually worth borrowing

### `expectedPrevious` gap detection (borrow the shape, not the code)

```ts
// src/component/mutations.ts:110-118
const lastPeriodKey = existing?.lastPeriodKey;
const samePeriod = lastPeriodKey === arguments_.periodKey;
const consecutive =
  lastPeriodKey !== undefined &&
  lastPeriodKey === arguments_.expectedPrevious;
const continuedStreak =
  consecutive && existing !== null ? existing.streak + 1 : 1;
const streak =
  samePeriod && existing !== null ? existing.streak : continuedStreak;
```

This is a clean way to make gap detection a pure string comparison instead of arithmetic on timestamps: the host computes "yesterday's period key" and passes it in, the writer just checks equality. It composes well with a per-action-type activity log (each write already knows its own `periodKey`).

Our current implementation instead re-derives "was the last session today/expired/a gap" from raw timestamps at write time (`convex/jobs/profileStats.ts:41-60`) plus a separate, **read-time** recompute for display staleness (`convex/lib/streak.ts:17-31`, used by `profile.ts:getSummary` per its own comment). That read-time recompute is something `convex-progression` has **no equivalent of** — its `get` query (`src/component/queries.ts:9-50`) only recomputes `level` from fresh `thresholds`, never re-derives whether `streak`/`lastPeriodKey` has gone stale relative to "now". If a client never calls `recordActivity`, a `get` an hour before a 48-hour cutoff and a `get` an hour after both return the same stale `streak` number. Our existing `displayStreak()` pattern is strictly better for a UI that must never show a live "3-day streak!" past its expiry, and is worth keeping regardless of what happens with `recordActivity`'s gap shape.

### Threshold ladder as a plain array (`shared.ts:16-20`)

```ts
export function levelForXp(xp: number, thresholds: readonly number[]): number {
  return thresholds.reduce((level, threshold) => {
    return xp >= threshold ? level + 1 : level;
  }, 0);
}
```

Trivial, but a clean host-supplied-ladder pattern if XP/leveling becomes part of the new streak system's scope (it isn't described as such in #424/#426, but the map issue may still want it later). Not worth adopting the component for this alone — it's four lines to reimplement.

## Summary table

| Concern | Finding | Verdict |
|---|---|---|
| Install/maintenance | Unpublished single-maintainer package, no built `dist/`, would require vendoring/forking to use at all | Too much risk for too little reused logic |
| Multi-action streak fit | One row per `(scope, subjectRef, key)` — no representation for "N action types feed one streak"; host must fake it either way | Doesn't fit; core hard part unaddressed |
| Activity-history / contribution graph | No day-by-day log at all, only last-write state | We build this regardless; component adds nothing here |
| `expectedPrevious` gap detection | Good pattern | **Borrow the shape** |
| XP/level ladder | Good pattern, trivial to reimplement | **Borrow only if XP is in scope** |
| Test rigor | `convex-test` in-memory sim + bounded local-backend smoke, explicitly not proof of concurrency/OCC correctness (README says so itself) | Insufficient for a trust-critical streak counter as a black-box dependency |

## Where this lands

- Branch: `research/convex-progression-eval` (throwaway, pushed to origin, not merged, no PR).
- This file: `docs/research/convex-progression-eval.md` (new convention match: `docs/research/` already exists with two prior notes, `docs/research/typesafe-jev-ai-pipeline-analysis.md` and `docs/research/typesafe-jev-for-ai-pipeline.md`; this file follows their header-block style).
- Baseline compared against: `convex/schema.ts:102-135` (`emotional_profiles.currentStreak/longestStreak/lastSessionAt`), `convex/lib/streak.ts`, `convex/jobs/profileStats.ts:40-67`.
