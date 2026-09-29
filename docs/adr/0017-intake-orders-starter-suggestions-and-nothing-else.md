# Intake may order the Starter suggestions — and nothing else

ADR-0014 allowed `disclosureStyle` and `emotionAwareness` to reach exactly one
place, the first-session mirror prompt, and rejected intake choosing how a
session is entered. Starter suggestions (see CONTEXT.md) are a second consumer
of intake. This ADR rules on what that second consumer may do, so the
precedent stays narrow.

**Decision (v1).** Intake may change the *order* of the five suggestions and
nothing else. All five always show. Copy never explains why a row is first
("because you said…" is the surveillance read ADR-0014 warned about).

- `intent` picks the first row: `understand_feelings` and `make_it_regular` →
  Reflect; `get_through_hard_moment` → Vent; `feel_less_alone` → Xolacer chat;
  `just_looking` → Listen.
- `emotionAwareness` of `know_but_no_words`, `something_off_unclear` or
  `numb_or_cant_tell` moves Reflect to the bottom, so a writing prompt is not
  first for someone without words.
- Remaining rows keep the fixed default order. No intake answers, or
  `prefer_not_to_say` → the default order.

**Not licensed.** `weighingOn` stays an anti-pattern here too.
`copingStyle`, `disclosureStyle` and `supportFrequency` are unused. Intake does
not hide a suggestion, change copy, or pick the entry mode inside a session.
This also promotes `intent` from "deferred" to "used, for this one purpose".

**Why this is an ADR.** Hard to walk back once users see a personalised order;
surprising next to ADR-0014's "not routing"; and a real trade-off against a
fixed order. Ordering was chosen over hiding because a hidden suggestion is a
decision made on the user's behalf, an ordering is not.

**Revisit.** The founder ruled v1 stays this simple until more personalisation
is wanted; any widening (more fields, hiding, copy) needs a new ADR.
