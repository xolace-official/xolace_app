# Intake signals feed the first-session mirror prompt — not routing, not persisted, not the classifier

Post-onboarding intake (`convex/intake.ts`, `intake_responses` table) captures
eleven answers, but none of it has ever reached `convex/ai/`. The question
this ADR settles: which intake fields, if any, are allowed to influence a
session, where in the pipeline, and how far that influence is allowed to
reach. This is a precedent decision — it is the first time user-declared
intake data is allowed to feed a generation prompt, alongside the Cognition
Layer Constitution's Understanding/Memory model (`docs/cognition-layer-architecture.md`),
so it needs to be explicit about what it does *not* license.

**What's in scope: two fields, one prompt.** Of the eleven intake answers,
only `disclosureStyle` (`all_at_once | bit_at_a_time | keep_it_brief | depends`)
and `emotionAwareness` (`know_and_can_say | know_but_no_words |
something_off_unclear | numb_or_cant_tell | prefer_not_to_say`) are treated as
personalization-eligible signals, together named `intakeSignals`. They are
distinct axes, not degrees of the same thing: `disclosureStyle` is
**willingness** (how much they want to write), `emotionAwareness` is
**capability** (whether they have words for it at all). A user can be
maximally willing and still have no access to what they feel — that's not a
contradiction to resolve, it's two separate things the mirror can speak to
differently. No precedence rule is coded between them; see below.

**What's explicitly out of scope, and why.** `intent`, `copingStyle`, and
`supportFrequency` are plausible future signals (notification cadence, reach
style, closing copy) but are deferred — undesigned, not rejected.
`weighingOn` (life-domain multi-select: work, relationships, money, etc.) is
flagged as a likely **anti-pattern**, not just deferred: priming a mirror with
"you said work is weighing on you" before the user has said anything in-session
reads as surveillance, not personalization. If it's ever revisited, that
objection has to be argued down explicitly, not routed around silently.
`ageBracket`/`acquisitionSource` are not personalization signals at all
(ASO/marketing).

**Not routing.** The entry type (`open_prompt | guided_entry | body_scan |
word_cloud | voice`) stays 100% the user's own choice. `intakeSignals` never
picks a default entry mode — an earlier draft of this decision proposed a
capability/willingness → entry-type default matrix and it was rejected before
being built. Routing off intake would mean the system deciding how guarded a
user is on their behalf; personalizing the mirror's *language* after they've
already chosen is a materially different, and much smaller, claim.

**Not persisted.** `intakeSignals` is assembled fresh per request in
`buildSessionContext` (`convex/ai/context.ts`), gated behind the existing
`isFirstSession` check (`sessionCount === 0`), and flows straight into the
articulator prompt for that one generation. Nothing is written back —
no new `emotional_metadata` field, no `preferences` field seeded from intake,
no schema change, no migration. If capability or willingness turns out to
differ from what intake claimed (session 2 looks nothing like session 1),
there is no stale flag anywhere to contradict it, because nothing was stored.

**Not the classifier.** `intakeSignals` only reaches `prompts/articulator.ts`
(via `clarify.ts`). The classifier's job is emotion classification; intake
context isn't a new signal it needs, and adding it there would be feeding a
model call something outside its Constitution-scoped purpose.

**Corroboration is a prompt instruction, not a code gate.** The articulator
receives both the intake claim and this session's actual behavior signals it
already has (`entryType`, `rawInput` length, turn count), with an instruction
to only acknowledge an intake trait when this session's actual behavior
matches it. A user who claimed `keep_it_brief` at intake but wrote three
paragraphs this session should not be told "it's okay that you don't share
much" — that reads as not listening, which is worse than saying nothing. This
was deliberately *not* built as a coded threshold (e.g. `rawInput.length < N`)
that suppresses the signal before it reaches the prompt: the articulator
already synthesizes multiple context inputs into tone, and a second
hard-coded judgment call here would just be another place re-deriving a
decision the model can make once, given the right inputs — the same reasoning
that keeps precedence between the two axes (capability-gap phrasing vs.
willingness phrasing, when both fire) unhardcoded and left to the prompt.

**Opt-outs are omitted, not guessed.** `emotionAwareness: prefer_not_to_say`
(there is no equivalent option on `disclosureStyle`) means that field is left
out of `intakeSignals` entirely — the prompt has nothing to blend for that
axis. An opt-out means "don't use this," not "guess anyway."

## Consequences

**No schema or migration.** This is a read-only addition: `context.ts` reads
the existing `intake_responses` table (already indexed `by_profile`) and
passes two fields into one prompt. Everything about this decision is
reversible by deleting a few lines in `context.ts` and `articulator.ts`.

**Cost is bounded.** The `intake_responses` query only runs when
`isFirstSession` is true — zero added cost on every other session.

**A precedent, not a pattern.** This decision licenses *these two fields, in
this one prompt, for session one only*. It does not establish "intake data
can feed AI features" as a general rule — each of the deferred fields
(`copingStyle`, `intent`, `supportFrequency`) needs its own pass through this
same scrutiny (routing vs. language, corroborated vs. trusted, persisted vs.
stateless) before it's added, and `weighingOn` needs its surveillance
objection argued down explicitly if it's ever reconsidered.

**Revisit trigger.** If real usage shows `disclosureStyle`/`emotionAwareness`
frequently diverge from session-one behavior (corroboration rarely fires), the
signals are cheap to drop — nothing downstream depends on them existing. If
they prove useful beyond session one, that's a new decision: whether to keep
using intake as a first-session-only prior, or let it fade into whatever
`semantic_profiles` observes once there's real session history to write from.
