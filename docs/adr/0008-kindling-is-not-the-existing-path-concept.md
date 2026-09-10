# The new feature is "kindling", and it keeps "path" only as an internal word

Xolace already has a concept called **path**: the post-mirror choice a user makes
between sitting with a solo exercise, going to peers, or exiting
(`path-selection` screen, `selectPath` / `completePath` mutations,
`session.state` values `path_selected` / `path_in_progress`). It is immediate,
free, always offered, and a single choice.

The feature this spec (`docs/paths-v1.md`) defines is a different thing that was
also being called "path" during design: a background-generated bundle of 2–3
support actions, Xolace+ only, tended in any order, some skippable. Shipping two
concepts under one word — in code, in analytics, and in the product voice — was
going to cause the exact confusion the map's charting grill kept hitting.

**Decision:** the new feature is branded **kindling**; one item in it is a
**twig**; its route is `(protected)/kindling/`. The existing feature keeps every
one of its code names unchanged, but in prose and docs it is now called **next
step**. "Path" survives only as an internal/schema word for the new feature —
`convex/ai/paths/`, the `paths` and `path_steps` tables, and the `path_*`
analytics event names — and never appears in UI copy.

"kindling" fits the digital-campfire metaphor (`CLAUDE.md`), carries no clinical
register, and reads correctly in notification copy ("your kindling is ready") and
as a Today-card label. **ember**, **hearth**, **glow**, and **flame** were
rejected — each is already load-bearing elsewhere (a CSS theme token, shipped
onboarding components, and `flame` already means the System-1 hot path in
`docs/cognition-layer-architecture.md`). **tinder** was rejected for trademark
risk.

Recorded in `CONTEXT.md` under "Paths: kindling naming (2026-09-08)". Resolved in
[#269](https://github.com/xolace-official/xolace_app/issues/269) via
`/grilling` + `/domain-modeling`.

## Consequences

**Two vocabularies, deliberately.** Code says `path` (tables, directory, events);
humans say `kindling` / `twig` (UI, docs, notifications). A reviewer grepping
`path_` will find both the old next-step code and the new kindling code — they
are adjacent in the tree and share a prefix but are unrelated features. Every doc
that touches either must use the prose names so the split stays legible; the
`docs/paths-v1.md` terminology table is the reference.

**The analytics names cannot be "corrected" later without a data break.**
`path_generated` / `path_opened` / `step_completed` etc. are the kindling events;
renaming them to `kindling_*` after launch splits every funnel across the rename
boundary. They stay `path_*`. This is the same trade already made for
`notification_log.reachUsed` (`CONTEXT.md` "The two Reaches") — accept the
mismatched internal name, keep the copy clean.

**"next step" has no schema footprint of its own here.** This ADR renames it in
prose only. `selectPath`, `completePath`, and the `session.state` enum are
untouched, because touching them is a store-gap-sensitive change to a shipped hot
path for zero functional gain.

**Reversible in principle, not in practice.** If "kindling" tests badly with real
users, the UI strings are one copy pass to change. The route slug, the table
names, and the event names would not follow — they are the durable "path"
internal word and are meant to outlive any branding revision.
