# The Library segments by generic facets and matches on the Understanding's vocabulary — not the kindling topic

The Library (curated reading: explainers, advice, stories) needs several
segmentation layers at launch — subject, audience, and whatever the read
twig matches on — and more later. It also has to be recommendable by the
kindling read twig with **no new model call** (Cognition Layer Constitution).
Two questions, settled together because they share one answer: how layers
are stored, and what the twig joins on.

**Layers are generic facets, not typed fields.** An entry carries facets —
`(axis, slug)` pairs validated against a facet catalogue. Launch axes:
`subject`, `audience`, `emotion`, `lifeArea`. A new layer (`region`,
`format`) is a new axis value in the catalogue, with no schema change and no
backfill. Only **kind** (`explainer | advice | story`) stays a real field:
it's closed and it drives rendering. Rejected: one array field per layer —
every new layer would be a migration, and arrays can't be indexed per value.

**The twig matches on the Understanding's own words.** The Understanding
never produces a kindling **topic** — it produces `primaryEmotion` (13 closed
values) and `thematicTags` (17 closed values). The `emotion` and `lifeArea`
axes *are* those two vocabularies, read from one shared constant the
classifier prompt also uses, so a match is a plain join. Rejected: reusing
kindling topic slugs (audio-shelf shaped, and the Understanding has no topic
to join on) and a subject→topic mapping table (a translation layer that
drifts). `granularLabel` is open text and is not an axis until it has a
curated list.

**Subject is not topic.** The browse A–Z layer is named **subject** so it
stays free to be human-friendly ("Exams", "Burnout") without extending the
model-chosen topic catalogue.

**Hubs are ordered and cross-feature.** A hub is an editor's running order,
so it is its own ordered list, not a facet. Its items are a tagged union
(entry | audio track at launch), so a series or an app action can be added as
a new variant later.

## Consequences

- Twig safety: a facet match is suppressed when the session's safeguard
  verdict is elevated/crisis; the twig defers to crisis resources.
- "For you" = recent Understanding facets + an audience the user picks
  inside the Library (multi-select: student, professional, parent, founder…).
  Intake answers are not an input (ADR 0014).
- If the classifier's vocabularies ever grow, the shared constant grows with
  them and existing entries stay valid; removing a value orphans its facets.
