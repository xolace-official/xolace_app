# Product Vision: Consumer + B2B, Full Scale

Founder's working vision doc — what Xolace looks like fully built, on both sides, if we win. Not a roadmap or sequencing plan (see [paths-b2b-preventive-market-research.md](./paths-b2b-preventive-market-research.md) for that); this is the end state the roadmap should be aimed at.

## The thesis

The product isn't the reflect flow, the bot, or either app shell. It's the Understanding engine — semantic profiles, episodic memory, the classification/safeguard layer described in [cognition-layer-architecture.md](./cognition-layer-architecture.md). Consumer and B2B are two surfaces selling access to the same core asset: a system that notices what's happening to someone before they'd think to say it out loud.

The campfire metaphor holds on both sides. For an individual, it's the fire that shows you what you're carrying. For an org, it's the fire that shows leadership where the org is carrying too much — without the fire ever becoming the surveillance.

## Consumer, at full scale

You stop "opening the app." The check-in disappears as a deliberate action because the Understanding is already ambient — reading session-gap drift, WhatsApp reply cadence, sleep and screen-time signal the user has granted access to. The fire doesn't wait for you to sit by it; it notices when you've been standing too far from it and says something, in your own cadence, before you'd have thought to ask for help.

- **The semantic profile becomes genuinely longitudinal.** Not "what did you say this week" but a shape of *you* built over years — the mirror gets sharper the longer you stay. That's the real retention moat: nobody can export that context to a competitor.
- **Peer-reflections stops being a feature and becomes ambient.** A real sense of "others near this same feeling right now" — proximity without profile, the quiet voices in the dark, at scale.
- **Streaks stop being gamification and become proof.** Not an achievement ladder — confirmation the maintenance habit held, the way you'd notice if you'd skipped a routine for two weeks.
- **Passive signal replaces self-report where it can.** Session cadence, input-length drift, WhatsApp read/reply latency, and (with consent) HealthKit/calendar data feed the existing follow-up cadence system (`convex/lib/followUpCadence.ts`) as a new signal class — not a new "how are you feeling" screen.

## B2B, at full scale

The Slack bot and 15 static scripts (the MVP shape) are gone, replaced by the same Understanding engine reading communication velocity and calendar density passively — no buttons, no check-ins.

But the real product isn't the employee-facing layer. It's what HR gets: not a burnout dashboard, an **org nervous system** — which team's friction predicts next quarter's regretted attrition, which manager's 1:1 cadence correlates with their reports recovering vs. compounding. Aggregated and anonymized tightly enough no individual is ever exposed, precise enough leadership finally has signal instead of an annual engagement survey.

At that scale, Xolace isn't competing with Lyra or Modern Health on "we have therapists too." It's the analytics layer sitting upstream of whether anyone needs a therapist at all — a category nobody currently owns cleanly.

## The moat: what neither side gets alone

Every competitor is one or the other. Lyra and Spring Health are B2B-native with no consumer trust layer. Wysa and Modern Health bolted B2B onto consumer without ever letting the two touch — real precedent for running both (see the research doc), but always as a separate product surface on shared backend, never integrated at the person level.

The thing nobody's done: with explicit consent, a person's Understanding follows them *across* the boundary. Someone who's been building an emotional fingerprint with Xolace for two years as a consumer, whose employer separately buys the B2B product, doesn't start over. Not their raw data crossing over — the trust and the calibration does. That's structurally hard for a competitor to copy without owning both sides, which is exactly the position consumer-first already puts us in.

## Not a pivot

Consumer stays the foundation, not a phase to graduate out of — it's where the Understanding gets trained, tested, and trusted at low stakes before it's asked to inform something an employer pays for. B2B is additive once that's proven, the way Modern Health and Wysa added it. No company in the comparable set pivoted an existing consumer mental-health app into B2B; none should be the model here either.

## The risk worth naming

If B2B ships before the Understanding is good enough to trust with an employer's money, it burns credibility on both sides at once. That's the actual gate — not a company-structure question, not a go-to-market question.
