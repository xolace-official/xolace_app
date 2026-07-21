import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { FollowUpResponse } from "@/src/features/reflect/follow-up-copy";

type Args = {
  /** Gate: only arm once the reflect screen is focused + context has loaded. */
  active: boolean;
  /** From getFullContext — is there any active follow-up card for this user? */
  hasPendingFollowUp: boolean;
};

type Result = {
  /** The card to render, or null. */
  card: Doc<"follow_up_cards"> | null;
  /** Whether the check-in sheet should be open. */
  isOpen: boolean;
  /**
   * True whenever a follow-up is pending/ready — used by the reflect screen to
   * suppress ReturnWelcomeSheet on this reopen (the follow-up wins precedence).
   */
  blocking: boolean;
  resolve: (response: FollowUpResponse) => void;
  dismiss: () => void;
};

/**
 * Drives the follow-up check-in sheet on app reopen.
 *
 * On activation (reflect-screen load with a pending card) it calls `markReturn`
 * exactly once — the server-side gap guard decides whether to emit the
 * `userReturned` event, so this is safe to fire on every qualifying reopen. The
 * workflow then flips the card to `ready`, which arrives reactively via
 * `getReadyCard`. When the sheet mounts, the card is marked `shown`.
 */
export function useFollowUpCheckIn({ active, hasPendingFollowUp }: Args): Result {
  const posthog = usePostHog();
  const markReturn = useMutation(api.followUps.markReturn);
  const markShown = useMutation(api.followUps.markShown);
  const resolveCard = useMutation(api.followUps.resolveCard);

  // Only subscribe to the card once there is something to surface.
  const card =
    useQuery(api.followUps.getReadyCard, active && hasPendingFollowUp ? {} : "skip") ??
    null;

  // Fire markReturn once per activation when a pending follow-up exists.
  const returnedRef = useRef(false);
  useEffect(() => {
    if (!active || !hasPendingFollowUp) {
      returnedRef.current = false;
      return;
    }
    if (returnedRef.current) return;
    returnedRef.current = true;
    void markReturn({});
  }, [active, hasPendingFollowUp, markReturn]);

  // Any card `getReadyCard` returns is one the server has decided is surfaceable
  // now (a fresh `ready` card, or a `shown` card past its re-show cooldown)
  const [openedCard, setOpenedCard] =
    useState<Doc<"follow_up_cards"> | null>(null);
  const [handledId, setHandledId] =
    useState<Id<"follow_up_cards"> | null>(null);
  if (card && card._id !== handledId && openedCard?._id !== card._id) {
    setOpenedCard(card);
  }

  // Mark the card shown once per surfaced card. For a `ready` card markShown
  // flips it to `shown`; for a re-surfaced `shown` card it re-stamps `shownAt`
  // so the next cooldown is measured from this viewing (otherwise a once-eligible
  // card would re-open on every subsequent launch forever).
  const markedRef = useRef<Id<"follow_up_cards"> | null>(null);
  useEffect(() => {
    if (card && markedRef.current !== card._id) {
      markedRef.current = card._id;
      void markShown({ cardId: card._id });
      posthog.capture('follow_up_shown', {
        tier: card.tier,
        escalation_derived: card.escalationDerived,
      });
    }
  }, [card, markShown, posthog]);

  const resolve = useCallback(
    (response: FollowUpResponse) => {
      if (!openedCard) return;
      void resolveCard({ cardId: openedCard._id, response });
      posthog.capture('follow_up_responded', {
        response,
        tier: openedCard.tier,
        escalation_derived: openedCard.escalationDerived,
      });
      setHandledId(openedCard._id);
      setOpenedCard(null);
      // For "vent" the sheet also navigates to the voice-vent screen (handled
      // in the sheet, which owns the router).
    },
    [openedCard, resolveCard, posthog],
  );

  const dismiss = useCallback(() => {
    if (!openedCard) return;
    void resolveCard({ cardId: openedCard._id, response: "dismissed" });
    posthog.capture('follow_up_dismissed', {
      tier: openedCard.tier,
      escalation_derived: openedCard.escalationDerived,
    });
    setHandledId(openedCard._id);
    setOpenedCard(null);
  }, [openedCard, resolveCard, posthog]);

  return {
    card: card ?? openedCard,
    isOpen: openedCard !== null,
    blocking: active && hasPendingFollowUp,
    resolve,
    dismiss,
  };
}
