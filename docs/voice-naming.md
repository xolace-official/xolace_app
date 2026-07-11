# Voice naming — the custom-voice cast

Plus users can override the mirror/vent voice with a named voice from a curated
cast. Names are **campfire-flavored and permanent** — the slug is stored in
`preferences.voice`, so renaming a shipped voice would orphan every user who
picked it. The cast leans nature-and-dusk so it reads as one family, none
generic.

The catalog lives in `convex/lib/voices.ts` (`VOICE_CATALOG`). The client mirror
(labels, descriptions, SF Symbols, preview require-map) lives in
`src/features/settings/voice-options.ts`.

## The cast

| Slug | ElevenLabs actor | Character | In-app description |
|------|------------------|-----------|--------------------|
| `sage` | Jane (`RILOU7YmBhvwJGDGjNmP`) | 50s, warm cadence, storyteller | "Older and unhurried. Like someone who's heard a lot and isn't in a rush." |
| `wren` | Blondie (`exsUS4vynmxd379XN4yO`) | Warm British woman, storytelling | "Soft-spoken, with a gentle lilt. Easy to sit with." |
| `vesper` | Ellen (`BIvP0GN1cAtSRTxNHnWS`) | Calm, grounded, international accent | "Calm and steady. Holds the ground when your thoughts won't." |
| `ash` | Austin (`Bj9UqZbhQsanLzgalpEG`) | Deep, raspy, intimate "fireside talk" | "Low and gravelly. Close, like someone leaning in across the fire." |

`Auto` (no slug / `undefined`) is the free default: the mirror uses the
tone-mapped voice, the vent uses Witnessed. It is not part of the catalog.

## Why these names

- **Sage** — doubled meaning: the herb *sage* (burned to cleanse and calm a
  space) and *a sage* (an elder who's seen enough to speak slowly). Both point
  at an older, grounding presence — the read-to-you-at-night voice.
- **Wren** — a small brown songbird with an outsized, gentle song: unassuming
  but warm. The Britishness lands naturally (an English garden bird). Reads as a
  quiet friend, not a performer.
- **Vesper** — Latin for *evening*; vespers are the day's last, quietest
  prayers, and the evening star. The voice for late-night, end-of-day
  processing — steady while things wind down. Ties into the "you open Xolace at
  night" moment.
- **Ash** — what a campfire leaves: the warm, settled remains after the flames
  (also the ash tree — rooted, steady). The most campfire-native name, given to
  the deepest, most intimate voice.

Cohesion: **Sage** (herb), **Wren** (bird), **Ash** (fire's remains / tree),
**Vesper** (evening) — all nature-and-dusk.

## Tone-default voices (not in the picker)

These back the free tone-mapped mirror + vent and are the fallbacks in
`resolveVoiceId`. Kept out of the custom-voice picker so "Direct" isn't both a
tone *and* a voice.

| Role | Actor | ElevenLabs id |
|------|-------|---------------|
| gentle | Priyanka | `BpjGufoPiobT79j2vtj4` |
| poetic | Arabella | `Z3R5wn05IrDiVCyEkUrK` |
| direct | James | `EkK5I93UQWFDigLMpZcX` |
| adaptive | Jarnathan | `c6SfcYrb2t09NHXiT80T` |
| witnessed / vent | Spuds Oxley | `NOpBlnGInO9m6vDvFkFC` |

## Preview assets

Static bundled clips at `assets/sounds/voice-previews/<slug>.mp3`, one fixed
line — *"I'm here. Take whatever time you need."* — one per cast voice. Playable
even when the voice is locked (hearing it is the sell).

- Generated with `scratchpad/generate-voice-previews.mjs` (eleven_v3,
  `output_format=mp3_44100_64`, same `voice_settings` as production).
- **Never** call ElevenLabs live from the app for previews.
- Sizes: sage 20KB, wren 22KB, vesper 17KB, ash 18KB — **~78KB total**, a
  non-issue against the bundle. To add/replace a voice, edit `VOICES` in the
  script and re-run with `ELEVENLABS_VOICE_API_KEY` (pull it from
  `bunx convex env get`).
