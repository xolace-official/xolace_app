# Confidence-Aware Mirroring

**Status:** specified, unbuilt. Every decision below is settled; nothing here is
an open question unless it says so under [Provisional and open](#provisional-and-open).

**Provenance:** charted and resolved as Wayfinder map
[#170](https://github.com/xolace-official/xolace_app/issues/170) across 13 decision
tickets. This document is the handoff artifact — the build session should not need
to read the tickets, but each section links the ticket that settled it, and the
tickets hold the rejected alternatives and the measurements.

---

## 1. The problem

When there isn't enough context — a first session, or `"I am sad"` with nothing
attached — the mirror asserts a reflection anyway. It doesn't land, and the user
reads confident-but-wrong as *"this is all the mirror can do."*

The mirror should instead show that it knows its own limits, which is itself an
honest read, and make the next move obvious.

### Standing constraints

These bound every decision in this document. They are the reason several obvious
implementations were rejected.

- **The fire is not a participant.** The mirror illuminates; it does not converse.
  This is why the reach was **declarative, never interrogative** — the button was the
  question. **Superseded for `reaching` only by
  [#216](https://github.com/xolace-official/xolace_app/issues/216)** (see §4.1): that
  first mirror now closes on a question. The constraint still holds everywhere else,
  `holding` included — one question, on one turn, answered through the same *Say more*
  button. Nothing became a conversation.
- **Continuity is not understanding.** The mirror may show it remembers, but if
  continuity is all it has, it must still name the gap. Recognition and
  understanding are separate claims and the mirror may assert only the one it has
  earned.
- **Never render an affordance whose only outcome is rejection.**
- **The gap is located in the input** — not in the mirror's viewpoint, and never in
  the user.
- **House prompt style:** constraints and NEVER rules only. No positive examples;
  they cause mode-collapse.
- **Cognition Layer Constitution:** re-classifying on a refinement turn is *not*
  re-derivation. New user input is signal the Understanding has never seen, so the
  extra model call is justified under the "genuinely new signal" carve-out.

### The core mechanism: the reach must subtract, not add

Established empirically in [#171](https://github.com/xolace-official/xolace_app/issues/171)
over 5 rounds against the real articulator.

**The reach cannot be won by adding rules to `getClaimStrengthInstructions`.**
Every NEVER stacked into the block made the reach *weaker*, because the block
argues against three standing instructions that are always on and all push toward
filling the gap:

1. **Core Rules** — *"add a dimension they didn't have words for… your expansion
   creates the 'yes, exactly' moment"*
2. **`getIntensitySpecificityGuidance`**, high-intensity/low-specificity branch —
   **"Ground it. Give the vague enormity a form."** This fires precisely when a
   reach is most needed. Direct contradiction.
3. **Memory** — Pattern Context *"let it actively shape what you notice"* plus the
   episodic *"you may acknowledge that quietly"*

Any change touching prompt behaviour on faint signal should assume additive NEVERs
will fail and reach for subtraction first.

**#216 is the one qualified exception, and it does not soften the rule.** The
interrogative reach (§4.1) did add NEVERs, and the rounds that worked were still
the ones that *removed* a standing instruction's grip: the question only survived
once the base `questions should be rare` rule was suspended by name. The NEVERs
around it fence a permission that was granted, they do not argue a standing
instruction down. Adding NEVERs to out-argue an instruction that is still on will
fail here exactly as it did in #171.

---

## 2. Claim strengths

`ClaimStrength` becomes a four-value union. `tentative` is **deleted**.

| value | when | what it sounds like |
|---|---|---|
| `reaching` | the gate fires and no reach has gone out on this session | names only what is present, then says plainly that what it attaches to is not in the words yet |
| `holding` | the reach already went out and the signal is still faint, or the session hit the cap having reached | names what is present, flatly, and ends on it — the absence is relocated into *how the feeling is arriving* |
| `measured` | the normal path | unchanged |
| `confident` | `confidence >= 0.75 && specificity >= 6` | unchanged |

`tentative` is deleted rather than retuned
([#175 §8](https://github.com/xolace-official/xolace_app/issues/175)). The shipped
block solicits correction — *"make it easy for them to say 'not quite' and correct
you"* — which is the interrogative move this design rules out, and *"reach toward
the feeling rather than pinning it"* is an additive fill instruction aimed at
exactly the faint signal where additive loses. Leaving it alongside the reach block
means two blocks firing on the same input, one naming the gap and one reaching past
it.

`claimStrength` is **never persisted**. It is derived at read time from
`emotional_metadata` plus session state, everywhere it is needed — including on the
wire to the client (§7).

---

## 3. The gate — when the mirror reaches

### 3.1 The rule

```
reach =  specificity <= 2
      && !memoryConnected
      && eligibleEntryType
      && !isEscalation
      && !profileAlreadyReachedToday
```

`confidence` is **not** in the conjunct.

### 3.2 Why confidence was dropped

[#175 §2](https://github.com/xolace-official/xolace_app/issues/175). The classifier's
confidence distribution is a discrete menu, not a continuum — `0.72`, `0.75` and
`0.85` alone account for 140 of 218 dev rows. Every candidate threshold in the
usable range lands on or beside a mode, so a **0.03 move swings the reach rate 8–13
points**. One prompt revision that shifts the model's favourite self-report doubles
the reach rate with no code change and no review. That is not a threshold, it is a
tripwire.

The `confident` pole keeps its `HIGH_CONFIDENCE` conjunct — that branch works, and
the same brittleness argues for leaving a working branch alone.

### 3.3 Why `specificity <= 2`

`LOW_SPECIFICITY` moves from `4` to `3` (i.e. the reach considers `sp <= 2`).
Settled behaviourally rather than by picking the distribution's valley
([#175 §3](https://github.com/xolace-official/xolace_app/issues/175)):

| band | n | % eligible | took a refinement turn |
|---|---|---|---|
| sp 1–2 | 51 | 38.6% | **17.6%** |
| sp 3–4 | 24 | 18.2% | **8.3%** |
| sp 5 | 4 | 3.0% | 0% |
| sp 6+ | 53 | 40.2% | 11.3% |

`sp 3–4` has the *lowest* refinement rate in the dataset — those mirrors land
better than the articulate ones do. The shipped `LOW_SPECIFICITY = 4` reached into
the band that least needs it. Caveat carried forward honestly: n=24 and 2 turns in
the `sp 3–4` cell, so the ordering is suggestive, not significant. It is still
strictly better evidence than the number it replaces, which had none.

**The gate measures faintness, not input length**
([#185](https://github.com/xolace-official/xolace_app/issues/185)). The two are
tightly coupled — Spearman 0.81, and `sp <= 2` agrees with `len < 40` on 89% of 127
clean dev sessions — but specificity is right in all 14 disagreements. Do **not**
add a length term: a length rule reaches at `"I just want to end myself"` (26
characters, specificity 8).

### 3.4 `memoryConnected`

[#172](https://github.com/xolace-official/xolace_app/issues/172).

```ts
const memoryConnected =
  episodicTopScore !== undefined && episodicTopScore >= EPISODIC_CONNECT_FLOOR;
```

`EPISODIC_CONNECT_FLOOR = 0.35` — **provisional**, see §10.

Today `searchEpisodicMemory` (`convex/ai/process.ts`) calls `rag.search`,
destructures only `entries`, and **discards the score**, which lives on the sibling
`results` array (`{ entryId, score }`). So the system's implicit answer today is
*"memory connected iff the namespace is non-empty"* — vector search always returns
its nearest neighbours regardless of distance, so three arbitrarily-far memories go
into the prompt on every non-cold-start session. That is the defect.

**The build:** join `results` → `entries` by `entryId`, take the highest score,
persist it as returned by `rag.search` (do not recompute or normalise).

**Three rules that are easy to get wrong:**

- **Do not write `(score ?? 0) < FLOOR`.** Cold start has **no** score, not a zero
  one — `process.ts` short-circuits `isFirstSession` to `[]` before the search ever
  runs. The verdict is the same either way, but coalescing puts a spike at zero into
  the calibration distribution for **13.2% of prod eligible sessions**, and that
  only bites at calibration time, which is exactly when it is too late to recover
  ([#182 finding 4](https://github.com/xolace-official/xolace_app/issues/182)).
- **Flag, do not filter.** Do **not** set `vectorScoreThreshold` on the search.
  Below-floor memories still reach the articulator — memory stays on the reach path,
  and removing it would also remove the ability to name the return. What stops
  memory being spent as understanding is subtraction 4 (§4.3), not a filter.
- **One boolean, not tri-state.** "Nothing retrieved" and "retrieved but off-track"
  collapse to the same value. The mechanical difference is handled by subtraction 4
  narrowing what recognition may refer to, and `isFirstSession` / `recentSessions`
  already carry what is needed.

**Store the score, not the verdict.** Persisting a number keeps the floor
retroactively tunable and historical sessions re-scorable without a backfill; a
stored boolean would bake today's uncalibrated guess into history permanently.

### 3.5 Entry-type eligibility

Reach on `open_prompt` / `guided_entry` / `voice` / `word_cloud`. **Never**
`body_scan` — a tapped body area is low bandwidth by choice, so faintness there is
the format, not a gap in what they gave. `body_scan` has 0 sessions in the dataset,
so its exclusion is reasoning rather than measurement.

**`word_cloud` was excluded here until 2026-09-04. That exclusion is reversed.**

The original ruling was measured, not guessed
([#175 §7](https://github.com/xolace-official/xolace_app/issues/175)): of 73
`word_cloud` sessions, **72 (98.6%) sit at `sp <= 2`**, so unexcluded, word cloud
would have been **58.5% of all reaching sessions** — the reach would become the
word-cloud experience and be judged on the entry type it was never designed for.

That measurement still stands and was **knowingly overridden**, not refuted. What
changed is the reading of it. The exclusion assumed a tap-only user does not want to
be asked for more. But "the mirror cannot see what this attaches to" was true of
those sessions too, and suppressing the reach did not make it less true — it just
made the mirror assert a read it had not earned. Since the reach became
interrogative (`CONTEXT.md`, 2026-08-25) the alternative is no longer a flat
statement of shortfall; it is a question the user can answer with one tap on
"Say more". So:

**Accepted consequence, stated plainly:** word-cloud specificity sits at `sp <= 2`
almost always, so for that entry type the gate collapses *in practice* to
`!memoryConnected` — the `sp < LOW_SPECIFICITY` check is still evaluated at runtime,
it just almost always passes. Nearly every word cloud without an episodic hit — every
cold start, every first-week user — now gets a question rather than a mirror. **The reach is the ordinary word-cloud
experience.** That is the intended behaviour, not a side effect.

**What bounds it:** the specificity gate still runs (the ~1.4% of word clouds at
`sp >= 3` do not reach), plus the same-day guard (§3.7), one reach per profile per
calendar day. Nothing else. No word_cloud-specific limiter was added: for this entry type
specificity measures *the format*, not *the gap*, so a lower `sp` cutoff barely
bites (the distribution bunches at 1–2), and finding a separate faintness signal for
tap-only modes is research, not a gate change.

**How to revert:** `REACH_ELIGIBLE_ENTRY_TYPES` in `convex/ai/routing.ts` is one set
literal. `gapNamed` is persisted per session with a `by_profile_gapNamed` index and
`entryType` sits on the same row, so the 58.5% claim is re-measurable on production
data with no new instrumentation. If it lands badly, remove the string.

**Prompt consequence:** `getEntryTypeInstructions("word_cloud")` normally asks for
"a complete emotional picture", which contradicts reaching's "there is not enough
here to build a full mirror" and invites holding to fill in behind the words. Those
blocks can now co-occur, so that one sentence drops on the faint path. The other two
— "these ARE their language" and "do not add emotions not implied by the words" —
stay, because the reach needs them harder than the normal path does.

### 3.6 The escalation guard

[#188](https://github.com/xolace-official/xolace_app/issues/188). **A session the
safeguard has escalated never reaches.**

The gating signal is `isEscalation` (= `safeguard.level` is `crisis` or `elevated`
with a `triggerType`), **not** `isCrisis`:

| signal | population |
|---|---|
| `isCrisis` | `level === "crisis"` only |
| `isEscalation` | `crisis` OR `elevated` with a `triggerType` — in practice `level ∈ {crisis, elevated}` |
| `riskFlag` | `isEscalation` minus `pattern_escalation` |
| `level !== "none"` | adds `gentle` |

`isEscalation` is chosen because **it is exactly the flag that replaces the mirror
screen**. `projectScreen` (`src/features/reflect/session-service.ts`) routes
`escalationTriggered` to the `escalation` screen, and `EscalationState` has no
action row at all. So the rule has a shape that is not a heaviness threshold:

> **The mirror does not reach where the mirror screen is not what the user is being shown.**

Gating on the same flag means the exemption cannot drift out of sync with the
screen. `isCrisis` was rejected because it misses `elevated` entirely and whether a
given session lands in crisis or elevated depends on a moderation `self-harm` score
that is never persisted, so the choice could not be verified retroactively.
`level !== "none"` was rejected because `gentle` presents **zero resources** and
does not change the screen.

Measured: dev holds `"I wanna die "` — 12 characters, **specificity 2**, intensity
9 — which sits inside the gate. The overlap is real, not hypothetical.

**Deliberate residual:** heavy-but-faint *sub*-escalation sessions still reach. That
is correct, not a gap to close. High intensity with low specificity is precisely the
case where `getIntensitySpecificityGuidance` says *"Ground it. Give the vague
enormity a form."* — where a reach is **most** needed. The exemption tracks the
screen change, never the weight of the feeling.

### 3.7 The same-day guard

[#181 §3](https://github.com/xolace-official/xolace_app/issues/181). **Never reach
twice in the same calendar day**, per profile. Provisional and explicitly reviewable
on real feedback and data.

Justified without any burst evidence: whatever causes two sessions in one day, the
mirror saying it cannot quite see, twice, before dinner is bad on its face. It is a
correctness guard, not rate management, so it does not collide with §9's ruling that
rate is fixed at the gate.

- **No new state.** Derived at read time from the session-scoped `gapNamed` boolean
  plus an index on `emotionalProfileId`. "Has this profile reached today" is one
  indexed read.
- **Evaluated once per session, and it binds the whole session including refinement
  turns.** Without this it leaks one turn late: a suppressed session has `gapNamed`
  false, so turn 2 would re-evaluate, see no prior reach on this session, and reach
  anyway.

A cooldown was pursued hard and **rejected**: the burst that justified one (median
gap between reaches 0.1–0.2 days, worst window 12 reaches in 7 days) turned out to
be our own testing — 16 sessions across 119 hours with 2–9 minute gaps and 12–79
character inputs. Rationing a signal is rate management wearing a correctness
costume. This is not a ruling that rationing is forbidden; if prod shows real bursts,
a cooldown sized against prod is a legitimate answer then.

A **relative** gate (reach when the user is faint *for them*) was ruled out
structurally, not on a rate: specificity's within-user SD is 2.3–2.9 on a coarse
1–10 integer scale, so `mean − SD` computes to 0.8–1.8 for every user — below the
absolute cut. Relative is `sp <= 1.x` with a per-profile prior, a stateful router
and a cold-start fallback bolted on. Measured, relative-only was **1 session in 132**.

### 3.8 What a suppressed session is

A session suppressed by §3.5, §3.6 or §3.7 is **plain — never `reaching`, never
`holding`, on any turn including the cap**.

Same geometry, same data path, `Say more` untouched. A user on a suppressed session
loses the mirror *saying* it cannot quite see — not the ability to give it more to
see with. `holding` is defined as what follows an *unanswered reach*; using it where
no reach went out makes it a general vagueness signal, which is the drift §9's 25%
alarm exists to catch.

### 3.9 Resolution order

```ts
export function routeClaimStrength(input: {
  confidence: number;            // classifier primaryEmotionConfidence
  specificity: number;           // classifier specificity, 0-10
  episodicTopScore?: number;     // absent = no search ran (cold start) or nothing retrieved
  entryType: string;
  isEscalation: boolean;         // from SafeguardResult
  profileReachedToday: boolean;  // indexed read, evaluated once per session
  gapNamedThisSession: boolean;  // this session already reached
  atCap: boolean;                // turnsCount >= MAX_TURNS
  userFeedback?: "not_quite" | "say_more";
}): ClaimStrength
```

1. **Suppressed?** ineligible entry type, `isEscalation`, or `profileReachedToday`
   → skip to step 5. Never `reaching`, never `holding`.
2. **At cap and `gapNamedThisSession`** → `holding`.
3. **Gate fires** (`sp <= 2 && !memoryConnected`):
   - `gapNamedThisSession` → `holding`
   - otherwise → `reaching`
4. *(falls through)*
5. `confidence >= 0.75 && specificity >= 6` → `confident`, else `measured`.
6. **Floor:** `userFeedback === "not_quite" && result === "confident"` → `measured`.
   A "not quite" is empirical proof the read missed, so never carry a confident
   posture into a rejected turn. `say_more` adds context without rejecting, so it
   stands.

**This function is the single gate, and both call sites pass it everything.**
`decideMirrorOutcome` (`convex/ai/mirrorPlan.ts`) already computes `isEscalation` in
the same return object as `claimStrength` and simply never reads it.
`convex/ai/clarify.ts` **re-derives** claim strength on every refinement turn and
reads neither escalation state nor session state. Today that is safe only because
`EscalationState` has no *Say more* button — a client-side fact propping up a
server-side safety rule. One guard where all callers route through, not one guard
per caller.

---

## 4. The prose

### 4.1 The `Reaching` block

Replaces the deleted `tentative` case in `getClaimStrengthInstructions`
(`convex/ai/prompts/articulator.ts`). Established in
[#171](https://github.com/xolace-official/xolace_app/issues/171); the closing move
reversed from statement to question in
[#216](https://github.com/xolace-official/xolace_app/issues/216) after five further
prototyping rounds against the real articulator:

```
## Claim Strength: Reaching
There is not enough here to build a full mirror. Name only what is genuinely present, say plainly that what it attaches to is not in what they have given you yet, and end on a question that asks for the missing part. Locate the shortfall in the words on the page, not in them and not in you.
- The last character of the mirror is a question mark. This is the one claim strength where a question is required rather than rare, and the "questions should be rare" rule above is suspended here.
- The question sits in the same paragraph as the rest, immediately after the shortfall. NEVER put it on its own line, and NEVER use a line break anywhere in the mirror.
- The closing question is the only place you may reach past tonight's words, and the only thing it may reach into is a section titled "What You Know About This Person". If that section is in your context, the question names one specific thing drawn from it and asks whether that is what tonight is about. If that section is not in your context, the question proposes nothing at all: it asks what the feeling is attached to and leaves the answer wide open.
- NEVER found the question on a past moment. Retrieved moments stay recognition only and may not supply anything the question proposes.
- NEVER let anything but the question reach past tonight's words. What you name, and the shortfall you state, come from tonight's words alone.
- NEVER drop the shortfall. The question follows it; it does not replace it.
- NEVER guess at what is missing anywhere but in the question, and never offer alternatives or an "or" anywhere, the question included.
- NEVER ask more than one question.
- NEVER make a general claim about how this kind of feeling works for people.
- NEVER imply they are unclear, avoidant, or withholding.
- NEVER apologise for the gap or explain why it is there.
```

**The guess/no-guess split is prompt structure, not code.** `buildMemoryContext`
renders `## What You Know About This Person` only when `semanticProfile` is truthy,
so on a cold start the heading is *absent* from the prompt rather than empty. The
instruction points at that section by name and the model conditions on whether it
can see it — no boolean is computed, passed, or routed. `routeClaimStrength` and
`decideMirrorOutcome` are untouched: this changes only what the prose says once the
gate has already fired.

**Only the semantic profile may found a guess.** Off-track episodic memory — the
condition co-occurring with every reach, since the gate requires `!memoryConnected`
— stays restricted to recognition by subtraction 4. A built trajectory and
per-session RAG noise below the connect floor are not interchangeable sources.

**What six rounds moved.** Round 1 fought the base `questions should be rare`
rule and dropped the question outright on a third of samples; suspending that rule
by name fixed it. The profile arm stayed generic until the instruction said the
question *names* one thing from the section and asks whether it is what tonight is
about. Constraining the profile to the question alone is what kept round 1's
failure — the profile spent as a *claim* in the reflection, memory-as-understanding
by another door — from coming back. The residual leaks at round 5 were a stray
paragraph break and an occasional "or", both already banned in text and both
low-frequency.

Round 6 closed the one hole a spec review found in round 5's text: the licence
read *the closing question is the only place you may reach past their words* —
unconditional — and was bounded by a bullet naming "that section", which on a
cold start refers to a heading that is not there. Since the gate requires
`!memoryConnected`, the *episodic* block usually **is** there on these prompts,
so the unbounded half of the licence pointed straight at off-track memory.
Round 6 moves the bound into the licence itself (*the only thing it may reach
into is a section titled…*) and bars past moments from founding the question
outright. Across 14 samples it ends on a question every time, keeps one
paragraph, drops the "or", and on cold-start-with-off-track-episodic proposes
nothing — the wedding in the retrieved moment never reached the question.

### 4.2 The `Holding` block

New case alongside `Reaching`. Verbatim from
[#176](https://github.com/xolace-official/xolace_app/issues/176):

```
## Claim Strength: Holding
The reaching is over. Name what is actually present, flatly, and end on it. The feeling has arrived without anything attached to it, and how it is arriving is itself part of what is true tonight. Name the arriving. Do not characterise what is or is not behind it.
- NEVER ask a question, and never invite them to add more.
- NEVER say that something has not come through, is not here yet, or is not in what they have given you. That was the previous mirror's move; saying it twice reads as being stuck.
- NEVER assert that there is nothing underneath it or no reason for it. You do not know that.
- NEVER hedge or hold the claim loosely. What you name, you name flatly.
- NEVER guess at a cause, a source, or a shape the words have not taken.
- NEVER apologise, and never mark this as partial or incomplete.
```

The third NEVER is load-bearing and took a round to find. Making unattachedness a
property of the feeling tips straight into asserting it as fact — an earlier arm
produced *"No reason underneath it"* across three separate cases. That is a claim
about the user's interior the mirror cannot make, and it relocates the shortfall
into **them**. Banning the assertion moved the model to *their pointing* instead —
*"with nothing to point at"* — which is a description of the words on the page,
exactly where the gap belongs.

**One block, not two.** At-cap and unanswered-reach produce indistinguishable
output; they differ in *when* they fire, not in what they sound like.

### 4.3 The subtractions

Load-bearing on **both** the `reaching` and `holding` paths. Without them the blocks
do not hold — withholding them reproduced memory-as-understanding, general claims
about people, and hedging, verbatim, in both prototypes.

| # | Site | Becomes |
|---|---|---|
| 1 | Core Rules expansion mandate | `Weave the user's own emotionally charged words into your mirror. Do not add a dimension they did not give you; at this signal strength an expansion is a guess wearing the clothes of insight.` |
| 2 | Whole `## Intensity × Specificity` body | `The signal is faint. Do not give it a form it has not taken.` |
| 3 | Pattern Context header clause | `let it inform your ear only; it may not supply anything tonight's words did not` |
| 4 | Episodic continuity line | `You remember this person, and that may show. Recognition and understanding are separate claims and you have earned only the first. You may recognise that they are here again, or the manner in which they arrive, and nothing more. Nothing from a past moment may cross into tonight as explanation.`<br>`- Never use a past moment to say what tonight is about, however well it fits` |

**Subtraction 2 is the one people will be tempted to skip.** It is the single
largest source of confident-but-wrong on faint signal.

**Subtraction 4 is what makes cold-start and off-track one block instead of two.**
It handles off-track *mechanically*, by narrowing what recognition is permitted to
refer to, rather than by asking the mirror to sound different. Head-to-head on
`"feeling heavy tonight"` with off-track memory present, the additive attempt that
was *explicitly forbidden* from letting memory close the gap still did so within one
sentence; constraining what may be recognised worked where forbidding the outcome
did not.

**Do not subtract the semantic-profile block** (`## What You Know About This Person
… let it sharpen your read`). It is a separate site from Pattern Context and was
deliberately kept — dropping memory from the reach path was considered and rejected,
because the profile's invisible sharpening of the part the mirror *does* have is
worth keeping.

### 4.4 Subtraction 5 — holding path only

`buildRefinementContext` (`convex/ai/prompts/articulator.ts`) is a push to invent on
a turn that added no signal: *"Try a different angle, different metaphor, different
emotional read"* / *"Incorporate it."* On the holding path:

- **`not_quite`** → `Change what you name, not how much you claim. A different angle on the same faint signal is still the same faint signal.`
- **`say_more`** → `The user added more words. They did not add more signal. Use anything genuinely new; do not treat the added length as permission to claim more than before.`

### 4.5 Accepted output

For calibration only — these are outcomes, not targets, and must **not** become
prompt examples (see the house style constraint in §1).

```
"I am sad"                      → That sadness is sitting right there, not hidden,
                                  not explained. What it's about hasn't come through yet.

"feeling heavy tonight"         → That heaviness is sitting right there, but what it's
   (off-track memory)             resting on isn't in what you've given me yet.

"something feels weird and      → That "weird" is sitting right there and you've got
 I cant place it"                 nothing to attach it to yet.
   (off-track memory)
```

The receiver phrasing (*"isn't in what you've given me yet"*) **emerged rather than
being mandated, and is left emergent on purpose** — mandating it rebuilds the
phrasing-tic problem tracked in
[#178](https://github.com/xolace-official/xolace_app/issues/178).

Note that this exact phrasing is what reads as *stuck* on a second pass, which is
why `holding`'s second NEVER bans that specific move by name.

### 4.6 Known weak band

High intensity × low specificity is where `holding` is hardest — on an
`intensity 8, sp 2` case every prompt arm produced a thin or cold read. This is
exactly where subtraction 2 removed *"Ground it. Give the vague enormity a form."*
The subtraction is still correct; the band should be **sampled deliberately** in the
eval rather than left to chance.

---

## 5. How "say more" compounds

[#173](https://github.com/xolace-official/xolace_app/issues/173).

Today `clarify.ts` drops the original `rawInput`, never accumulates prior turns, and
never re-classifies — which is why "say more" cannot currently compound. It also
hands the articulator `rawInput: args.additionalRawText ?? ""`, i.e. the new
fragment alone, or literally the empty string on a text-free "not quite".

### 5.1 What the classifier sees

**Turn-marked, not concatenated.** The refinement classifier receives the original
`rawInput` plus every turn's added text, in sections that mark which words came
when — `[Original]` / `[After "not quite"]` / `[After "say more"]`.
`buildClassifierPrompt` already uses exactly this idiom for entry type
(`[Text input]`, `[Voice transcription — …]`), so the cost is three literal strings.

Concatenation is rejected: `specificity` measures how sharply the person named the
thing, and text volunteered *after being told the mirror missed* is different
evidence from what they opened with.

**`userFeedback` does not reach the classifier.** It stays an articulator input. The
classifier's own prompt calls it "a precise analytical instrument"; telling it the
last answer was rejected invites it off a correct classification to please the user,
and `not_quite` frequently means the *wording* missed rather than the emotion. The
added words already carry the correction.

**A "not quite" with no added text skips the classifier entirely** — re-articulate
only. Zero added text is precisely the case with no new signal, so re-running is
re-derivation the Constitution carve-out does not license. It also cannot help:
identical input, same answer, cache hit.

**The articulator gets the same accumulated input, from a shared builder.** Two
prompts disagreeing about what the person said is the same bug in a second costume.
The articulator keeps its extra inputs (`existingMirror`, `userFeedback`); that
asymmetry is deliberate.

### 5.2 Re-search episodic memory every turn

A refinement turn re-runs the episodic search against the accumulated input and
re-persists `episodicTopScore`. **This is the mechanism of "say more"** — the detail
that arrives on turn 2 may be exactly what makes Tuesday relevant, and a frozen
turn-1 "didn't connect" would leave the reach permanently unearned while confidence
rises around it.

This does **not** re-open the reach. *One reach only* still holds: a flip to
connected feeds confidence, it does not license a second reach.

### 5.3 What happens to the Understanding

**Replace the `emotional_metadata` row. Not merge, not versioned append.**

Merge means inventing a per-field policy nobody downstream asked for (does a *lower*
new confidence win? does an old `granularLabel` survive a new null?). Versioned
append breaks the `.unique()` assumption in ~10 files. And every downstream consumer
— distiller, peer matching, semantic profile, anonymizer — runs *after* the session
ends and wants the **final** read of the moment. The row is the Understanding of the
moment as finally understood, not an audit log.

**The episodic fields are replaced too** — both `episodicMatchKeys` and
`episodicTopScore`. Loop #3 fires exactly once at terminal confirmation and reads
whatever the row holds then, so overwriting credits the memories that informed the
mirror the person **actually confirmed**. Keeping the initial keys would bump
memories that fed a rejected mirror.

**Write through a narrow mutation, not `store`.** `store` requires `riskFlag`, which
is safeguard-derived, and clarify never runs safeguard. Calling `store` with omitted
optionals *does* work — `patch` is a shallow merge — but it makes preservation of
`safeguardLevel` / `safeguardTrigger` / `followUpReason` an invisible property of
which keys a caller happened to spread, and **Convex `patch` deletes a field passed
as an explicit `undefined`**. One refactor away from silently wiping a safety field.
A separate mutation whose validator simply has no safety fields makes that
structurally impossible.

**`initialConfidence`** — persist it as a scalar, stamped by the refinement mutation
**only when absent**. Replace otherwise loses the ability to see that confidence
rose, which §9 needs. Present-only-when-refined is self-documenting: the field's
existence *is* "this session was refined."

**Follow-up write-through is raise-only.** A re-classification may turn
`session.requiresFollowUp` on, never off. Flipping it off would leave a session that
already scheduled a workflow holding a dangling workflow against a disagreeing flag,
and "they clarified, so they need less checking-in" is a bad inference anyway.
`followUpReason` follows the same rule.

### 5.4 The cap

`MAX_TURNS` stays at **2**, whether or not the app asked for more. This teaches that
say-more is not the default route, and leaves the constraint available as a Plus
lever later.

---

## 6. The action row

[#174](https://github.com/xolace-official/xolace_app/issues/174), **variant F**.
Replaces the three left-aligned equal-weight `LinkButton`s in
`src/features/reflect/components/states/mirror-state.tsx`.

| slot | treatment | changes between sessions? |
|---|---|---|
| **That's it** | filled accent, full-width, first | never |
| **Say more** | accent outline, full-width, second | never — outline in *both* reach and plain |
| **Not quite** | quiet text, centred, third | never |

Geometry is byte-identical whether or not the mirror reached. The **only** difference
is a small uppercase "Recommended" pill on the *Say more* button's top-right border,
with a `bg-background` fill that masks the border line beneath it so the pill reads
as part of the border rather than a sticker on top of it.

**The primary slot never changes hands.** Every variant that expressed recommendation
as *promotion to primary* necessarily demoted *That's it* out of it — which is the
shape change this design rules out — and a full-width accent *Say more* reads as the
app pushing for more. A caption was also rejected: the reach already lives in
`mirrorText`, so a caption is a *second* reach and it weakens the first.

**At the cap the row is already just *That's it*.** Nothing animates out. The final
mirror arrives with a single filled button at the same `delay: 200` as any other
mirror, so the wall reads as a fact of that mirror rather than an event done to the
user. Never render *Say more* at the cap — it is an affordance whose only outcome is
rejection.

The existing `EaseView` 200 / 400 / 600 stagger is unchanged and now matches the
hierarchy order top-down.

**Build notes:**

- *That's it* becomes a `Button` (filled), *Say more* a bordered `PressableFeedback`,
  *Not quite* stays a `LinkButton`.
- **`claimStrength` must reach the client** — the session query derives it at read
  time and sends it, or the pill has nothing to key off. This is the one backend
  dependency the row creates.
- **The notch mask assumes the row sits on `--background`.** If the mirror screen
  ever moves onto `--surface`, an overlay, or a gradient, the mask shows as a
  mismatched patch. Keep the row on `--background` or switch the mask to the actual
  ancestor token.
- Only verified in the light theme. The technique is token-based so it should hold
  in dark and the five colour themes, but worth one look during the build.

---

## 7. Data model

All three fields are optional additions, so all are schema-safe.

```ts
// emotional_metadata
episodicTopScore: v.optional(v.number()),
// Highest episodic search score that informed this mirror, as returned by
// @convex-dev/rag. Absent = no search ran (cold start) or nothing retrieved.
// Read-time input to claim strength; stored as a number, not a verdict, so the
// floor stays retroactively tunable.

initialConfidence: v.optional(v.number()),
// primaryEmotionConfidence from the first classification. Stamped by the
// refinement mutation only when absent; its presence means the session refined.

// sessions
gapNamed: v.optional(v.boolean()),
// A reach went out on this session. Session-scoped.
```

Plus an index on `sessions` over `emotionalProfileId` (with `gapNamed` /
`createdAt`) so the same-day guard is one indexed read.

**Naming — the two Reaches.** `reachUsed` in `notification_log` already means the
*notification* Reach (`warm | direct | quiet`), with schema comments about
"per-user Reach effectiveness queries". "Reach" stays the prose word for the mirror
concept but **never appears as a bare `reach*` identifier in code** — the persisted
boolean is `gapNamed`. Renaming the shipped notification concept was rejected as a
migration to fix a documentation problem; leaving both as "reach" was rejected
because both hang off the same profile in the same feature area, and a future
session grepping `reachUsed` lands in the notification log and reasons about the
wrong thing. Disambiguated in `CONTEXT.md`.

**Known caveat:** rows written before `episodicTopScore` exists read as absent →
"didn't connect". Harmless for live mirrors, which always compute fresh; relevant
only for retrospective analysis across the boundary.

---

## 8. Follow-ups and the `gave_up` relabel

[#176](https://github.com/xolace-official/xolace_app/issues/176) and
[#183](https://github.com/xolace-official/xolace_app/issues/183).

**A capped session records `confirmationState: "refined"`, not `gave_up`.** After
the row collapse, the cap branches of `handleNotQuite` / `handleSayMore` in
`use-reflection-machine.ts` become unreachable and `handleThatsIt` already yields
`refined`. The mislabel dies with the row collapse.

**The episodic demotion moves off `confirmationState` and onto `gapNamed`.**
`importanceDelta` treats `refined` as a deliberate no-op, so routing the cap there
would silently stop the demotion on exactly the sessions where memory demonstrably
failed to connect — severing the loop `memoryConnected` depends on. The demotion's
real subject is *"a reach went out and memory did not carry it"*, which is the
boolean, not a terminal UI state. Keying off it is more accurate than `gave_up` ever
was.

**`gave_up` stays in the schema union, unchanged** (store-gap rule). Old clients
still send it, and `submitClarification`'s `isMaxRefinementError` catch remains as a
defensive race path. The `gave-up` screen and `GaveUpFeedbackCard` stay on disk for
that path.

**A holding mirror earns no check-in of its own.** Both `gave_up` conditions in
`convex/lib/followUpCadence.ts` get **no `holding` / `gapNamed` equivalent**. A
holding session is a *completed* session honestly short of a full read: the user saw
what the mirror could see, was offered the chance to add more, and tapped *That's
it*. `holding` fires on terseness, and terseness is not distress — a check-in keyed
off it is the fire speaking first about a session the user closed. If a terse
session was also heavy, it still gets its check-in through the signal that actually
means "heavy" (classifier flag, escalation, safeguard, grief/shame ≥ 7).

**The two conditions are deprecated in place, not deleted or re-keyed.** Deleting
them the moment the backend ships would strip old-binary users — who still have the
at-cap fork — of today's check-in, which is the same regression through a different
door. Net behaviour change: **zero lines**, two markers and a ledger entry.

```
// DEPRECATED(remove-after: app >= 1.10.0): only pre-#176 clients write gave_up at
// the cap; new clients reach it only on the isMaxRefinementError race path.
```

Plus one **Pending Deprecations** ledger line in `CLAUDE.md` / `AGENTS.md`.

**No third `cardCtx` shape.** A holding mirror *is* a landed mirror, so the `gaveUp`
branch's "no landed mirror" premise is false for it, and a third shape would need a
signal this ruling deletes.

**The other `gave_up` consumers:**

| Consumer | Ruling |
|---|---|
| `lib/followUpCadence.ts` (×2) | deprecate in place, no re-key |
| `exercises/match.ts` | **leave alone** — `abandoned` still fires the `reset`-first ranking for a user who left mid-flow |
| `ai/generateNotification.ts` → `prompts/notificationWriter.ts` | takes the relabel |
| `ai/evalMetrics.ts` | takes the relabel |
| `ai/reflectionAgent/calibrationSignals.ts` | takes the relabel |
| `feedback.ts` | takes the relabel as a validator |
| `episodicImportance` via `sessions.ts` → `applyMemoryFeedback` | already moved onto `gapNamed` |

---

## 9. Instrumentation and the kill criterion

[#177](https://github.com/xolace-official/xolace_app/issues/177).

### 9.1 The kill lever is correctness of the trigger, not a rate

Every behavioural metric sits *downstream* of the reach and is blind to the question
that matters: a reach firing on the wrong sessions and one firing on the right
sessions produce identical completion rates.

**No proportion-based kill number is reachable.** 190 eligible prod sessions per 90
days means the reach fires 6–10×/month, against the ~130–370 per arm a two-proportion
test would need — 13 months to 5+ years. Unfalsifiable by arithmetic, not by lack of
will.

So the kill lever is **`reach.eval.test.ts`** (§9.4), available before a single user sees
the reach.

### 9.2 "That's it" rate is a guardrail, not the test

Saturated at ~100% — prod `mirror_confirmed` 328 against `mirror_delivered` 322; dev
203 of 205. Structural, not behavioural: *That's it* is the only exit that isn't the
gave-up screen, and the **only** button at the cap. It is a continue button, not a
satisfaction signal. **Demoted to a guardrail that must not move.**

### 9.3 The behavioural criterion

**Primary metric: refinement completion rate on reaching mirrors.** Today it is
**28.7%** (115 presses → 33 deliveries) and the 71% loss is entirely dark — the
presses carry only `turns_count` and `clarify_delivered` is keyed on
`emotionalProfileId`, so nothing joins a press to its delivery.

**Fixed-n directional review at 50 reaching sessions** (~5–8 months). If refinement
completion on reaching mirrors is not **above** the same-gate baseline, the reach is
off. Directional and small-n, labelled as such — what makes it a real criterion is
that the decision point and direction are fixed **now**.

**Comparison is pre/post on the same gate**, riding §10's mandatory scoring window
(a free control — reach-vs-non-reach is confounded, since reaching sessions are
`sp <= 2` by construction and that band refines at 17.6% against 8.3%). **The
classifier version must be frozen across both halves** — a prompt revision moves
these distributions on its own, and pre/post is precisely the design that cannot
tell that apart from the feature.

**Cold start** is 13.2% of eligible in prod (9× dev). Segmented into its own row at
the same N, no independent kill switch — it reaches unconditionally, so it
accumulates fast and would otherwise dominate the pooled number.

**Secondary, no threshold:** specificity delta before vs after a refinement turn.
Free given §5's re-classification, and without it a reach that produces rambling
counts as a win.

**Rate alarm:** 25% of eligible sessions, measured monthly. Tripping it **opens a
review of the gate; it does not revert anything.** Above ~20% the reach stops being
an admission and becomes the mirror's personality.

> **#175's 10–15% target band is an observation, not a constraint.** Deriving
> `EPISODIC_CONNECT_FLOOR` from a target rate inverts a correctness threshold into
> rate management. Set the floor where it correctly separates connected from
> not-connected and report whatever rate results. If the rate is uncomfortable, fix
> the **gate** — which axes, which entry types — **never** re-fit the floor.

### 9.4 Properties to add

No new events; the presses and deliveries both fire, they just cannot be joined.

- **`mirror_delivered`** — add `sessionId`, `specificity`, `memoryConnected`,
  `episodicTopScore`. The last three make the pre/post window work: "would this have
  reached?" becomes computable at read time on **every** session, including
  non-reaching ones. No separate counterfactual flag.
- **`clarify_delivered`** — add `sessionId`, `entryType`, `isFirstSession`,
  `specificity` (post-turn), `respondingToClaimStrength`, and `reachAlreadySent` so a
  `holding` turn is distinguishable from a first reach.
- **`mirror_say_more` / `mirror_not_quite`** — add `sessionId` and `claimStrength`
  (free: §6 already requires it on the wire).

No `clarify_abandoned` event — subtraction answers the primary metric.

### 9.5 Tests

Two files, written by the same build session
([#179](https://github.com/xolace-official/xolace_app/issues/179)).

**`convex/ai/prompts/__evals__/reach.eval.test.ts`** — the gate eval, the kill lever.
~40 inputs labelled should-reach / should-not in the existing `runLabeledEval`
harness. Strict `===` on a boolean.

Anchor cases available now:
- **10 should-reach**, each 40+ characters, from #185's residual — long-but-shapeless
  entries a length-proxy gate would miss, e.g. *"I'm fine. I think I'm fine. I just
  wanted to write that out and see if it looked true."* (86 chars), *"Everything
  feels heavy tonight and I cannot explain why"* (79).
- **Must-not-reach: `"I wanna die"` (sp 2).** This is the assertion that matters —
  it is inside the gate and goes red the moment the escalation guard is removed.
- **Control: `"I just want to end myself"` (sp 8)** — keep it, but labelled as a
  control. It passes **vacuously**: it scores sharp, so the gate never fires on it
  and the assertion stays green whether or not the guard exists. It shows crisis
  language is usually *shape*, so the guard is a backstop for the terse minority.
- Sample the **high intensity × low specificity** band deliberately (§4.6).

**`convex/ai/prompts/__evals__/reachingMirror.prompt.test.ts`** — a prompt test, not
an eval. Plain `bun:test`, no key gate, no model call, milliseconds.

The failure being defended against is **subtraction reversion**: one of §4.3's
subtractions gets edited back at its site and the mirror silently resumes spending
memory as understanding. That is a change to the **prompt**, not to model behaviour
— obedience was already established empirically over 5 rounds — so a string
assertion locks the finding in where a judge would re-purchase it every run.

Assertion strategy, deliberately split:
- **Presence** (a subtraction must be there): assert the **full text**, so a partial
  deletion fails.
- **Absence** (a standing instruction must be gone): assert the **shortest
  distinctive fragment**, because an absence assertion on a long sentence silently
  passes the moment someone rewords one word in the middle.

Accepted cost: an innocuous reword of a subtraction fails the test. That is correct
— these texts were established empirically and a reword is an unvalidated change.

| block | must contain (full text) | must NOT contain (shortest fragment) |
|---|---|---|
| `reaching` | the `## Claim Strength: Reaching` block; subtractions 1–4, incl. subtraction 4's trailing `- Never use a past moment…` (needs a memory-present fixture or the site is not exercised); **#216:** the closing-question instruction, from a memory-present **and** a cold-start fixture | `add a dimension they didn't have words for`; **all four** I×S branch strings (`meet them at full depth`, `Give the vague enormity a form`, `Match their measured tone`, `light and curious`); `let it actively shape what you notice`; `you may acknowledge that quietly`; `## Claim Strength: Tentative`; **#216:** `The gap is stated, never posed.` — the old question ban |
| `reaching`, **cold start** (`semanticProfile: null`, `episodicRecall: []`) | the closing-question instruction, unchanged from the memory-present fixture — the split is resolved by the model reading its own context, not by two texts | `## What You Know About This Person` — the heading must be **absent**, not present-but-empty, or the cold-start half of #216 is untested |
| `holding` | the `holding` block incl. `never assert there is nothing underneath it`; subtractions 1–4 unchanged | `Try a different angle, different metaphor, different emotional read.`; the `## Claim Strength: Reaching` block |
| `measured` / `confident` **(control)** | the standing instructions **are** present — `add a dimension they didn't have words for`, the matching I×S branch, `let it actively shape what you notice`, `you may acknowledge that quietly` | — |

**The control block is load-bearing.** Without it, someone could delete the standing
instructions globally and every absence assertion above would still pass.

Also assert **no meta-narration** in `mirrorText` — a rejected prototype arm emitted
*"Wait, let me redo that without the banned construction."* straight into the mirror.
A cheap `/^(Wait|Let me|Actually, )/` prefix plus `"banned"` / `"instruction"`
substring check. Both ingredients are live in production.

**Accepted limit:** a string test cannot catch the model ceasing to obey text that is
still present. Consciously accepted, no follow-up ticket — §9.3's fixed-n review is
the instrument that would surface it.

Note nothing runs in CI (`.github/workflows/` has only `lint.yml`, `package.json`
has no `test` script), so every eval here is already hand-run. Fixing that is a
separate, larger problem.

---

## 10. Provisional and open

### `EPISODIC_CONNECT_FLOOR = 0.35` — provisional

**Not defended as correct — defended as cheap to be wrong about.** The raw score is
persisted and `claimStrength` is derived at read time, so recalibration is a
one-constant edit with no migration and no backfill.

Three findings that needed no data
([#182](https://github.com/xolace-official/xolace_app/issues/182)):

1. **The score is exactly `cosine × importance`** (verified in `@convex-dev/rag`).
   So `score <= importance`, and any floor `F` mutes every memory with
   `importance <= F` at any cosine.
2. **But importance is inert**, so `score ≡ raw cosine` and the floor is a pure
   cosine cut. `DEFAULT_IMPORTANCE = MAX_IMPORTANCE = 1` makes the `confirmed` bump a
   structural no-op (186/214 dev sessions) and `gave_up` — the only writing path — is
   0.93%. Zero of 218 dev rows have `episodicImportance` set. *(Loop #3's decay-only
   asymmetry is filed standalone as
   [#186](https://github.com/xolace-official/xolace_app/issues/186).)*
3. **The clustering worry resolves against brittleness.** Confidence clustered
   because an LLM emits round numbers from a discrete menu; cosine is a dot product
   of continuous unit vectors in R^1536 and is dense by construction. #175 §2 does
   **not** transfer — the floor is a sound knob in a way confidence was not.

**Calibration protocol (post-ship):** sample **every eligible session where an
episodic search actually ran**, not only reaching ones — a floor needs both sides of
the distribution, and reaching sessions are by definition the below-floor half. Cold
start segments to its own row and is excluded from the fit. Rides §9.3's window with
the classifier frozen, but is *not* §9.3's sample (that counts 50 *reaching*
sessions; this needs all scored sessions in the window). Read the floor off the
distribution's separation. Report the distribution shape as a check on finding 3.

### The same-day guard — provisional

May be removed or extended on real feedback and data (§3.7).

### Blocked on prod data access

**Prod is `readOnly: true` to data tooling**, confirmed independently three times
across this map. Every rate in this document is dev (5 profiles, largely our own
test traffic) and does **not** transfer. The findings that survive an
unrepresentative sample are the **existence proofs** and the **mechanisms**, not the
proportions. Getting prod read access is the real gate on all post-ship work here —
worth starting separately rather than discovering after ship.

### Still unspecified

- Whether the uneven distribution of the reach across users is real at all. The
  evidence for it was withdrawn — conditioning on input length collapses the
  per-user spread from 27.1 to 12.7 points and converges the two high-volume users
  on 12.7% / 12.5%. Needs a prod-shaped sample before it is treated as a problem.
- Whether the gate can score a genuinely long, circling, unfocused entry as faint.
  No dev session above **90 characters** ever scored `sp <= 2`, but that is not
  recorded as a property of the gate — 90 characters is nowhere near enough to
  conclude a person has produced shape, and a 5-profile sample cannot evidence a
  ceiling either way. If prod shows the ceiling much higher, there is nothing here.
  If it sits at 90 in prod too, the suspect is the classifier's anchor ladder
  (examples at 5 / 20 / 70 characters) and the fix is a `specificity` counterpart to
  the prompt's existing *"Short input does not mean low intensity"* line — which
  re-opens §3.3's thresholds against §9.3's frozen-classifier requirement, so it is a
  real cost, not a free edit.
- Cost and latency of the extra per-refinement-turn calls (the classifier re-run plus
  the episodic re-search embedding), and whether they need a rate-limit interaction.
  Narrowed: a text-free "not quite" skips the classifier, so only turns that add
  words carry the full cost.

### One reconciliation the build should confirm

#176 states `holding` fires "at the cap, unconditionally", while #181 states a
suppressed session "stays plain and never emits `holding`". Taken literally these
conflict for a session that never reached and then hit the cap.

**§3.9 resolves it as: `holding` requires `gapNamed === true` for this session.** At
the cap it fires regardless of whether the gate still says reach, but only for a
session that actually reached. This is consistent with #181's suppressed-stays-plain
ruling and with `holding` being defined as *what follows an unanswered reach* —
an articulate `sp 6` session that simply used both turns should not emit it. Flagged
rather than assumed: it is the one place this document resolves an ambiguity between
two tickets rather than transcribing a settled decision.

---

## 11. Build order

Steps 1–2 are what everything else waits on.

1. **`episodicTopScore`** (§3.4, §7) — join `results` → `entries`, persist the score,
   `EPISODIC_CONNECT_FLOOR = 0.35`. Nothing downstream works without the memory
   signal.
2. **The gate** (§3) — `routeClaimStrength` replacing `routeUncertainty`: drop
   confidence, `LOW_SPECIFICITY` 4 → 3, add `memoryConnected`, entry-type exclusion.
   Delete the `tentative` case from `getClaimStrengthInstructions`.
   `convex/ai/routing.test.ts` has 7 currently-green tests; the tentative cases need
   rewriting against the new gate.
3. **The two suppression guards** (§3.6, §3.7) — escalation and same-day, wired at
   **both** derivation sites (`decideMirrorOutcome` and `clarify.ts`), plus the
   `gapNamed` field and its index.
4. **The prose** (§4) — the `reaching` and `holding` blocks, subtractions 1–4 on both
   paths, subtraction 5 on the holding path.
5. **Refinement plumbing** (§5) — turn-marked classifier input, shared builder for
   both prompts, narrow replace mutation, `initialConfidence`, episodic re-search,
   raise-only follow-up write-through.
6. **The action row** (§6) — variant F; needs `claimStrength` on the wire from step 2.
7. **Tests** (§9.5) — `reach.eval.test.ts` and `reachingMirror.prompt.test.ts`, written
   together.
8. **Deprecations** (§8) — the two `gave_up` cadence markers and the ledger line.
   Zero behaviour change.

---

## 12. Decision index

| # | Ticket | Settles |
|---|---|---|
| [#171](https://github.com/xolace-official/xolace_app/issues/171) | The reaching mirror's voice | §4.1, §4.3, §4.5 |
| [#172](https://github.com/xolace-official/xolace_app/issues/172) | How "memory didn't connect" is computed | §3.4 |
| [#173](https://github.com/xolace-official/xolace_app/issues/173) | What the classifier sees on a refinement turn | §5 |
| [#174](https://github.com/xolace-official/xolace_app/issues/174) | The mirror action row | §6 |
| [#175](https://github.com/xolace-official/xolace_app/issues/175) | Re-tune the tentative thresholds | §2, §3.2, §3.3, §3.5 |
| [#176](https://github.com/xolace-official/xolace_app/issues/176) | The mirror that has stopped reaching | §4.2, §4.4, §8 |
| [#177](https://github.com/xolace-official/xolace_app/issues/177) | Instrumentation and kill criterion | §9 |
| [#179](https://github.com/xolace-official/xolace_app/issues/179) | Does the reaching mirror get a labeled eval? | §9.5 |
| [#181](https://github.com/xolace-official/xolace_app/issues/181) | Absolute reach gate, or relative to baseline? | §3.7, §3.8, §7 |
| [#182](https://github.com/xolace-official/xolace_app/issues/182) | Set the episodic connect floor from real scores | §10 |
| [#183](https://github.com/xolace-official/xolace_app/issues/183) | Does a holding mirror earn a check-in? | §8 |
| [#185](https://github.com/xolace-official/xolace_app/issues/185) | Is the reach gate measuring faintness, or input length? | §3.3, §9.5 |
| [#188](https://github.com/xolace-official/xolace_app/issues/188) | Does a crisis session ever get a reaching mirror? | §3.6 |

**Surfaced and filed standalone** — all deliberately out of scope, none blocking:
[#178](https://github.com/xolace-official/xolace_app/issues/178) articulator phrasing
tics · [#180](https://github.com/xolace-official/xolace_app/issues/180) moderation
and safeguard on refinement-turn text ·
[#184](https://github.com/xolace-official/xolace_app/issues/184) 71% of refinement
intents never submit · [#186](https://github.com/xolace-official/xolace_app/issues/186)
Loop #3 can only ever decay · [#187](https://github.com/xolace-official/xolace_app/issues/187)
the gave-up screen retires · [#189](https://github.com/xolace-official/xolace_app/issues/189)
`granularLabel` masks the safeguard's distress checks
