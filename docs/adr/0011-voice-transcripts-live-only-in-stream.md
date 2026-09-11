# Voice-note transcripts live only in Stream message data, never in Convex

A voice note in a Xolacer conversation is transcribed once, server-side
(ElevenLabs Scribe, the STT vendor the app already uses), so the post-delivery
moderation lane can read it the same way it reads text. The transcript is
written back onto the Stream message as custom data (`transcript`) and nowhere
else. Convex keeps only the moderation **verdict** for that message in
`chat_moderation_events` — category and level, no text.

**The obvious alternative** was to store the transcript in Convex alongside the
verdict: it would make conversation search, per-Xolacer analytics, and a future
"what did people talk about" surface trivial. We are not doing that.

**Why Stream-only:**

- **Deletion is already correct.** Account deletion hard-deletes the Stream
  user (`purgeStreamUser`) and conversation delete removes the channel. A
  transcript on the message dies with the message. A Convex copy would be a
  second place to remember to purge — the privacy-first posture and the
  Conversation delete rule (CONTEXT.md) both say a DM is between two people,
  not material for the product.
- **DMs are not sessions.** The Cognition Layer's Understanding is per
  session; a conversation is one person listening to another (the Xolacer
  primer's promise). Keeping the words out of Convex makes it structurally
  impossible for a later feature to fold DM content into the seeker's model
  without a deliberate, consented change — see the companion ruling that DM
  moderation verdicts never touch Understanding.
- **Cost shape.** Transcription is a *safety* cost paid once per voice note
  regardless of plan. Showing the transcript as a caption is a *feature* and is
  Xolace+. The caption reads the same Stream field; no second pipeline.

**Consequences we accept:** no transcript search, no transcript analytics, no
transcript in the Convex-side moderation queue (the reviewer opens the message
in the Stream dashboard, where the custom field is visible). Reversing this
means backfilling from Stream, which is possible but is exactly the kind of
"quietly widen the data we hold" step the ruling exists to make loud.
