import { useEffect, useRef } from "react";
import { PressableFeedback } from "heroui-native";
import { useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";
import { usePlusEntitlement } from "@/src/features/purchases/use-plus-entitlement";
import { usePaywall } from "@/src/features/purchases/use-paywall";
import { playSoftPress } from "@/src/lib/haptics";

type Props = {
  sessionId?: Id<"sessions">;
};

/**
 * Session-end's two kindling slots (docs/paths-v1.md §11-§12, #337) — a
 * premium "your kindling is being set up" beat, and the one-line free-user
 * upsell in the same spot. Both are gated on the session actually qualifying
 * for kindling (`supportNeed` light/active, §1) — ADR 0009 scopes the
 * free-user upsell to "a qualifying session," not every session-end, and the
 * premium beat would otherwise promise setup that never runs. Independent of
 * `CloseOffer`'s proactive-moment picker: no cooldown, no budget.
 *
 * Renders nothing while entitlement or qualification is still resolving —
 * flashing the wrong line for a frame is worse than a beat late.
 */
export const KindlingCloseSlot = ({ sessionId }: Props) => {
  const { isPlus, isResolved } = usePlusEntitlement();
  const qualifies = useQuery(
    api.paths.isKindlingQualifyingSession,
    sessionId ? { sessionId } : "skip",
  );
  const posthog = usePostHog();
  const openPaywall = usePaywall((s) => s.open);
  const shownRef = useRef(false);

  const ready = isResolved && qualifies !== undefined;

  useEffect(() => {
    if (!ready || isPlus || !qualifies || shownRef.current) return;
    shownRef.current = true;
    posthog.capture("plus_upsell_shown", { surface: "kindling" });
  }, [ready, isPlus, qualifies, posthog]);

  if (!ready || !qualifies) return null;

  if (isPlus) {
    return (
      <AppText className="text-sm font-light text-foreground/40 text-center">
        Setting up your kindling…
      </AppText>
    );
  }

  return (
    <PressableFeedback
      onPress={() => {
        playSoftPress();
        posthog.capture("plus_upsell_tapped", { surface: "kindling" });
        openPaywall("kindling");
      }}
      accessibilityRole="button"
      accessibilityLabel="See what Xolace+ sets up"
    >
      <AppText className="text-sm font-light text-accent/70 text-center">
        Xolace+ turns a session like this into kindling for what&apos;s next.
      </AppText>
    </PressableFeedback>
  );
};
