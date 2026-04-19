# Sit With This — Exercise Research & Design
**Date:** 2026-04-19
**Context:** Beta-testing build. The `sit-with-this` screen currently renders a placeholder ("Full exercises coming soon"). This document proposes the exercise library, matching logic, personalization architecture, and interaction design for the solo path.
**Inputs:** `research/xolace-user-research-synthesis.md`, `convex/schema.ts` (exercises table already defined), the mirror → path-selection → session-end flow.

---

## How to Use This Document

This is a design brief, not a spec. It proposes a shortlist of 6 exercises, a matching algorithm, and an interaction model — each grounded in the user research and in what Xolace actually is (and explicitly is not).

The research has a strong opinion on almost every question. When it doesn't, the opinion is flagged as **[open]** and should be decided before build.

---

## Part 1 — Frame & Constraints

### 1.1 This is not a meditation app

Calm, Headspace, and Balance are built around the *practice of being present*. Their exercises are teaching instruments — you show up to get better at meditation. Xolace is the opposite: the user has already done the hard thing (named what they feel), and the exercise exists to **metabolize** that naming, not to teach a skill.

Everything downstream of this distinction matters:
- The exercise never says "with practice, you'll find it easier to…" — we don't care if they get better at it.
- The exercise never asks them to clear their mind. The mind is full of a named thing. That's the point.
- The exercise does not have a lesson, a takeaway, or a framework the user is supposed to remember.

### 1.2 This is not therapy

The user research (§3.4) is explicit: *"Certain sensitive stuff will never go to ChatGPT. I write them down and burn it."* That ceiling exists for Xolace too. The exercise never asks probing questions, never says anything that could be read as diagnosis or prescription, never uses clinical language ("trauma," "cognitive distortion," "symptom").

### 1.3 The path starts *after* the mirror was confirmed

By the time a user is on `sit-with-this`, they have:
- Typed something real
- Been reflected back with precision
- Tapped "That's it" (confirmationState: `confirmed` or `refined`)
- Chosen the solo path

This means two things:
- **No re-articulation.** Asking them to name the feeling again is a step backwards and wastes the mirror's work.
- **Integration, not excavation.** The goal is to let the named thing land, settle, or shift — not to dig for more.

### 1.4 Constraints, named

| Constraint | Implication |
|---|---|
| Anti-gamification (from product thesis + research §3.6) | No streaks, no completion counts, no badges, no "you completed X of Y exercises." |
| Anti-parasocial (from product thesis) | The exercise is not a character, has no personality, no avatar, no recurring name. It is infrastructure. |
| Anti-extractive (research §3.4, §4 Profile E) | No exercise asks for more input than is necessary. No exercise captures text "for your records" or "to improve the model." |
| Duration ceiling | 60–180 seconds. Research §6: *"That's how small you should start."* Three minutes is the upper bound before a beta tester feels trapped. |
| Must work for the numb user (research §2.4, §4 Profile D) | At least one exercise does not require the user to produce anything — words, breath work, or focused attention. |
| Must work for the self-aware processor (research §4 Profile A) | At least one exercise uses their own words back (hybrid template with `userLanguageTags`). Generic language fails this profile fastest. |
| Must not feel like Headspace, Finch, or Woebot | See Part 8. |

---

## Part 2 — What the Exercise Must Actually Do

The user has just been told what they're feeling, in their own language, better than they could say it themselves. The research calls this the "yes, exactly" moment.

From there, three things can happen:

### 2.1 The feeling needs to **land**
The mirror named it, but the user hasn't *felt* the naming in their body yet. The exercise creates a short, quiet container where the named thing has room to be what it is. This is Eugene Gendlin's "receiving" step in Focusing — the final phase of his process where you let the felt sense know it's been heard. It maps almost perfectly onto post-mirror.

**This is the most common case.** It should be the default exercise.

### 2.2 The feeling needs to be **met somatically**
For numb, foggy, or dissociated states, words have limits. The mirror may have landed intellectually ("yes, that's the shape of it") but the body is still offline. The exercise brings the body back — interoception, orientation, physical sensation — without asking for more words. This is polyvagal / somatic territory (Peter Levine, Stephen Porges).

**This is the critical case for the numb profile** (research §4 Profile D). Without it, the sit-with-this path fails the users who need it most.

### 2.3 The feeling needs to be **held differently**
Some states — stuck, trapped, heavy, self-critical, angry — don't need to land or be felt. They need a different relationship. ACT defusion ("I notice I'm having the thought that…"), IFS parts-work ("a part of you is feeling this"), self-compassion breaks (Kristin Neff) — these techniques all shift the *position* from which the user holds the feeling, without asking them to change what they feel.

**This is the case that separates Xolace from a vent box.** The release-seeker profile (§4 Profile B) gets value here if the exercise doesn't ask them to process further — just to sit *beside* the feeling instead of *inside* it.

---

## Part 3 — Techniques Surveyed

Rigorous survey of techniques, filtered against the constraints in Part 1. Accepted techniques feed the shortlist in Part 4.

### 3.1 Accept

**Focusing (Eugene Gendlin)** — The closest philosophical match to Xolace's entire product thesis. Gendlin's "felt sense" is literally what the mirror is articulating. His six steps are: clearing a space, felt sense, handle, resonating, asking, receiving. The last step — receiving — is a post-articulation integration ritual. **This is the backbone of the default exercise.**

**Physiological sigh (Balban, Huberman et al., Stanford 2023)** — Double inhale through the nose, long exhale through the mouth. Published research shows 5 minutes of cyclic sighing reduces stress and improves mood more than mindfulness meditation or box breathing. One of the few breath techniques with a real evidence base, and it works in under 60 seconds. **Perfect universal fallback.**

**Polyvagal-informed orienting (Stephen Porges, Deb Dana)** — Looking around the environment, naming what's seen, noticing physical contact with surfaces. Activates the ventral vagal "social engagement" system. Low cognitive load. **Designed for the numb case.**

**ACT defusion (Steven Hayes)** — Specifically the "make room" move: expanding the container around a feeling rather than making the feeling smaller. Pairs naturally with extended-exhale breath (inhale 4, exhale 7) which activates parasympathetic response. **For stuck/heavy states.**

**Self-compassion break (Kristin Neff)** — Three beats: this is a moment of suffering → suffering is part of being human → may I be kind to myself. Short, evidence-backed, fits the tone. **For shame-adjacent, self-critical mirrors.**

**IFS-lite parts work (Richard Schwartz)** — "A part of you is feeling this." The full IFS protocol is therapy, but the *framing* — treating emotional states as parts that have needs rather than as definitions of self — is exportable. Must be handled carefully to not drift clinical. **For anger, inner conflict, "a part of me wants…" content.**

### 3.2 Adapt cautiously

**Body scan (MBSR lineage)** — Classic body scans are 20–45 minutes. A 90-second version that moves feet → legs → torso → breath is more of a "body check-in" than a scan, but useful for reconnection. Watch for "wellness app" aesthetic.

**Box breathing (4-4-4-4)** — Over-used, over-marketed (Navy SEALs, etc.), and the research base is weak compared to physiological sigh or extended-exhale. Can be one option in the breathing pool but should not be the first one a user encounters.

**Writing/journaling (Pennebaker expressive writing)** — The full protocol is 15–20 minutes over multiple days. Not a fit. But a single-line prompt ("one kind sentence you could offer yourself") is useful inside a larger exercise.

### 3.3 Reject

**Cognitive reframing / CBT worksheets** — Too clinical, too prescriptive. Violates research §2.2 (what-now gap was a signal to not push into "fix it" territory) and §3.4 (users don't want to be extracted from).

**Visualization of a "safe place"** — Contested in contemporary trauma-informed practice; can destabilize users who have no felt-safe place. High risk, low reward at our scale.

**"Leaves on a stream" (ACT classic)** — Floating thoughts down a river. Too whimsical. Clashes with the product's aesthetic register.

**Guided imagery with rich narrative** — "Imagine you're on a beach…" — this is Calm's territory and is a hard no. Not what Xolace is.

**Gratitude prompts** — Forced positivity. Research §1 (the entire thesis) is that the product does not push toward "feel better" but get the meaningful help and value. A gratitude prompt delivered 90 seconds after someone named a heavy feeling is the product contradicting itself.

**Affirmations** — Same reason. Cliché, and research §2.1 explicitly flags generic/cliché output as the #1 priority fix.

**Mindfulness as posture / meditation practice** — "Sit upright, close your eyes, notice your breath" is a teaching. Xolace does not teach meditation.

---

## Part 4 — The Shortlist (6 Exercises)

Each exercise is mapped to the existing `exercises` table structure in `convex/schema.ts`. The `type` field uses the existing enum. All 7 enum values are represented across these 6 exercises (visualization is not used in the beta shortlist — see §4.7).

### 4.1 **Let it land** — DEFAULT (Focusing: Receiving)

| Field | Value |
|---|---|
| `type` | `grounding` |
| `estimatedMinutes` | ~1.5 |
| `targetEmotions` | Broad — ambiguous, mixed, confused, sadness (low-to-mid intensity), tender, relief |
| `intensityRange` | `{ min: 2, max: 7 }` |
| Hybrid slots | `user_phrase` (from `userLanguageTags`), `mirror_line` (first sentence of `mirrorText`) |

**Flow (beats):**
1. *Text, 4s hold:* "You named it. Let's just sit with that for a moment."
2. *Text, 3s hold:* "{{mirror_line}}"
3. *Breath pacing, 2× physiological sigh (~14s total):* soft orb expansion and contraction, haptic at inhale and exhale crest
4. *Text, 4s hold:* "Notice where in your body '{{user_phrase}}' lives right now. Not to fix it. Just so it knows you heard it."
5. *Text, 6s hold, orb steady:* "You don't have to do anything with it."
6. *Close:* "Okay. You stayed."

**Why it's the default:** It's the most direct honoring of what just happened in the mirror stage. It makes no demand, uses the user's own language, and closes with a quiet acknowledgment rather than a directive. It's also the easiest to ship cleanly.

---

### 4.2 **Find your edges** — NUMB ENTRY (Polyvagal orienting)

| Field | Value |
|---|---|
| `type` | `body_scan` |
| `estimatedMinutes` | ~2 |
| `targetEmotions` | numb, empty, foggy, dissociated, disconnected |
| `intensityRange` | `{ min: 1, max: 5 }` (numbness reads as low intensity but high need) |
| Hybrid slots | Minimal — numb users benefit from scripted predictability, not novelty. May personalize one line at close. |

**Flow:**
1. *Text, 5s hold:* "Before anything else, let's find where you are."
2. *Text, 4s hold:* "Look around. Don't move your head much — just your eyes."
3. *Text, 6s hold:* "Find three things. A corner. A shadow. A color. Anything."
4. *Text, 5s hold:* "Now feel your feet. Whatever they're touching."
5. *Text, 5s hold:* "Your back. Against what's behind it."
6. *Text, 6s hold:* "Hands. What temperature are they."
7. *Breath, single slow exhale (~8s):* gentle orb contraction, no haptic (can be startling for dissociated states)
8. *Close:* "You're here. That's enough."

**Why it works:** It asks for almost nothing cognitively. The user doesn't need to find words, feel a specific thing, or "do" the exercise correctly. It just brings the environment back online. This is the polyvagal ladder in its lightest form — social engagement re-activated through orientation to the physical world.

**Design note:** No input capture, no prompts, no decisions. Numb users froze at the entry prompt — they should not have to decide anything here.

---

### 4.3 **Make room** — STUCK / HEAVY (ACT defusion, extended exhale)

| Field | Value |
|---|---|
| `type` | `cognitive_reframe` |
| `estimatedMinutes` | ~1.5 |
| `targetEmotions` | stuck, trapped, heavy, overwhelmed, pressure, tight |
| `intensityRange` | `{ min: 4, max: 9 }` |
| Hybrid slots | `mirror_line`, `user_phrase` |

**Flow:**
1. *Text, 4s hold:* "{{mirror_line}}"
2. *Text, 4s hold:* "What if you didn't have to make this smaller right now?"
3. *Breath, extended exhale (inhale 4s, exhale 7s), 3 cycles (~33s total):* orb expands slowly on inhale, contracts slowly on exhale
4. *Text, synced to a breath cycle:* "Breathing in — imagine giving it room."
5. *Text, synced to next breath cycle:* "Breathing out — rest beside it."
6. *Text, 5s hold:* "It doesn't have to leave to stop hurting."
7. *Close:* "You stayed."

**Why it works:** The ACT move is counter-intuitive in a way users recognize once they feel it. The instinct under pressure is to compress. Expanding instead, paired with an extended exhale that physiologically slows the stress response, offers a different relationship to the feeling without asking the user to change it. The line "It doesn't have to leave to stop hurting" is the whole thesis in nine words.

---

### 4.4 **Speak to it** — INNER CONFLICT / ANGER (IFS-lite)

| Field | Value |
|---|---|
| `type` | `journaling_prompt` |
| `estimatedMinutes` | ~2.5 |
| `targetEmotions` | anger, frustration, resentment, conflicted, "part of me" content |
| `intensityRange` | `{ min: 3, max: 8 }` |
| Hybrid slots | `user_emotion` (from `primaryEmotion` → humanized: "angry" → "angry", "frustration" → "frustrated"), `user_phrase` |

**Flow:**
1. *Text, 5s hold:* "Something in you is {{user_emotion}}."
2. *Text, 4s hold:* "Not all of you. Something."
3. *Text, 6s hold:* "If it could speak, what does it want you to know?"
4. *Prompt, optional single-line response (no capture, ephemeral — on-device only):* 60s soft timer, with option to skip
5. *Text, 4s hold (shown after user taps "done" or timer ends):* "You heard it. That matters."
6. *Close:* "You stayed."

**Design note — no capture:** The response is typed into a local text field that is *never* sent to the server. The field clears on exit. This is load-bearing — it must be true and it must be visible to the user ("this stays on your phone"). Otherwise this crosses into extractive territory that research §3.4 rules out.

**Why it works:** The IFS framing ("a part of you, not all of you") creates immediate de-identification from the feeling without the clinical apparatus of full parts-work. Letting the user type a response — privately, ephemerally — turns the mirror's reflection into a small dialogue with their own interior, without Xolace ever hearing the other side.

**[open] Schema gap:** The existing `steps.type` union is `text | timer | prompt`, and `prompt` is documented as "no input captured." That matches our need — but the UI must actually render a private, ephemeral text field, which is new rendering behavior. Either (a) we lean on the existing `prompt` type and define client-side rendering of an ephemeral input, or (b) we add a `private_prompt` step type for clarity.

---

### 4.5 **Soften toward it** — SELF-CRITICAL / SHAME (Self-compassion break)

| Field | Value |
|---|---|
| `type` | `self_compassion` |
| `estimatedMinutes` | ~1.5 |
| `targetEmotions` | shame, self-critical, "should have", failure, inadequacy, embarrassment |
| `intensityRange` | `{ min: 3, max: 8 }` |
| Hybrid slots | `user_phrase` |

**Flow:**
1. *Text, 4s hold:* "You said: '{{user_phrase}}'."
2. *Text, 5s hold:* "Right now, in this moment, you're not the only one feeling something like this."
3. *Text, 5s hold:* "Place a hand somewhere on yourself. Chest, arm, face — wherever feels natural."
4. *Haptic pulse (single soft medium), orb steady:* no text, 4s of silence
5. *Text, 6s hold:* "If you could offer yourself one kind sentence, what would it be?"
6. *Text, 5s hold:* "You don't have to say it out loud. Just let yourself hear it."
7. *Close:* "That was kind. You stayed."

**Why it works:** Neff's three components (mindfulness, common humanity, self-kindness) map to beats 1, 2, and 5–6. The physical gesture (hand on chest/arm) is doing real somatic work — activating mammalian self-soothing without requiring an explanation of why. The close line "That was kind" is the only exercise that acknowledges what the user did, which is appropriate because self-kindness in this profile is genuinely hard.

---

### 4.6 **Reset** — ACTIVATION / OVERWHELM (Physiological sigh)

| Field | Value |
|---|---|
| `type` | `breathing` |
| `estimatedMinutes` | ~1 |
| `targetEmotions` | anxiety, panic, activated, overwhelmed, racing, buzzing, scattered |
| `intensityRange` | `{ min: 5, max: 10 }` |
| Hybrid slots | None — this is purely somatic. Adding text under acute activation is counter-productive. |

**Flow:**
1. *Text, 3s hold:* "Three breaths. That's it."
2. *Breath, physiological sigh × 3 (~42s total):*
   - Double inhale through nose: orb expands sharply, then tops up
   - Long exhale through mouth: orb contracts slowly
   - Subtle haptic at each transition
3. *Text, 4s hold:* "That was enough."
4. *Close:* "Okay."

**Why it works:** The shortest exercise. The evidence base is the strongest. It does not require the user to think, focus, or process. It's the right answer for beta users who are too activated for anything else, and it's also the right fallback when matching is uncertain.

**Secondary role:** "Reset" is also offered as a **swap target** from any other exercise. If the user taps "something different" mid-exercise, "Reset" is always available regardless of emotion classification. It cannot go wrong.

---

### 4.7 Not in the beta shortlist (but reserved in the `type` enum)

**`visualization`** is in the schema enum but intentionally absent from the beta. The two strong visualization candidates (safe-place, leaves-on-a-stream) are in the reject pile (§3.3). A well-designed visualization exercise is possible but needs more research — deferring to post-beta. Leaving the enum populated so we don't need schema work to add one later.

---

## Part 5 — Matching Logic

The user does not pick. The app picks. The user can swap.

### 5.1 Inputs available at path-selection time

From `emotional_metadata` (created after mirror):
- `primaryEmotion: string` — broad category
- `granularLabel: string?` — precise label
- `intensity: number` (1–10)
- `userLanguageTags: string[]` — the user's own words (2–5)
- `thematicTags: string[]` — life domain

From `sessions`:
- `entryType` — `open_prompt`, `body_scan`, `word_cloud`, etc.
- `confirmationState` — `confirmed`, `refined`, `gave_up`
- `freezeOccurred`, `freezeDuration` — pre-articulation difficulty

From `preferences`:
- `mirrorTone` — `poetic`, `gentle`, `direct`, `adaptive`

### 5.2 Decision tree

```
(1) If entryType == "body_scan"
    OR userLanguageTags ∩ {numb, empty, foggy, blank, disconnected, nothing} ≠ ∅
    OR (confirmationState == "gave_up" AND intensity ≤ 3)
    → "Find your edges"

(2) Else if primaryEmotion == "anger"
    OR userLanguageTags ∩ {part of me, side of me, piece of me} ≠ ∅
    OR granularLabel ∈ {frustration, resentment, irritation}
    → "Speak to it"

(3) Else if primaryEmotion == "anxiety"
    OR intensity ≥ 8
    OR userLanguageTags ∩ {racing, buzzing, scattered, panic, overwhelmed, can't breathe} ≠ ∅
    → "Reset"

(4) Else if userLanguageTags ∩ {stuck, trapped, heavy, pressure, tight, can't move, boxed in} ≠ ∅
    OR granularLabel ∈ {overwhelm, pressure, stuckness}
    → "Make room"

(5) Else if granularLabel ∈ {shame, guilt, inadequacy, self-loathing, failure}
    OR any userLanguageTag starts with "I should" | "I'm such a" | "why can't I"
    → "Soften toward it"

(6) Else (default, catches sadness / ambiguity / tender / mixed / unclassified)
    → "Let it land"
```

### 5.3 Swap mechanism

On the `sit-with-this` screen, one tap target beside "Done" reads **"Something different"** (or similar — [open] on exact copy).

Tapping it cycles through the next-best match (if matching is scored, not binary) or opens a minimal three-option menu:
- The currently-playing exercise (cancel)
- "Reset" (always available — universal safe option)
- One alternative from the profile's history (e.g., last exercise they completed without swapping)

**Why swap matters in beta:** The matching logic is a guess. In-session swap is how we learn whether the guess was right. A swap is not a failure — it is a labeled data point.

### 5.4 What not to do

- **Do not let the user browse the library.** This turns the exercise list into a menu to choose from, which reintroduces the "what now?" overwhelm the path is supposed to solve. Decisions fatigue users post-mirror.
- **Do not name exercises in-flight.** The user should not see "Let it land" as a title. The exercise has no name from the user's perspective. It just happens. (Internal titles are for telemetry, swap UI, and the eventual library surface post-beta.)
- **Do not show duration up front.** "90 seconds" turns it into a workout. The exercise is over when it's over.
- [open] I am thinking that the user still has to have some indicator that they must be attentive or free at that moment to be able to fully follow the exercise, since exercises just continues on their own still it's done , so user doesnt get distracted, or it is not necessary.

---

## Part 6 — Hybrid Template Architecture

### 6.1 The principle

Every exercise step has two forms:
- **Default text** — safe, authored, works for any user
- **Personalized text** — same structural role, filled with hybrid slots from the user's own mirror

Whichever form Claude produces at generation time is what the user sees. Claude never sees the default — it sees the slot definitions and the user context, and either fills the slot successfully or returns `null` (in which case the default is used).

### 6.2 Generation timing

Two options, with a recommendation:

| Option | When | Tradeoff |
|---|---|---|
| **A. Generate after mirror confirmed** | At the same time as path selection is shown | Slight latency spike at path-selection, personalization ready by the time user enters sit-with-this |
| **B. Generate when user taps "Solo"** | On path-selection tap | No upfront cost, but 1–2s delay before first beat appears |
| **C. Pre-bake all 6 exercises' personalized versions speculatively** | After mirror confirmed | Cheapest perceived latency, highest cost (6× generation) — but they're cheap prompts |

**Recommendation: A.** Generate the matched exercise's personalized slots immediately after mirror confirmation, regardless of which path the user eventually chooses. This is ~2–4 short prompt fills (100–300 tokens), cheap, and makes the sit-with-this entrance feel instant.

### 6.3 Slot filling prompt shape

```
You are filling a small number of slots for a brief
post-reflection exercise. The user has already been
reflected and confirmed.

The user's mirror was: "{mirrorText}"
Their own language tags were: {userLanguageTags}
The exercise is: "{exerciseId}"

Fill these slots:
- user_phrase: One short phrase from the user's own words that captures what they named. Must come from userLanguageTags or the raw input. Never invent.
- mirror_line: The single most load-bearing sentence from the mirror. Must be verbatim.

If any slot would feel forced, stilted, or generic, return null for that slot. The exercise has safe defaults.
```

### 6.4 Safety rails on hybrid output

- **No Claude-generated novel content in-exercise.** Claude fills slots with existing words (user's own or mirror's own). It does not write new sentences for the exercise. This prevents drift and bounds risk.
- **No slot exceeds 10 words.** Hard cap, enforced server-side before storing.
- **Fallback to default is always safe.** Every exercise must read cleanly with no slots filled.

---

## Part 7 — Modality, Pacing, and Completion

### 7.1 Primary modality: text + breath orb + haptic

- **Text cards:** Reanimated fade-in (300ms), hold (variable per beat), fade-out (300ms). Next beat begins immediately on fade-out end. No "Next" button.
- **Breath orb:** Reuses the ember-orb visual pattern from the onboarding frame screen. Expands on inhale, contracts on exhale. Different exercises use different breath patterns (physiological sigh, extended exhale, single slow exhale).
- **Haptics:** `Haptics.ImpactFeedbackStyle.Light` at breath turn points, `Medium` on the close beat. Respect `preferences.reducedMotion` — when true, no haptics, no breath orb animation (show a static settled orb instead).

### 7.2 Not in MVP

- **Audio narration / TTS.** Voice casting is a product decision, not a technical one (whose voice? which accent? gendered?). Bad answers are worse than no audio. Ship post-beta when the product identity has more signal.
- **Ambient sound / music.** Same reason. Also: many users sit-with-this in public or next to a sleeping partner. Audio complicates context.
- **Video / animation beyond the orb.** Scope creep.

### 7.3 Pacing principles

- **Minimum hold on any text beat: 3 seconds.** Enough to read, not enough to rush past.
- **Silent beats are real beats.** `Soften toward it` has a 4s silent beat after the "place a hand" prompt. Do not fill silence.
- **The last beat ("close") gets a 2-second protected pause before the "Done" button becomes tappable.** Prevents the accidental-rush-through failure mode.

### 7.4 Completion & exit

| Scenario | Behavior |
|---|---|
| User completes all beats | "Done" button fades in after the 2s protected pause. Tapping → `session-end?path=solo` |
| User taps "Done" before the close beat | Same destination. `session.pathCompleted = true`. Internal flag `completedEarly = true` (not user-visible). No "are you sure?" dialog. |
| User taps "Something different" | Exercise swap flow. Original exercise is logged as swapped-out. New exercise begins at beat 1. |
| User backgrounds the app | Exercise pauses on current beat. Returns to the same beat on resume. |
| User navigates away via system gesture | `gestureEnabled: false` already set — this is not possible. |

### 7.5 The language of "close"

Each exercise has a different close line. None of them are "well done" or "good job" or "you completed the exercise." The close says one of:
- "You stayed."
- "That's enough."
- "Okay."
- "You're here."
- "That was kind." (only for Soften toward it)

These are calibrated to be honoring without being congratulatory. Research §1.6 explicitly values "somewhere I can actually feel free" — a good job doesn't belong in freedom.

---

## Part 8 — What Adjacent Apps Get Wrong

| App | What it does | Why it's wrong for Xolace |
|---|---|---|
| Headspace / Calm | Long-form guided meditation, voice-over, teaching | Teaches a practice. Xolace is not a practice. |
| Finch | Gamified self-care with a pet that grows | The antithesis. Parasocial, extractive, shame-inducing through progress metaphors. |
| Woebot / Wysa | CBT-scripted chatbot exchanges | Treats user as patient. Xolace §1 (product thesis): not clinical. |
| How We Feel | Emotion granularity check-in with graphs | The granularity work is already done by Xolace's mirror. Dashboards violate "anti-extractive." |
| Balance | Personalized meditation with daily plans | "Daily plan" implies adherence, which implies streaks, which implies guilt. |
| Breathwrk | Breath-only, targeted sessions | Too narrow — misses the integration moment that Xolace is actually selling. |
| Insight Timer | Library of user-generated meditations | Giving users a library to browse reintroduces the decision load the mirror just resolved. |

**The thing Xolace can steal from each:**
- From Calm: the care with which text is held on screen
- From Insight Timer: the ethos of "leave anytime, no pressure"
- From Balance: if we ever add audio, the softness of the voice direction
- From Headspace: nothing — it's the wrong product for our user

---

## Part 9 — Beta Instrumentation

What we must be able to learn from the beta about the solo path.

### 9.1 Required event logs (session-scoped)

- `sit_with_this.entered` — which exercise was matched
- `sit_with_this.beat_rendered` — per beat, which beat, how long
- `sit_with_this.swap_requested` — from which exercise, to which
- `sit_with_this.completed` — all beats seen, close beat reached
- `sit_with_this.exited_early` — at which beat
- `sit_with_this.backgrounded` — duration of background
- `sit_with_this.slot_filled` — which slots were filled by Claude, which fell back to default (aggregated, not content)

### 9.2 Correlations to analyze weekly

- Exercise × `primaryEmotion` × post-session mood delta (lighter / same / heavier / unsure)
- Swap rate by matched exercise (if "Make room" is swapped out 40% of the time, the matching is wrong or the exercise is wrong)
- Completion rate by intensity — does "Reset" actually help high-intensity states reach a lighter mood?
- Time-to-first-swap by entry-type — numb users should swap to "Find your edges" rarely; if they do, matching is broken

### 9.3 Qualitative signal from beta users

One direct question at end of the first week: *"On the solo path — was the exercise you got the right one for how you felt? If not, what would have been better?"*

This is the question research §2.2 should have asked. We can't afford to miss it twice.

---

## Part 10 — Roadmap & Open Questions

### 10.1 Build order

1. **Week 1:** Extend `exercises` schema if needed (see 10.3), seed all 6 exercises, build the runner component that renders beats.
2. **Week 1:** Build "Let it land" end-to-end (default exercise, most common path, most visible risk).
3. **Week 2:** Build matching logic as a pure function (`exercises/match.ts`), wire into path-selection → solo handoff.
4. **Week 2:** Build "Reset" (simplest, universal fallback, needed for swap).
5. **Week 3:** Build "Find your edges" (numb profile — the critical case research §2.4 identified).
6. **Week 3:** Build "Make room", "Soften toward it", "Speak to it" (each structurally similar to "Let it land", mostly content).
7. **Week 4:** Swap UI, instrumentation, beta-readiness pass.

### 10.2 Schema changes to consider

The existing `exercises.steps[].type` union is `text | timer | prompt`. Our design needs:
- **Breath pacing** — currently renderable as a sequence of `timer` steps with content conventions (e.g., `content: "breath:physiological_sigh:3"`). Works but is hacky.
- **Haptic beats** — no representation today. Could be a convention on `timer` steps.
- **Private ephemeral prompts** (Speak to it) — the `prompt` type says "no input captured," which matches the design — but renderers need to know to display an input field.

**Recommendation:** Extend `steps[].type` to `text | timer | prompt | breath | haptic` and add an optional `breathPattern: v.optional(v.union(v.literal("physiological_sigh"), v.literal("extended_exhale"), v.literal("slow_exhale")))` and `hapticIntensity: v.optional(...)`. This is one migration, and it makes the data self-describing rather than convention-dependent.

Keep the change tight — don't over-engineer. Just enough to render these 6 exercises cleanly.

### 10.3 Open questions (decide before build)

1. **Swap UI copy.** "Something different" vs. "Change this" vs. "Different one" vs. single icon. [open]
2. **Where does Claude slot-filling happen in the pipeline?** Inside `ai/process.ts` (right after mirror + classification) or in a new action triggered by path selection? Recommendation: add to `ai/process.ts` — it already has the mirror and classification outputs in scope.
3. **Does `exerciseId` on sessions capture the *matched* exercise or the *completed* exercise?** If a user swaps, both need to be stored for analysis. Likely needs a new junction table `session_exercises` or a simple array field on `sessions`.
4. **Does night mode (`sessionMode: "night"`) affect which exercises are allowed?** "Reset" is arguably wrong at 2am — it's activating. "Let it land" is probably better. [open — needs input from the night-mode design spec]
5. **How does matching interact with `mirrorTone` preference?** "Direct" users may want the shortest exercise; "poetic" users may tolerate longer. [open, low priority for beta]
6. **Should we hold back any exercises from the first beta cohort?** E.g., ship with 4 (Let it land, Reset, Find your edges, Make room) and add Self-compassion + IFS-lite after first round of feedback. Probably yes — fewer variables, faster learning. [recommend]

### 10.4 Fast-follow post-beta

- **Visualization exercise** (the missing 7th type in the enum)
- **Audio narration** (post voice-casting decision)
- **User-selectable exercise** for returning users who want a specific one
- **Between-session touchpoint** (research §5 Q1 — "what carries clarity into the day?")
- **Exercise adapts to mirror tone preference** (§10.3 point 5)

---

## Summary — One Paragraph

The `sit-with-this` path is post-mirror integration, not meditation, not therapy, not a wellness routine. Six exercises cover the field: **Let it land** (default, Focusing receiving), **Find your edges** (numb profile, polyvagal orienting), **Make room** (stuck states, ACT defusion), **Speak to it** (inner conflict, IFS-lite), **Soften toward it** (self-critical states, self-compassion break), and **Reset** (high activation, physiological sigh — also universal fallback). The app matches — the user doesn't choose — but can swap mid-flight. Each exercise uses a hybrid template: safe authored defaults with 2–3 Claude-filled slots that weave the user's own language back in, generated speculatively after mirror confirmation. Duration 60–180s per exercise. No streaks, no completion counts, no badges, no "well done." The close is always a small honoring — "You stayed." — and the Done button surfaces after a protected 2-second pause. The existing `exercises` table already holds the seven-type enum we need; a small extension to the `steps.type` union adds clean first-class support for breath and haptic beats. Ship 4 of the 6 in the first beta cohort, add the rest after the first round of mood-delta × swap-rate analysis.

---

*Document prepared for the Xolace solo-path build, ahead of external beta testing.*
*For internal use — Xolace product and engineering team.*
