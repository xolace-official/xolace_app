# Compounding stretches are stored; steadiness scores are replayed

Steadiness, baseline and trend are computed on read from the readings that
remain (ADR 0019, Score history #510). Compounding is not. Each **stretch** is
stored as one row (`profileId, domain, startedAt, anchorBaseline, endedAt?,
followUpStartedAt?, upsellShownAt?`), written whenever a reading lands, and
never recomputed afterwards. A stretch depends on its own past (hysteresis,
the baseline anchored at its start, `returning` measured from the previous
stretch's end), and two of its facts (the follow-up and the upsell) are events
no reading records. Replaying it would let a tuning knob or a classifier change
rewrite history: the stretchId would shift, a used follow-up could fire again,
and "the last time Work got this heavy, in March" could vanish.

## Considered Options

- **Full replay** (fold every reading in time order on each read, store only
  the two event flags). Rejected: path-dependent, and the past changes
  whenever the formula does.
- **One per-domain state row, overwritten.** Rejected: it loses the past
  stretches that `returning` and insights need.

## Consequences

- No backfill on a knob or classifier change. Closed stretches stay true under
  the rules of their time. An open stretch is judged by the current rules
  from its next evaluation onward, against its stored anchor.
- A silence lapse needs no cron. The end is derivable (last reading + 30
  days), so readers treat a quiet open row as ended then, and the next
  evaluation writes that `endedAt`.
- Retention deletes closed stretches whose `endedAt` is past the cutoff and
  never deletes an open one. If old readings age out under an open stretch,
  its stored anchor stands. A data wipe or account deletion removes every row.
