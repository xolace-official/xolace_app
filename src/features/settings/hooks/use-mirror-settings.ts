import { useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import { usePreferenceMutation } from "./use-preference-mutation";

export type MirrorTone = "adaptive" | "poetic" | "gentle" | "direct" | "witnessed";

export const useMirrorSettings = () => {
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = usePreferenceMutation();
  const posthog = usePostHog();

  const mirrorTone: MirrorTone = preferences?.mirrorTone ?? "adaptive";
  const mirrorToneDisplay = mirrorTone.charAt(0).toUpperCase() + mirrorTone.slice(1);

  const setMirrorTone = (tone: MirrorTone) => {
    posthog.capture("tone_changed", { tone });
    updatePreferences({ mirrorTone: tone });
  };

  return { mirrorTone, mirrorToneDisplay, setMirrorTone };
};
