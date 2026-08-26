import type {
  PlusOfferMoment,
  PlusOfferVariant,
} from "@/src/features/purchases/plus-offer-policy";

/**
 * Copy for the five proactive Plus moments (#221 §4).
 *
 * Zone is a property of the moment, not of the call site: `raw` moments carry
 * no humor and no fire imagery — there the campfire shows up as specificity,
 * a true line about the user's own week, which is what keeps the metaphor
 * reading as deliberate rather than sprayed.
 *
 * No price, no term, no trial, no number lives here (#221 rule 6) — the moment
 * sells one capability, the paywall screen owns the rest.
 */
export type OfferZone = "raw" | "warm";

export type PlusOfferCopy = {
  zone: OfferZone;
  /** Static opener. Distinct from the observation line, which is data-derived. */
  lead?: string;
  /** The one capability this moment earned. One sentence. */
  value: string;
  cta: string;
};

/** A decline is an answer, not a deferral — the label has to mean what the system does. */
export const PLUS_OFFER_DECLINE_LABEL = "I'm good";

const MOMENTS: Record<PlusOfferMoment, PlusOfferCopy> = {
  1: {
    zone: "raw",
    lead: "That's one night kept.",
    value:
      "Xolace+ is where the thing that keeps coming back shows up early — the third time, not the thirtieth.",
    cta: "See what carries over",
  },
  2: {
    zone: "raw",
    lead: "Glad that one landed.",
    value:
      "Plus keeps the ones that land — so when the same thing comes back, you'll know it's the same thing.",
    cta: "See what comes back",
  },
  3: {
    zone: "warm",
    value:
      "That's the kind of thing that's invisible from the inside. Plus is what keeps it visible — the third time, not the thirtieth.",
    cta: "See the whole run",
  },
  4: {
    zone: "raw",
    value:
      "Nothing you said here got lost. Plus is what makes the time in between legible instead of a blank — so coming back doesn't mean starting over.",
    cta: "See what carried over",
  },
  5: {
    zone: "warm",
    value:
      "Most people never say any of it once. Plus is the part where all that showing up starts compounding instead of just accumulating.",
    cta: "See what it adds up to",
  },
};

/**
 * Swaps the value line on whichever moment fires next. Never adds a moment.
 *
 * The moment's `lead` deliberately survives the swap (#221 §4): it acknowledges
 * what actually just happened and is still true for this user — only the pitch
 * underneath it changes. Dropping it would leave the register variant opening
 * cold on a sell.
 */
const REGISTER = {
  value: "Plus is where you pick how it says things back — and it stays that way.",
  cta: "Pick how it sounds",
};

export function plusOfferCopy(
  moment: PlusOfferMoment,
  variant: PlusOfferVariant = "default",
): PlusOfferCopy {
  const copy = MOMENTS[moment];
  return variant === "register" ? { ...copy, ...REGISTER } : copy;
}
