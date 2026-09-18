---
status: accepted
---

# The Xolace channel is a Stream channel, not a Convex-native feed

A single channel every user is a member of, carrying founder-written updates
and events, with per-message reactions and no other member-to-member
sending — see "The Xolace channel" in `CONTEXT.md`.

The alternative considered was a Convex-native feed: a `system_posts` table
plus a `reaction` field, the same shape as `daily_quotes.reaction`. That
shape is genuinely simpler and avoids Stream's per-member unread/read-receipt
machinery entirely. It was the first recommendation here, on the grounds
that this isn't a "conversation" in this codebase's sense (no pairing, no
lifecycle) and that Stream's `total_unread_count` is a documented fragile
single number (`CONTEXT.md`, "One unread number") that already caused two
stale-badge bugs.

That reasoning doesn't survive the actual requirement. The feature isn't a
feed with reactions bolted on — it's meant to look and behave exactly like a
xolacer conversation thread: same message list, same reaction picker, same
place in the chats list, counted the same way in the same badge. Rebuilding
that UI and unread-aggregation logic in parallel for one channel, on top of
what Stream already provides for every other conversation, would be more
code and a second, divergent read-state mechanism to keep in sync with the
first — the opposite of what made the Convex-native option attractive.
`total_unread_count`'s fragility is about the *number's single-ownership
invariant* (don't introduce a second counter), not about which channels may
contribute to it; one more ordinary channel is exactly the case that
invariant is built to handle.

**Consequences.** This channel needs its own Stream channel type (not
`messaging`) with `read_events: false` and `typing_events: false` — a
member-list the size of the whole user base makes per-member read/typing
fan-out a real cost that 1:1 channels never hit — and `create-message`
permission restricted to the one Xolace account's user id. It also means the
Connect list, otherwise strictly Convex-owned per "Conversation, channel,
thread," gets one synthetic row for this channel, sourced from a small
denormalized cache kept current by the existing `message.new` webhook. That
webhook must now branch on this one known channel id before its normal
conversation-resolution path, which is the main piece of new surface area a
future refactor of that webhook needs to know about.

Membership is granted server-side in `users.getOrCreate` (add-to-channel, not
"create Stream user then add") and backfilled once for existing users, so
"every user is a member" holds without depending on a user ever opening
chat first.
