# Architecture Context

Recorded decisions that reviews and future refactors should treat as settled.
One entry per concept; newest first.

## Word cloud can reach (2026-09-04)

Reverses the entry-type exclusion in
[`docs/confidence-aware-mirroring.md`](docs/confidence-aware-mirroring.md) §3.5.
`word_cloud` is now reach-eligible; `body_scan` is not. The pair that used to
move together has been split.

The exclusion was measured, not guessed — 98.6% of word clouds sit at `sp <= 2`,
so unexcluded they would have been 58.5% of all reaching sessions. That number
is overridden, not refuted. The reasoning it rested on ("those users chose to
say little") stopped holding once the reach became interrogative (below): the
alternative to a reach is no longer a flat statement of shortfall, it is a
question answerable with one tap on "Say more".

**The accepted consequence is that the reach becomes the ordinary word-cloud
experience.** Word-cloud specificity is `sp <= 2` almost always, so the gate
collapses to `!memoryConnected` for that entry type. The same-day guard is the
only thing bounding it. No word_cloud-specific limiter: for a tapped entry,
specificity measures the format, not the gap, so tightening the cutoff would be
a threshold pretending to be a signal.

No ADR — `REACH_ELIGIBLE_ENTRY_TYPES` is one set literal, and reversibility is
the criterion that fails.

## Xolacer rating: decoupled from conversation lifecycle (2026-09-03)

The rate entry point used to live only in `ThreadStatusBar`, which renders
only when a conversation is **not `open`**. The one seeker-reachable path out
of `open` is the 14-day quiet sweep, so a seeker could not rate a xolacer for
~two weeks — and the entry point, a small underlined link, was missed even
then. `canRate` never actually required `resting`; placement did.

**Eligibility is now `role === "user"` + not blocked + `messageCount >= 15`**,
evaluated on any status including `open`. `hasRealExchange` (≥ 1 message
after accept) stays as the floor beneath the count. **15 is provisional** —
a tunable constant to retune once analytics exist, not a settled truth.

**`messageCount` is a new server-side counter** on `xolacer_conversations`,
incremented in `notifyNewMessage` (Stream `message.new` webhook) **before**
its `status !== "open"` early-return, so messages in a `resting` thread still
count. Existing rows start at 0; no backfill. It exists because message
content lives in Stream and the `canRate` predicate had nothing to count.

**Placement.** The xolacer profile screen is the primary home: a prominent
rate card in the action area (replacing the stars-only row), shown once the
bar is met, collapsing to a quiet "You rated ★N — change" line after the
first rating. The thread keeps a rate entry in the overflow menu
(`XolacerMenu`); the existing post-quiet `RatePrompt` stays. No inline nudge
inside the message list.

**Reversed here, not elsewhere.** The "quiet, skippable, ignoring it is the
default" stance in the `RatePrompt` / `RateConversationScreen` docstrings is
deliberately reversed **for the profile surface** — discovery failed, so that
surface is prominent until the first rating. Every other surface keeps the
low-key posture.

**Unchanged.** Single 1–5 overall score, one editable `conversation_ratings`
row per conversation, `MIN_RATINGS_TO_DISPLAY = 5`.

**Deferred, not rejected.** Optional written reviews with a 7 Cups-style
moderation → staged-visibility pipeline. It will happen; migration is a safe
additive change (`review` / `reviewStatus` fields on `conversation_ratings`,
optional `review` arg on `rateConversation`), so nothing is pre-built now.

**Separate follow-up.** Auto-resting window 14d → 7d (`RESTING_AFTER_MS`) —
now purely a xolacer-capacity change, since rating no longer depends on it.
A seeker-side manual "wrap up" was considered and rejected: it would force a
seeker who wants to rate to first end a conversation they may want to keep,
and archive already covers "off my list."

See [ADR 0005](docs/adr/0005-rating-decoupled-from-conversation-lifecycle.md).

## Intake, and the two onboardings (2026-08-28)

Two flows in this repo both want the word "onboarding". They share nothing —
different gate, different side of auth, different storage — so they get
different words.

- **Intro** — the pre-auth flow (promise, frame). Route group
  `(onboarding)`, gated by the **client-side** Zustand `introSeen` flag plus
  `!isAuthenticated` (`src/app/_layout.tsx`). Unchanged; it keeps the group
  name.
- **Intake** — the post-signup flow: founder message → segmentation
  questionnaire → Xolace+ paywall. Gated **server-side** by
  `emotional_profiles.onboardingComplete`. Route group `(intake)`, table
  `intake_responses`, capture stamp `intakeVersion`.

`onboardingComplete` **keeps its name** — renaming a live field read by
`convex/ai/context.ts` to fix a documentation problem is the migration the
"two Reaches" entry below already rejected. It was a dead flag until intake
shipped: written `false` at user creation and never set true by anything,
which is why every pre-intake user is correctly ungated with no backfill.

**Intake data is not session data, and does not age like it.**
`preferences.dataRetentionPreference` (`6_months` / `1_year`) auto-purges the
record of what someone said in *sessions*. It does **not** touch
`intake_responses` — those are stable profile facts whose consumers
(mirror-tone default, follow-up cadence, cohort segmentation) are permanent,
and a user silently losing their disclosure-style default six months in would
present as "the app got worse and nobody knows why." This is a deliberate
exception to how everything else on the pseudonymous side ages. Both
`dataWipe` and `accountDeletion` **do** purge the row — it is per-profile data
about a feeling human. Consequence: a wiped user keeps
`onboardingComplete = true` and is not re-interrogated; the flag and the
answers have different lifetimes on purpose.

**Clinical-scope override.** `CLAUDE.md`'s "not clinical — no diagnoses, no
therapeutic terminology" principle is deliberately relaxed **for intake
questions only**, by founder ruling: intake may explore anything that
genuinely improves the value Xolace delivers. This does not loosen the
principle anywhere else — the mirror, the reflection agent, and all
user-facing session copy remain bound by it.

**Heavy-answer follow-up floor.** Two intake answers soften the first
session's follow-up cadence, derived at read time, never stored:
`copingStyle` contains `outside_things` **or** `weighingOn` contains `a_loss`
→ floor the first session's follow-up tier at `elevated`. Never `acute` —
that is reserved for a live safeguard crisis signal, and a multiple-choice
tap is not one. The floor expires after the first session; from S2 on
`followUpTier()` governs on real session signals alone.

Full spec: [#234](https://github.com/xolace-official/xolace_app/issues/234),
under map [#229](https://github.com/xolace-official/xolace_app/issues/229) —
**map complete (2026-08-29): R1, R2, T1–T7 all resolved, spec fully locked.**
Funnel instrumentation spec is
[`docs/notes/t7-intake-instrumentation.md`](https://github.com/xolace-official/xolace_app/blob/research/t7-intake-instrumentation/docs/notes/t7-intake-instrumentation.md).

## The reach becomes interrogative (2026-08-25)

Reverses the confidence-aware-mirroring standing constraint that the reach is
"declarative, never interrogative — the button is the question"
([`docs/confidence-aware-mirroring.md`](docs/confidence-aware-mirroring.md)
§1, §4.1). The `reaching` claim strength (first faint-signal mirror only —
`holding`, the second/final try, is untouched) now closes on an explicit
follow-up question instead of a flat statement, still delivered as one
smooth, continuous utterance: name what's present, acknowledge the gap,
then ask.

**One prose block, one conditional instruction — no new `claimStrength`
value, no new field threaded through `routeClaimStrength` /
`decideMirrorOutcome`.** The articulator already receives the semantic
profile block; the question clause is a scoped exception to subtraction 1
("do not add a dimension they didn't give you"), which still binds the
reflection clause.

**Question specificity branches on what Xolace already knows:**
- No semantic profile (cold start) → the question stays unspecific, points
  at the shape of the gap, never proposes content.
- A semantic profile exists → the question may name a specific guess drawn
  *only* from that profile, never fabricated. Off-track episodic memory
  (below the connect floor) stays exactly as restricted today — recognition
  only, never a basis for a guess. The two sources are not interchangeable:
  the profile is a built trajectory: legitimate signal, and per-session RAG
  noise below the floor is not.

**"Say more" is the answer path, unchanged.** Same button, same generic
label and "Recommended" pill — no new capture UI for the question's answer.

**Validation:** the additive/interrogative framing was prototyped and
rejected 5 rounds running against the real articulator in ticket #171 (the
same finding this reverses), so the wording was not edited in directly — it
was re-prototyped over 6 further rounds in #216 and only then shipped. What
those rounds moved is recorded in
[`docs/confidence-aware-mirroring.md`](docs/confidence-aware-mirroring.md)
§4.1; the short version is that the question survives only when the base
"questions should be rare" rule is suspended by name, and the profile is
safe only when it is confined to the question and barred from the reflection.

Worth an ADR now that wording has landed — hard to reverse, surprising without this
history, and a real resolved trade-off. Not yet written; this entry is the
interim record. `docs/confidence-aware-mirroring.md`'s "specified, unbuilt"
status line is also stale — the mechanism it describes already shipped.

## Conversation delete (2026-08-24)

**Delete** is scoped to `xolacer_conversations` rows the requester never got
to open — `status: "closed"` with `closedReason` of `"declined"` or
`"expired"` only. Both close reasons are request-stage outcomes that never
reach `acceptRequest`, so no Stream channel, message, or rating exists on
them yet — deleting one destroys nothing the other party has invested in.
Deleting an `open`, `resting`, or `blocked`/`xolacer_left` row is explicitly
out of scope until a retention policy for those exists; **archive** (above)
is the only per-user hide available on a live conversation today.

Delete is a **per-user flag** (`deletedByUser` / `deletedByXolacer`), the
same shape as archive's per-side visibility, not a row-level hard delete —
one side deleting a shared request row can never unilaterally destroy the
other side's copy of it. Unlike archive, delete does **not** reverse on new
activity — there is none to reverse, since these rows are already terminal.
Once **both** sides' flags are set, the row is hard-purged from the DB
inline in the delete mutation itself — no cron, no age-based sweep. This
mirrors the "nothing references it, so remove it the moment both parties are
done" instinct behind `sessionCascade`, scoped down to a single row instead
of a batch job.

## Manual close = early resting (2026-08-24)

**Close**, as a user-facing action, is not a new terminal state. It is the
**xolacer manually triggering the existing `resting` transition** on an
`open` conversation before the automatic 14-day-quiet sweep would do it —
same state, same effect (frees the xolacer's capacity slot), earlier. It is
**xolacer-only**: `resting` exists to manage the xolacer's own active-load
cap, and a seeker wanting a conversation off their own list already has
**archive** for that; there is no seeker-facing "close."

Manually resting a conversation does **not** make it read-only — `resting`
already lets both sides keep messaging today, and this feature does not
change that. A genuinely message-blocking close is a different, unbuilt
feature; do not conflate the two if it's proposed later.

`resting` rows now carry `restingReason: "manual" | "quiet"` so a
xolacer-initiated wrap-up is distinguishable from the silent 14-day timeout
in copy and analytics — added now while it's a single free enum value,
before any `resting` rows exist that would need backfilling.

**Known adjacent risk, explicitly out of scope**: whether a `resting`
conversation still counts against the xolacer's open-slot cap while
messaging continues in it — i.e. whether resting-then-messaging lets a
xolacer exceed their cap — is unconfirmed and not part of this feature.
Flagged for separate investigation, not blocking here.

## Conversation archive (2026-08-24)

**Archive** is a per-user, per-side visibility flag on `xolacer_conversations` —
distinct from `status`, which is shared state both parties see identically.
Archiving hides a row from the archiver's own chats list only; it never
affects what the other party sees, and there is no "both sides archived"
merge the way delete has one.

Any status is archivable — `requested`, `open`, `resting`, or `closed` — the
action means "hide this row from my list," nothing narrower. An archived row
**un-archives itself** the moment new activity lands on it (a new message, a
status change) for the party who archived it — it reappears in their active
list without them having to remember to check an archive tab. This is
deliberate: this is a support app, and a live conversation silently buried
behind an archive action is the wrong failure mode. Contrast with **delete**
(below), which does not reverse on new activity.

## The two Reaches (2026-08-20)

**Reach**, capital R, is the *notification* concept and has been since Phase 2:
the nudge that goes out to bring someone back, in `warm | direct | quiet`
variants, recorded as `notification_log.reachUsed`. It is shipped, its values
are stored, and it keeps the word.

**The reach**, lowercase, is a *mirror* concept from confidence-aware mirroring
([#170](https://github.com/xolace-official/xolace_app/issues/170)): on a session
the mirror cannot read clearly, it names only what is genuinely there and names
the gap explicitly. The two share nothing — different trigger, different
surface, different lifecycle — but they hang off the same
`emotionalProfileId` in the same feature area, so a search for `reachUsed`
lands in the notification log and looks like it is about the mirror.

**Prose may say "reach" for the mirror; code may not.** The mirror's persisted
per-session flag is `gapNamed`, never `reach*`. Renaming the notification
concept was rejected — a migration to fix a documentation problem — and so was
leaving the collision undocumented. The mirror's field was still unbuilt when
this was decided, which is the only reason the fix was free.

Full spec: [`docs/confidence-aware-mirroring.md`](docs/confidence-aware-mirroring.md).

## Campers, the cohort card (2026-08-20)

**Campers**, lowercase, is the general term for Xolace users — anyone who's
used the app, no other membership implied. It's the umbrella term the
by-the-fire metaphor names people by. `Camper XXXX`, capitalized with a
4-digit tag, is a narrower, already-shipped instance: the anonymous pairing
pseudonym in a xolacer's 1:1 conversation view (see "Camper pseudonym" below)
— a display name for one seeker within one pairing, not a claim about who
counts as a camper generally. The two don't conflict; the tagged form is just
the identity-hiding presentation of the broader term inside one specific
surface.

The **weekly cohort card** (Discovery screen) is the first feature to use
"campers" in its general sense: "22 campers sat with sadness by the fire this
week. You are not alone." It reports how many OTHER users (excluding the
viewer, excluding crisis sessions) had a session this calendar week whose
`primaryEmotion` or `secondaryEmotion` matched the viewer's own most recent
session's `primaryEmotion`. Below a floor of 3 matches, no number is shown —
a warm reassurance line runs without one, never a fabricated count. See
[ADR 0004](docs/adr/0004-weekly-cohort-card-materialized-aggregate.md).

## Camper pseudonym (2026-08-19)

A **xolacer** volunteering is a named party — `displayName`, consistent and
recognizable across every seeker they talk to. That's deliberate: a returning
seeker should be able to recognize the same volunteer, and there's no
correlation risk in a xolacer's own identity being stable, since it's public
by choice.

A **seeker** is the anonymous party in a pairing, shown to the xolacer as
`Camper XXXX`. Those four characters name a *pairing*, not a *seeker*: they
are drawn at random when the pair's `xolacer_conversations` row is created and
stored on it (`convex/lib/camperTag.ts`), so the name is stable only within
that one xolacer's relationship to that one seeker. The earlier version sliced
them off the seeker's own `emotional_profiles` id, which made every xolacer
who ever paired with them see the identical name — two xolacers comparing
notes could infer they shared a seeker. See
[ADR 0003](docs/adr/0003-random-per-pair-camper-tag.md).

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
