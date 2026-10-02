# Classifier intensity: is there a length bias?

Resolves **Audit classifier intensity for length bias** (#493, map #484). Run 2026-10-02 against
`classifier-v1-haiku-4.5` (`claude-haiku-4-5-20251001`, default temperature, no pattern context).
Scripts and raw results are in `intensity-length-bias/`.

## Why we asked

The classifier prompt lists "long reflective writing" as a LOW-intensity cue and "very short punchy
input" as a HIGH cue. The steadiness score trusts stored intensity (ADR 0019), so a length bias
would make people who write more look steadier than they are.

## Method

1. **Dev data.** 161 `open_prompt`/`voice` sessions with stored `rawInput`, comparing input length with stored intensity.
2. **Vivid pairs.** 10 pieces of content with weights from 2 to 9, each written as one short line and as about 150 words with the
   same weight, in the user's own heated register. Each version was run 3 times.
3. **Composed pairs.** The 4 heaviest pieces again, with the long version rewritten in a calm,
   reflective register ("I notice…", "I'd like to reflect…"). This is the case the LOW cue targets.
4. Each set ran on the current prompt (**A**) and on a candidate fix (**B**). B removes both length cues and
   says "length is not a signal in either direction".

## Results

| Probe | A: long − short | B: long − short | MAE vs hand label (A) |
|---|---|---|---|
| Dev data (n=161) | Spearman **+0.24** (longer runs slightly *higher*) | — | — |
| Vivid pairs (n=10×3) | **+0.27** (heavy ≥7: +0.20) | +0.40 | short 0.50 · long 0.77 |
| Composed pairs (n=4×3) | **−0.67** | −0.75 | short 0.75 · long 0.42 |

- Dev inputs top out at 525 chars, so dev data can't see long-form writing. That is why the paired sets exist.
- Haiku is very stable. 3 reps almost always return the same integer.

## Findings

1. **No length bias.** Length alone doesn't lower intensity. Long heavy writing scores the same as the short version, or up to 1 point higher.
2. **A small register effect.** Calm, composed writing about heavy content scores about 0.7 lower than a
   short heated line saying the same thing. In 3 of 4 cases the composed score sits *closer* to the hand label.
   The short heated lines run about 0.5 to 1 point hot. This is arguably correct: intensity is how much it weighs right now,
   and composed prose is often a sign of processing.
3. **The prompt fix does nothing.** B moves no pair by a meaningful amount, so the length cues in the prompt aren't
   what drives scores. No prompt change. Changing the prompt would also bump `CLASSIFIER_VERSION` and split the stored history for no gain.

## Facts for the Steadiness formula

- Treat stored intensity as **ordinal, ±1 noise**. Haiku's whole error budget is about 1 point, whether from register, inflation of short lines, or the gap from hand labels.
- **No length normalisation and no length-based down-weighting.** The bias it would correct doesn't exist.
- Don't let one intensity step of ±1 move a score by itself. Leave that to aggregation and the reliable-change band.
- Known ceiling: hand labels from a single author, 14 pairs, English only, no pattern context. Re-run `run.ts`
  whenever the classifier prompt or model changes.
