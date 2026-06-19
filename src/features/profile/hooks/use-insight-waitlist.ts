import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";

// Which blurred teaser drove the intent. Keep in sync with the `feature`
// strings recorded server-side in insight_waitlist.
export type TeaserFeature = "intensity_history" | "words_language";

/**
 * Intent-only premium teaser plumbing (pre-billing phase).
 * Tapping a teaser fires PostHog desire signals and, on confirm, records a
 * "notify me" row in Convex. No price, no IAP — purely measuring desire.
 */
export function useInsightWaitlist() {
  const posthog = usePostHog();
  const join = useMutation(api.profile.joinInsightWaitlist);
  const joinedFeatures = useQuery(api.profile.listInsightWaitlist);

  const [activeFeature, setActiveFeature] = useState<TeaserFeature | null>(null);
  const [joined, setJoined] = useState(false);

  // Stable for use in card mount effects (useEffect dep).
  const trackView = useCallback(
    (feature: TeaserFeature) => {
      posthog.capture("teaser_viewed", { feature });
    },
    [posthog],
  );

  const open = (feature: TeaserFeature) => {
    posthog.capture("teaser_tapped", { feature });
    // Already on the list? Open straight into the confirmation state.
    setJoined((joinedFeatures ?? []).includes(feature));
    setActiveFeature(feature);
  };

  const close = () => setActiveFeature(null);

  const confirm = async () => {
    if (!activeFeature) return;
    posthog.capture("waitlist_joined", { feature: activeFeature });
    await join({ feature: activeFeature });
    setJoined(true);
  };

  return {
    activeFeature,
    isOpen: activeFeature !== null,
    joined,
    trackView,
    open,
    close,
    confirm,
  };
}
