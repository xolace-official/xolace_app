# The Understanding's vocabulary grows to serve the Library, with parent emotions as the safety default

ADR 0015 made the Library's `emotion` and `lifeArea` axes the classifier's own
two lists. The Library's authoring sheet showed those lists (13 emotions, 17
life areas) were too coarse: only a fraction of the words authors wanted
existed, so authors were force-fitting. We grow them to 32 emotions and 31
life areas, still one shared list (ADR 0015 stands).

**Parent emotions.** Each new emotion declares an existing broad emotion as its
parent. `safeguard` and `followUpCadence`, which hold hand-written emotion
lists, treat an unmapped emotion as its parent. A forgotten edit in one of
them is silent — a distressed person is simply not flagged — and the list will
keep growing. Judgment calls are still placed explicitly (`hopelessness` is
high-distress). Rejected: exhaustive typed tables that fail the build until
every consumer is edited — safer against forgetting, but every new word then
costs an edit in every consumer, including when the answer is "same as its
parent".

**No inferred protected categories.** The classifier never tags sexuality,
religion, ethnicity or immigration status. They are special-category data and
a wrong guess mislabels a person permanently. The Library serves them through
the audience the reader picks, which is consent rather than inference.

**One source, validated.** The classifier's response parser imports the shared
constant rather than keeping its own copy, and drops `thematicTags` outside the
vocabulary. Before, an emotion missing from the copy was silently stored as
`confusion`.

## Consequences

- No backfill. Old sessions keep their old labels (re-deriving would need a
  model call the Cognition Layer Constitution forbids), so the new axes are
  thin in "For you" at first.
- Shipping is gated on a labelled classifier eval that must not regress the
  original thirteen emotions.
- Old app binaries show an unknown emotion as a 💭 and its capitalised name;
  nothing breaks.
- Removing a value still orphans its facets.
- Library ingest resolves author words (including the sheet's adjectives) to
  canonical slugs through one alias map beside the vocabulary; unknown words
  still reject the entry.
- A new `studies` xolacer specialty is added so the `studies` life area can
  suggest a listener. Richer matching in `paths/catalog` and
  `exercises/match` is deferred to a separate issue.
