import { Alert } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { VariantACampfireStack } from "@/src/features/founder-welcome/prototype/variant-a-campfire-stack";
import { PrototypeSwitcher } from "@/src/features/founder-welcome/prototype/prototype-switcher";
import type { AudienceKey } from "@/src/features/founder-welcome/prototype/letter-copy";

/**
 * PROTOTYPE — throwaway. Wayfinder ticket T5 (#236): the full-screen,
 * form-sheet-style founder message.
 *
 * Chosen direction: "Campfire Stack" (marquee band on top, letter scrolls under,
 * pinned CTA). `?user=new|existing` toggles the two copy variants T3 keys on
 * `emotional_profiles.sessionCount > 0`. Reachable in dev at
 * `/founder-message-prototype`. Fold into a real `(intake)` screen; bin this.
 */

const SCREEN_OPTIONS = { headerShown: false, gestureEnabled: false } as const;

export default function FounderMessagePrototype() {
  const params = useLocalSearchParams<{ user?: string }>();
  const audience: AudienceKey = params.user === "existing" ? "existing" : "new";

  const onAdvance = () => Alert.alert("→ questionnaire", `advance · ${audience} user`);

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <StatusBar style="light" />
      <VariantACampfireStack audience={audience} onAdvance={onAdvance} />
      <PrototypeSwitcher
        audience={audience}
        onAudience={(user) => router.setParams({ user })}
      />
    </>
  );
}
