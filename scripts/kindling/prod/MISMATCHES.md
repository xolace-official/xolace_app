# Kindling prod manifest — known mismatches / gaps

Running log of pairings made by elimination (last-audio-left ↔ last-thumb-left)
or where the source table disagreed with the actual file. Everything below is
already paired and ingestible — `ingest.ts --update-hashes` and the
audio/thumb/hash validation all pass — but these entries deserve a manual
listen/look before the real upload, since the title, artist, or duration on
record may not describe the actual audio.

Format: `slug — what's wrong — what to verify`.

## music-sleep-rest-06 — "Sink Into Sleep"
- Source table said artist MarloweMusic, duration 2:52 (172s).
- Paired audio (`marlowemusic-meditation-sleep-580201.mp3`) actually runs
  4:47 (287s) — recorded `durationSec` is the real 287s, not the table's 172s.
- Was the last unmatched MarloweMusic file after the other two MarloweMusic
  tracks matched titles/durations exactly — title match is by elimination,
  not a duration confirmation.
- Verify: listen and confirm this file is actually "Sink Into Sleep" and not
  a different MarloweMusic track that got mislabeled upstream.

## music-self-love-20 — "Love - Acoustic (1m)"
- This slug pairs the one thumbnail left over after matching (table row 45,
  "Love - Acoustic (1m)", artist AtlasAudio, table duration 1:54/114s) with
  the one audio file left over (`theorienvibes-once-more-one-life-233087.mp3`,
  artist theorienvibes, actual duration 4:00/240s).
- Title, artist, and duration all come from different sources: title/thumb
  from the table row, artist/audio/duration from the actual file. These are
  almost certainly NOT the same track — this is a forced pairing to avoid an
  orphaned thumbnail and an orphaned audio file, not a real match.
- `licence.artist` was set to the real audio's artist (theorienvibes) for
  attribution accuracy, but `title` still says "Love - Acoustic (1m)" from
  the thumbnail. Consider retitling to match the audio's real content
  ("Once More One Life") once confirmed, or sourcing the correct AtlasAudio
  file separately.

## music-mindfulness-06 — "Path of Mindfulness (Short)"
- Same situation: last unmatched audio (`meditativetiger-mindfulness-chimes-
  being-present-489163.mp3`) paired with the last unmatched thumbnail
  (`Path of Mindfulness (Short).jpg`) — no source table row backs this pair
  since it was outside the originally screenshotted table range.
- Title "Path of Mindfulness (Short)" is inferred from the thumbnail
  filename only; artist "MeditativeTiger" and duration 140s come from the
  actual audio file's own filename/ffprobe reading.
- Verify: confirm the thumbnail's content actually matches a "path of
  mindfulness" theme and not something else entirely.

## General note — licence.sourceUrl
Every track's `licence.sourceUrl` is currently set to the category search
page on Pixabay (e.g. `https://pixabay.com/music/search/mindfulness/`,
`.../sleep/`, `.../self-love/`), not the individual track's page — this was
an explicit placeholder per instruction ("for now the source urls just place
this"). Replace with the real per-track Pixabay URL before shipping if exact
attribution links are required.
