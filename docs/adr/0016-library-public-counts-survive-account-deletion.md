# Library public counts survive account deletion

The Library shows readers anonymous totals: views on the entry card and
"N found this helpful" at the end of a read. A user's own signals are private
rows (one per user and entry), and data wipe and account deletion delete those
rows. The totals don't go down when that happens. A view, or a "helped" tap the
user never undid, still counts after they leave. Only an explicit undo of
"helped" subtracts.

We chose this because a total says something about readers the entry has had,
not readers it has now. Subtracting at deletion would add a write to every
delete loop for each entry touched, and it would make counts drop for reasons
readers can't see. The totals hold no identity: a count can't be traced back to
a person, and it is hidden below 15 so a small number can't identify anyone.

## Considered Options

- **Subtract on wipe/deletion** (rejected): strictly "only current users,"
  but it costs a write per row in the deletion loops and makes shown numbers
  shrink for no visible reason.
- **Keep totals, subtract only on undo** (chosen).

## Consequences

- A wiped user who reopens an entry counts as a new view and can tap "helped"
  again. We accept this small overcount.
- Totals are never seeded from source-side or editorial figures. Only real
  Xolace readers are counted.
- Views count once per user, on first open. The per-user row prevents double
  counting, so reopening never inflates a total.
