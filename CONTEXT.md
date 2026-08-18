# Architecture Context

Recorded decisions that reviews and future refactors should treat as settled.
One entry per concept; newest first.

## Today (2026-08-17)

**Today** is the tab: a feed of independent cards for the current UTC day, each
completable in any order, none blocking another. Not a wizard, not a checklist
you can fail. It is the second tab, and the renamed idle-menu row is its only
door from reflect — reflect stays the `/` landing and is untouched by this.

A **day** is a UTC calendar date, the same `YYYY-MM-DD` key `daily_quotes`
already uses. One clock across the whole feed: the day a mood belongs to, the
day a quote rotates on, and the day a streak counts are the same day by
construction, never by coincidence.

Three words for three different self-reports, and they must not be traded for
one another:

- **Daily Mood** — absolute, no session behind it. Today's Today card.
- **Shift** — `sessions.postSessionMood` (`lighter/same/heavier/unsure`). A
  *comparison* against the session just finished, meaningless without it.
- **Follow-up** — the sheet that surfaces a day or so after a session left
  something unresolved (`follow_up_cards`). Session-derived, scheduled, and the
  older owner of the phrase "check-in". Do not call a Today card a check-in.

**Daily Mood is valence, not emotion** — `heavy / low / steady / good / light`,
ordered, with the emoji as presentation and the word as the accessible name.
The midpoint is `steady`, meaning *fine*; numbness is `low`, not the middle.
Conflating "nothing much" with "I feel nothing" is the mistake the naming
exists to prevent. Emotion *categories* are the classifier's job and live in
`emotional_metadata.primaryEmotion` — see
[ADR 0002](./docs/adr/0002-mood-is-valence-not-emotion.md).

**Completion is per-card and per-day, and each card owns a different claim.**
Mood is complete when a value is set — re-pickable all day, last write wins,
because a self-report you cannot correct is one people avoid making early. The
starter prompt is complete **on tap**: it hands reflect a 24h prompt and stops
caring, deliberately shorter-lived than the 7-day awareness-event prompt it
borrows the mechanism from. The quote card claims only **`quoteShared`** — a
destination was picked in the share sheet. The platform gives us no signal that
anything was actually posted, so the flag is named for the claim it can defend.

**The counter's denominator is what *you* can reach**, never a fixed 3. A card
gated behind Xolace+, or hidden because its input does not exist yet, leaves
the denominator rather than sitting permanently incomplete. A total a user
cannot reach is a guilt mechanic, and this product does not ship those.

**The check-in streak is recorded but not rendered.** Consecutive UTC dates
with a mood set, broken by any gap — a *date* rule, deliberately not the
timestamp-based "resets after 48 hours" of `emotional_profiles.currentStreak`,
which is about to be reworked. There are no stored counters: the day rows are
the streak, derived on read when a surface finally needs one. Two visible
streak numbers in one app is a contradiction, so this one stays internal until
the reflect streak rework decides what a streak means.

**Today owns no gates and no generation rules of its own.** The quote row
renders whatever `dailyQuotes.getToday` returns for that user — session-derived
for Xolace+, curated for everyone else — and never re-implements that gate.
Today does fire `coldStart` on mount, which makes it the second door to quote
generation; `/quotes` was the only one, and that was a latent oddity, not a
design.

## Push devices (2026-08-12)

A **device** is one installation of Xolace, identified by the Expo push token it
holds. Not a phone and not a person: reinstalling produces a new device, and one
person can hold several at once. Say *device*, not *installation* or *client*.

A device is **dead** when Expo will no longer deliver to its token — uninstalled,
or the token rotated and the row was left behind. A device is **dormant** when
the token is fine and the person simply has not opened the app. The two look
identical from the registry, and conflating them is the mistake this concept
exists to prevent: dormant is the exact state the return nudge is built to reach,
so only dead devices may be reaped for being unreachable. Absence is not death.

Dormancy is bounded elsewhere — both nudge families ignore anyone inactive for
more than 30 days — so a device left alone costs nothing. Reaping one wrongly
costs a person their notifications until they next open the app.

**Deadness is inferred, never reported.** Expo's receipts are unreachable behind
the push component, so death is read off five consecutive delivery failures. See
[ADR 0001](./docs/adr/0001-no-expo-receipts.md).

**Recipient** is the component's word, not ours. Every recipient is a device;
the term only appears where the two registries have to be kept in step.

## Presence (2026-08-11)

**Present** means one thing only: this person has Xolace in the foreground
*now*. It is a claim about the current moment, never about a habit. Rendered to
users as **"Here now"**.

There is exactly **one presence room**, app-wide, and one heartbeat per client
(30s; the component's session timeout is `interval × 2.5`, so a drop is visible
within 75s). Every presence signal in the product — roster ordering, the
counterpart on a pending request, a future ambient count — is a distinct
server-side query over that one room, not a room of its own.

**The privacy boundary is the query, not the room.** Membership of the presence
room must never reach a client: our `list` endpoint returns an empty array, and
each narrow query returns only its own derived answer. "Is this person in the
app" is not a globally readable fact.

A xolacer heartbeats only while `xolacer_profiles.active` is true — the
existing "You're listed" switch already means "I'm open to being reached", so
presence needs no consent surface of its own.

**Presence never overrides relevance.** In `sessionSuggestion` it is a sort term
inside `rankSuggestionCandidates`, never a filter. A xolacer who does not match
what someone is carrying is not suggested because they happen to be online.

Two sources, split by a hard boundary — **Stream owns the inside of an open
thread; Convex owns everywhere else.**

Stream, inside the thread only: it is the socket already held, so it costs no
second heartbeat, it fires `user.presence.changed` instantly rather than on
Convex's 75s floor, and it carries `last_active` ("here 20 minutes ago") which
Convex Presence cannot supply. Liveness matters most inside a live conversation,
so the more precise signal goes there.

Convex, everywhere else — roster, pending request, chats list, future ambient
count. These are the surfaces Stream structurally cannot reach: no channel
exists while a conversation is `requested`, and none exists for the roster.

The boundary is not negotiable per-component: `conversation-row.tsx` is outside
the thread and therefore reads Convex, even though a Stream answer is available.
Every surface reads presence through one accessor (`useIsPresent`) so the source
behind it stays swappable.

The two definitions differ — Stream means "socket connected", Convex means "app
foregrounded" — and will occasionally disagree. That is accepted: in practice
both track foreground, and where they diverge the thread header is the more
accurate of the two.

Typing indicators are a separate, stronger signal and outrank presence wherever
both could show.

**Responsiveness** — how quickly a xolacer *historically* answers — is a
different concept and deliberately unbuilt. At 13 accepts across 10 xolacers
there is no per-xolacer median to compute. Do not conflate it with presence.

## Poolability (2026-07-21)

`convex/lib/poolability.ts` `isPoolable(session)` is the single owner of "may
this session's text enter the shared anonymous peer pool" — the one place user
text is allowed to leave their private space. It gates on three fields:
`kept === true`, `contributedReflection === true` (fresh consent, re-checked at
run time because the opt-in can be revoked between enqueue and execution), and
`safeguardLevel !== "crisis"`. `jobs/reflectionAnonymizer.anonymize` is the only
caller; a new gate (e.g. a future `redacted` flag) goes in the predicate, not at
the call site. Truth table lives in `poolability.test.ts`.

The pool is the **only** cross-user surface. Do not fold the distiller or
episodic-memory gates into this predicate — they answer different questions with
private destinations (see `docs/notes/poolability-scope.md`).

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
