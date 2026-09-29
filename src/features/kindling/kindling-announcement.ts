import type { Infer } from "convex/values";
import type { supportNeedValidator } from "@/convex/lib/validators";

export type KindlingAnnouncement = "plus" | "free" | "none";

/**
 * Whether the post-activity kindling announcement shows, and which CTA
 * (#455). Same gate as `KindlingCloseSlot`: the session must qualify
 * (`supportNeed` light/active, docs/paths-v1.md §1). Escalation isn't
 * re-checked here — the classifier already forces `supportNeed` to "none".
 *
 * Takes `isPlus`/`isResolved` straight from `usePlusEntitlement` (whose
 * `isPlus` is false while loading): unresolved returns "none" rather than
 * "free" so a subscriber never sees the upsell flash.
 */
export function shouldOfferKindlingAnnouncement({
  supportNeed,
  isPlus,
  isResolved,
}: {
  supportNeed: Infer<typeof supportNeedValidator> | undefined;
  isPlus: boolean;
  isResolved: boolean;
}): KindlingAnnouncement {
  if (!isResolved) return "none";
  if (supportNeed !== "light" && supportNeed !== "active") return "none";
  return isPlus ? "plus" : "free";
}
