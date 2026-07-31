import { useEffect, useRef } from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";
import { BridgeCard } from "@/src/features/session-end/components/bridge-card";
import { SuggestionCard } from "@/src/features/session-end/components/suggestion-card";
import { chooseCloseOffer } from "@/src/features/session-end/close-offer-rule";
import { playSoftPress } from "@/src/lib/haptics";
import { useAppStore } from "@/src/store/store";

type Props = {
  sessionId?: Id<"sessions">;
  mirrorText: string | null;
  onBridge: () => void;
  /** Structural only — which session-end variant showed the offer. */
  variant: "exit" | "activity";
};

/**
 * The one offer the close phase makes, shared by both session-end variants.
 *
 * Never both cards. A suggestion and the Bridge card together would offer two
 * different humans in one breath — someone in the user's life and a stranger —
 * at the moment they have least capacity to weigh it. The suggestion wins when
 * it fires because it is the rarer offer: it has already survived a mapped
 * theme, an intensity floor, a safeguard gate, a live-conversation check and a
 * weekly cooldown. The Bridge card holds the slot otherwise. ("Bridge wins
 * ties" would mean the suggestion never appears — its gate passes on nearly
 * every session.)
 */
export const CloseOffer = ({
  sessionId,
  mirrorText,
  onBridge,
  variant,
}: Props) => {
  const router = useRouter();
  const posthog = usePostHog();
  const bridgeEnabled = useAppStore((s) => s.bridgeEnabled);
  const setBridgeIntroSeen = useAppStore((s) => s.setBridgeIntroSeen);
  const suggestion = useQuery(
    api.xolacerChat.sessionSuggestion,
    sessionId ? { sessionId } : "skip",
  );
  const shownRef = useRef(false);

  useEffect(() => {
    if (!suggestion || shownRef.current) return;
    shownRef.current = true;
    // Structural only: no specialty, no session content — a user's themes must
    // not be reconstructable from the analytics store.
    posthog.capture("xolacer_suggestion_shown", { variant });
  }, [suggestion, posthog, variant]);

  const offer = chooseCloseOffer({
    hasSession: sessionId !== undefined,
    suggestion,
    bridgeEnabled,
    hasMirrorText: mirrorText != null,
  });

  if (offer === "pending" || offer === "none") return null;

  if (offer === "suggestion" && suggestion) {
    return (
      <SuggestionCard
        displayName={suggestion.displayName}
        photoUrl={suggestion.photoUrl}
        specialty={suggestion.specialty}
        rating={suggestion.rating}
        ratingCount={suggestion.ratingCount}
        onPress={() => {
          playSoftPress();
          posthog.capture("xolacer_suggestion_opened", { variant });
          router.push({
            pathname: "/xolacer/[profileId]",
            // The specialty rides along so the profile's escape hatch lands on
            // a roster filtered to the same thing, not on everyone.
            params: {
              profileId: suggestion.xolacerProfileId,
              specialty: suggestion.specialty,
            },
          });
        }}
      />
    );
  }

  return (
    <>
      <BridgeCard onPress={onBridge} />
      {__DEV__ && (
        <Pressable
          onPress={() => setBridgeIntroSeen(false)}
          accessibilityLabel="Reset bridge intro"
          hitSlop={8}
          className="px-3 py-1"
        >
          <AppText className="text-xs text-foreground/25">
            ↺ bridge intro
          </AppText>
        </Pressable>
      )}
    </>
  );
};
