# Daily Mood is a valence scale, not an emotion picker

Xolace runs an emotion classifier. `emotional_metadata` carries
`primaryEmotion` — `"anger" | "sadness" | "anxiety" | "joy" | "confusion" |
"numbness"` — inferred from what the person actually wrote, with a confidence
score and a `granularLabel` beneath it. So the Today tab's mood card asking for
`heavy / low / steady / good / light` instead of a face per emotion looks like
someone forgot the classifier existed. This records why it is the other way
round.

**The categorical version duplicates a field we already derive better.** A tap
on 😡 is one self-reported token. `primaryEmotion` is the same question answered
from the user's own sentences, with a secondary emotion, a granular label, and a
confidence number attached. Shipping the picker would give us a second, thinner
column claiming to answer what the Understanding already answers — which is the
shape the Cognition Layer Constitution exists to refuse, even though no LLM call
is involved.

**Categorical does not chart.** The mood row's stated purpose is a trend the
user eventually sees and the quote prompt eventually reads. `happy → angry →
sad` has no axis; there is nothing to plot and no way to say "this week was
heavier than last". `heavy → light` is ordered, so seven taps make a shape.

**Categorical forces a wrong answer.** Angry *and* sad is the ordinary case, and
a single-select picker makes people discard half of it at the moment they are
least able to adjudicate. Valence has no such conflict: angry-and-light and
angry-and-heavy are both coherent, and only the second is worth acting on.

**The decisive one: naming the emotion is the task the product exists because
people cannot do.** Xolace's premise is "I don't even know what I'm feeling."
Putting a name-your-emotion picker on a daily surface asks for the output of the
work, as the price of entry, before any of the work has happened. "How heavy is
today?" is answerable by someone who cannot name it — which is the person we
built this for.

The midpoint is `steady`, not `flat`, for a related reason: a five-point scale's
middle would otherwise absorb both "nothing much, I'm fine" and "I feel
nothing", which are opposite states — the second is what `numbness` exists to
catch. Numbness sits at `low`. A sixth off-axis point for it was rejected: it
would make the scale unchartable, and charting was the whole reason for ordering
it.

## Consequences

**The stored values are one-way.** Valence rows cannot be re-mapped onto emotion
categories retroactively — nothing in `heavy` tells you whether it was grief or
rage. If we later decide we want categorical daily data, it starts accruing from
that day, and the history stays valence. This is the reversibility cost, and it
is why the decision is written down rather than left in a card component.

**Emoji are presentation only.** The record is the ordered enum; the emoji and
the one-word label are display. An unlabelled 😐 means five different things to
five people, so the word ships with the face and is also the accessible name.
Changing the emoji set later is free. Changing the enum is not.

**The scale is a self-report and must never be laundered into insight.** It
reaches exactly one model surface — the daily-quote prompt (`convex/ai/
quotesPrompt.ts`), as a line summarising the last several days. It deliberately
does not reach the mirror: the mirror has the person's actual words in front of
it, and a 😐 tapped that morning adds nothing next to them while inviting the
mirror to parrot a self-report back as though it were an observation. It does
not reach `generateNotification.ts` either, where the no-guilt copy rules are
easier to violate than to satisfy.

**Revisit if the daily mood insight needs texture.** A single ordered dimension
is the right v1 because it charts and because it is answerable on a bad day. If
the insight turns out to need "heavy about *what*", the answer is to read
`thematicTags` from the Understanding alongside it — not to add an emotion
picker to the card.
