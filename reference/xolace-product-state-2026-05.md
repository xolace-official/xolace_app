# Xolace — Product State (May 2026)

A snapshot of what Xolace actually is today, from a product lens. Not a plan. Not a vision doc. What's shipped, what users experience, and where we sit.

---

## What Xolace Is (as shipped)

Xolace is an **emotional processing app** — not a chatbot, not therapy. It fills the gap most people live in every day: too much happening inside to ignore, but not enough to justify calling a therapist. The core question it asks is one: *"What's here right now?"*

The user writes (or speaks) whatever is true. The AI reads it and mirrors it back — 1–3 sentences, more precise than what the user could find for themselves — so the user feels genuinely heard. That moment of articulation is the product. Everything else is built around protecting and deepening it.

**The campfire metaphor still holds.** You sit alone by the fire. The flames illuminate what you're carrying. Sometimes you hear quiet voices from strangers in the dark who felt something similar. The fire (the AI) doesn't participate — it witnesses. It's infrastructure.

---

## Version & Release State

| Version | Type | Date |
|---|---|---|
| 1.3.0.0 | OTA Update | May 22, 2026 |
| 1.2.0.0 | App Store | May 15, 2026 |
| 1.1.0.0 | App Store | May 12, 2026 |
| 1.0.0.0 | App Store | May 2026 |

The app has shipped four meaningful releases in roughly two weeks of public availability. It's in an active, fast-moving early access phase — iOS primary, Android supported.

---

## What the Experience Actually Is

### The Core Loop (3–8 minutes)

1. **Idle** — The user arrives at a minimal screen. "What's here right now?" A few texture words sit below the input — *heavy, tight, foggy, buzzing, empty, scattered, numb, raw* — to scaffold when words don't come. A quiet "Help" pill in the top corner leads to crisis resources.

2. **Typing or Speaking** — Freeform text input or voice (transcribed automatically). No pressure — a gentle nudge appears only after 8 seconds of stillness: *"There's no rush. Let it come."*

3. **Processing** — A breath animation plays while the AI reads what was submitted. Not a spinner. Not *"thinking…"* A quiet, intentional pause.

4. **Mirror** — The AI response appears: 1–3 sentences that name what the user expressed with more clarity than they had. The user can:
   - Confirm: *"That's it"*
   - Refine: *"Not quite"* or *"Say more"* (up to 2 times)

5. **Path Selection** — Once the mirror lands, the user chooses:
   - **Solo** → a breathing exercise (*sit-with-this*)
   - **Peers** → anonymous reflections from strangers who felt something similar
   - **Exit** → they were heard. That's enough.

6. **Session End** — Quiet completion. Optional mood check (*lighter / same / heavier / unsure*). Optional toggle to contribute their reflection anonymously to the peer pool. If heavier is selected, a contextual feedback card surfaces.

### Voice Input
Users can speak instead of type. Voice is transcribed and fed into the same loop. No special UI — just another way in.

### Mirror Read-Aloud
After the mirror appears, it can be read back in a voice matched to the detected emotional tone — poetic, grounded, gentle, witnessed. It makes the experience feel different. More like being spoken to than reading text.

### Mirror Tone Tracking
The emotional tone of each mirror (poetic, grounded, gentle, witnessed, adaptive) is detected, tracked across a session, and displayed as a badge. *Witnessed* was added as a new tone — for moments when precise naming isn't possible and quiet presence is what's needed.

### Daily Quotes
Each day, the user receives an AI-generated quote distilled from patterns in their session history — without ever reading their raw input directly. The quote can be reacted to (heart-burst) and shared as a polished card — glass morphism, campfire mascot, theme-aware palette — via the native share sheet or saved to photos. Weekly push notifications surface the quote at the right moment.

### Haptics
Every emotional moment in the app has a distinct, intentional haptic pattern — on both iOS and Android. 13+ patterns including:
- Mirror arrival: a 3-beat crescendo (*herald*)
- Session complete: *bloom*
- Processing breath: *breath* (continuous, in sync with the orb animation)
- Error: *wobble*
- Peer reflections: *murmur*

Nothing is decorative. Each pattern is calibrated to its moment.

### Timeline
A running record of past sessions. Tap any entry to read the mirror and see the path taken. Private, chronological.

### Settings
- **Appearance** — six color themes (base, quiet, reverie, human, nightly, alpha) each with light and dark variants. Users can set the visual register to match who they are that day.
- Notification preferences, quote preferences, account and data controls.

### Crisis Resources
A quiet "Help" pill in the top-right of the reflect screen leads to emergency numbers and hotlines for Ghana, US, UK, Australia, and Canada. Country-aware, one-tap emergency call. Labeled *"Help"* not *"Crisis"* deliberately — lower activation threshold.

### Feedback System
Four channels, none of which interrupt the emotional moment:
- **General** — in Settings under Support; rate-limited to 5 per day
- **Heavier mood** — surfaces at session end when the user reports feeling heavier; throttled to once per 24h
- **Mirror miss** — a quiet field in the Clarify state captures what was off without blocking the flow
- **Gave up** — a card in the Gave Up state asks why the user stopped

---

## What the Experience Feels Like

Slow. Intentional. Quiet. There are no notifications nagging you back. No streaks. No score. No social proof. The app doesn't celebrate your consistency — it just shows up when you do, and tries to be worth it.

The AI doesn't cheerfully summarize your feelings. It names them with restraint. The emotional temperature is low-heat: safe without being saccharine, honest without being clinical. The submit button says *"Let it out"* — not *"Send."*

Six color themes let users adjust the visual register to match their state — from clinical near-white (*alpha*) to warm amber (*human*) to deep navy (*nightly*).

The breathing exercise in sit-with-this pulses in sync with the orb. The haptics swell and release with the animation. The details are doing work.

---

## What It Explicitly Is Not (enforced by design, not aspiration)

- **Not a chatbot.** No chat bubbles, no back-and-forth, no conversation threads.
- **Not a social app.** No profiles, no feed, no followers, no public content.
- **Not a wellness app with forced positivity.** No gamification, no streak guilt, no badges for showing up.
- **Not clinical.** No diagnoses, no therapeutic terminology.
- **Not an AI companion.** Parasocial attachment is actively avoided. The AI witnesses — it doesn't participate.

---

## Where We Sit

Xolace is in active early access with four meaningful releases in its first two weeks. The core loop is solid. Supporting features — voice, quotes, haptics, crisis resources, feedback system — are shipped and working.

The team is in a listening phase. The feedback system exists precisely to understand where the product is losing people. The key questions right now:
- Does the experience become a recurring behavior (not just a one-time relief)?
- Where do users drop off (which state, which path)?
- What does *heavier* mood feedback tell us about what the mirror is getting wrong?

The next horizons — longitudinal pattern insights (REFLECT layer) and deeper peer connection (CONNECT layer) — are not yet scoped. Focus is on retention and the quality of the core loop.

---

*Written May 26, 2026. See `xolace-project-summary.md` for the original pre-launch planning doc.*
