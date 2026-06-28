import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Local state machine for the follow-up check-in sheet. The sheet snapshots the
 * card and drives open/close from this FSM instead of the live `card` query, so
 * it can stay up through the acknowledgment beat even after the live card drops
 * to null. See FollowUpCheckInSheet for the surrounding rationale.
 */
export type FollowUpState = {
  // Snapshot of the card we render. Decoupled from the live `card` prop so the
  // sheet survives the live card going null mid-ack.
  shownCard: Doc<"follow_up_cards"> | null;
  phase: "asking" | "ack";
  // Ack sub-stage: "in" fades the ack up, "out" holds then fades it down.
  ackStage: "in" | "out";
  selected: string | null;
  // Held open locally until the ack fade-out completes (or the vent escape
  // hatch), then released so the sheet closes.
  released: boolean;
};

export type FollowUpAction =
  | { type: "adoptCard"; card: Doc<"follow_up_cards"> }
  | { type: "selectChip"; key: string }
  | { type: "ackInDone" }
  | { type: "release" };

export const initFollowUpState = (
  card: Doc<"follow_up_cards"> | null,
): FollowUpState => ({
  shownCard: card,
  phase: "asking",
  ackStage: "in",
  selected: null,
  released: false,
});

export const followUpReducer = (
  state: FollowUpState,
  action: FollowUpAction,
): FollowUpState => {
  switch (action.type) {
    case "adoptCard":
      // A genuinely new card (new id) is adopted and resets all per-card state.
      return initFollowUpState(action.card);
    case "selectChip":
      // Play the ack micro-state first; the sheet releases once it finishes.
      return { ...state, selected: action.key, ackStage: "in", phase: "ack" };
    case "ackInDone":
      // Fade-in done → hold + fade out.
      return { ...state, ackStage: "out" };
    case "release":
      // Ack fade-out done, or the vent escape hatch — let the sheet close.
      return { ...state, released: true };
    default:
      return state;
  }
};
