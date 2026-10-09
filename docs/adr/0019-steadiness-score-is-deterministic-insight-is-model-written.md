# A domain's steadiness score is deterministic; its insight is model-written

Each domain gets a 0–100 steadiness score and an insight about it. We split
the two. **Code computes the number** from the stored Understanding and the
user's self-reports. **A model writes the insight**, in the Reflection Agent's
consolidation pass, using RAG over the user's own episodic memory. No model
ever writes, adjusts or vetoes a score, and the compounding flag is
deterministic too. The research
(`docs/research/compounding-layer-wellbeing-scoring.md`) found LLM-issued
scores unreliable across runs, drifting across model versions and
overconfident. A deterministic score can be replayed when the formula changes.
A count-based line ("Work came up in 6 of 10 sessions") teaches the user
nothing about themselves, so the insight is the main layer and the
deterministic facts sit beneath it as evidence.

## Considered Options

- **LLM-judged score**, or a deterministic score that a model may nudge.
  Rejected because the reliability problems carry over, and nobody can explain
  why a score moved.
- **Templated insight only.** Rejected because it is honest but tells the user
  nothing new.
- **Filter the semantic profile's `trajectory` by domain.** Rejected because
  `trajectory` is one line of prose for the whole profile. Pulling per-domain
  meaning back out of it would re-derive what the Understanding already holds.
- **A standalone writer per domain.** Rejected because it sees one domain at a
  time and so cannot find cross-domain links, which are the insights most
  likely to feel new.

## Consequences

- The insight inherits the consolidation cadence (5 sessions or 7 days), and
  each run replaces the last run's set. Every insight shows the date it was
  written. (#525 dropped hiding an insight when its score crosses the band:
  the gate already checks direction at write time, and the cadence refreshes
  it within days. Revisit if a contradicting insight shows up in practice.)
- Before commit, a quality gate rejects any insight that a template could have
  produced from the score and counts, that cites fewer than two sessions, that
  contradicts the score's direction, or that names a sensitive life area.
  When nothing passes, no insight is shown.
- A crisis session reaches the insight only through its metadata. A user with
  personal memory off gets no model insight.
- Scoring trusts the stored intensity, so the length bias in classifier
  intensity has to be audited before the formula is settled.
