# Classifier intensity on positive sessions

Resolves **Audit intensity on positive sessions** (#494, map #484). Run 2026-10-02 against
`classifier-v1-haiku-4.5`, current prompt, no pattern context. Script and raw results are in `intensity-positive/`.

## Why we asked

Intensity has no sign, and a session reading is `100 − (intensity − 1) × 100/9`. The rubric's HIGH cues
(repetition, absolutes, physical language) fire just as well on good news as on bad news.

## Method

13 positive probes in four registers (excited, warm, calm, mixed). Each was run 3 times. Dev data was not pulled
because exporting the tables was blocked for containing users' raw text. The probe answers the question without it.

## Results

| Register | Probes | Mean intensity | Reading |
|---|---|---|---|
| Excited | job (caps), engagement, exams passed, pregnancy | **8.5** (8–9) | **17** |
| Warm | love, pride (10k), relief (clear scan), friends' dinner | 6.2 | 43 |
| Calm | "calm and grateful", hope in therapy, quiet Sunday | 3.0 | 78 |
| Mixed | job plus moving away, engaged plus family won't accept him | 6.0 | 44 |

- Every probe stayed in the joy or love family except "engaged-family", which was classed `anxiety`. That's correct, so it stays on the normal mapping.
- Haiku is stable: 12 of 13 probes got the same integer all 3 times (proud-run went 7, 6, 7).

## Finding

**Positive sessions read high.** Good news reads as one of the person's least steady days ("I GOT THE JOB!!!" gives 11).
Even calm gratitude doesn't get above about 80. Without a guard, a good week in a domain would look like compounding.

## Decision: valence guard = floor at 75

For a session whose `primaryEmotion` is in the joy or love family (`emotionFamily()` includes `joy` or `love`):

```
reading = max(100 − (intensity − 1) × 100/9, 75)
```

- Calm positive sessions keep their own reading (78–89). Excited good news reads 75, not 11.
- A big high doesn't count as steadier than a calm day, because steadiness is not happiness.
- Mood-check and follow-up steps still apply on top, relative to the guarded reading.
- Rejected: **skip** (the domain would see only hard sessions, a negativity bias by construction), **invert into a top band**
  (it rewards elation, which leans toward celebration rather than steadiness), **pure inversion** (calm gratitude would read 22).

## Known ceiling

- Mixed sessions classed as joy ("got the job, but leaving everyone, so scared") are floored too, so the fear in them is lost.
  Their mood check or follow-up can still lower the reading.
- Probes are single-author and English only, with no dev distribution.
- Re-run `intensity-positive/run.ts` together with the length-bias script as part of the classifier release gate.
