// PROTOTYPE — throwaway. Draft copy for the full-screen founder message.
//
// Model (per #236 founder note): there is ONE founder message, shown to everyone.
// Returning users (emotional_profiles.sessionCount > 0) see the same message PLUS
// a visually distinct highlighted callout acknowledging they've been here — not a
// separate shorter screen. Copy is a placeholder to react to; the founder owns
// the final words.

export type Segment = { text: string; highlight?: true };
export type AudienceKey = "new" | "existing";

/** The heart of the message — identical for everyone. */
export const FOUNDER_MESSAGE = {
  greeting: "hey friend, I’m Nathaniel — Xolace’s CEO.",
  paragraphs: [
    [
      {
        text: "We built Xolace for the feeling most of us never say out loud: that heavy, unnamed thing in your chest that isn’t bad enough for therapy but won’t leave you alone. This is the space we wished existed.",
      },
    ],
    [
      { text: "When you open it, just write what’s actually going on — raw, unfiltered, even if it makes no sense yet. " },
      { text: "The more honest, the clearer it gets.", highlight: true },
    ],
    [
      { text: "We know what it takes to trust something new with feelings you’ve spent years brushing past. " },
      { text: "Earning that trust is the whole job.", highlight: true },
    ],
  ] as Segment[][],
  /** The line that hands off to the questionnaire — shared. */
  transition:
    "In a minute we’ll ask you a few short questions, so Xolace can meet you where you actually are.",
  closing: "with care,",
  signature: "Nathaniel & the Xolace team ♡",
  cta: { new: "I’m ready", existing: "let’s do it" } as Record<AudienceKey, string>,
};

/**
 * Returning-user callout — rendered as a highlighted block between the message
 * and the transition line, only when sessionCount > 0.
 */
export const RETURNING_CALLOUT: Segment[] = [
  { text: "You’ve been here a while, and that already means a lot — nothing you’ve done needs redoing. " },
  { text: "What’s changed is us: our sense of how far Xolace can go to help has grown, and these questions let it catch up to you.", highlight: true },
];
