/**
 * Dev-only settings section for manual testing. Render it behind a
 * `__DEV__` check at the call site — it has no production guard of its
 * own (the Convex mutation it calls is gated server-side instead).
 */
import { useState } from "react";

import { useMutation } from "convex/react";
import { SymbolView } from "expo-symbols";
import { useThemeColor, useToast } from "heroui-native";

import { api } from "@/convex/_generated/api";
import { useAppStore } from "@/src/store/store";
import { ReturnWelcomeSheet } from "@/src/features/reflect/components/return-welcome-sheet";
import type { ReturnWelcomeTier } from "@/src/features/reflect/return-welcome-copy";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";
import type { CrossPlatformSymbol } from "./settings-icons";

const BUMP_ICON: CrossPlatformSymbol = {
  ios: "flame",
  android: "local_fire_department",
  web: "local_fire_department",
};
const RESET_ICON: CrossPlatformSymbol = {
  ios: "arrow.counterclockwise",
  android: "restart_alt",
  web: "restart_alt",
};
const REPLAY_ICON: CrossPlatformSymbol = {
  ios: "play.circle",
  android: "replay",
  web: "replay",
};
const AWARENESS_ICON: CrossPlatformSymbol = {
  ios: "calendar.badge.clock",
  android: "event_repeat",
  web: "event_repeat",
};
const RETURN_ICON: CrossPlatformSymbol = {
  ios: "hand.wave",
  android: "waving_hand",
  web: "waving_hand",
};
const FOLLOW_UP_ICON: CrossPlatformSymbol = {
  ios: "bell.badge",
  android: "notifications_active",
  web: "notifications_active",
};

const FOLLOW_UP_TIERS: { tier: "acute" | "elevated" | "standard"; label: string }[] = [
  { tier: "standard", label: "Seed follow-up · standard" },
  { tier: "elevated", label: "Seed follow-up · elevated" },
  { tier: "acute", label: "Seed follow-up · acute" },
];

const RETURN_WELCOME_TIERS: { tier: ReturnWelcomeTier; label: string }[] = [
  { tier: "recent", label: "Return welcome · recent" },
  { tier: "away-14-30", label: "Return welcome · 14–30d" },
  { tier: "away-30-90", label: "Return welcome · 30–90d" },
  { tier: "away-90-plus", label: "Return welcome · 90d+" },
  { tier: "anniversary", label: "Return welcome · anniversary" },
];

export const DevToolsSection = () => {
  const { toast } = useToast();
  const mutedIconColor = useThemeColor("muted") as string;
  const setLastAcknowledgedStreak = useAppStore(
    (s) => s.setLastAcknowledgedStreak,
  );
  const setPendingEventPrompt = useAppStore((s) => s.setPendingEventPrompt);
  const resetAwarenessEvents = () => {
    useAppStore.setState({ seenEventIds: [] });
    setPendingEventPrompt(null);
    toast.show({ label: "Awareness events reset", description: "Reopen home to see the card." });
  };
  const setStreak = useMutation(api.devTools.setStreak);
  const seedFollowUpCard = useMutation(api.devTools.seedFollowUpCard);
  const [busy, setBusy] = useState(false);

  const seedFollowUp = (tier: "acute" | "elevated" | "standard") => {
    if (busy) return;
    setBusy(true);
    seedFollowUpCard({ tier })
      .then(() => {
        toast.show({
          label: `Follow-up card seeded · ${tier}`,
          description: "Go back to the reflect home to see the check-in.",
        });
      })
      .catch((e) => {
        toast.show({
          variant: "danger",
          label: "Seed failed",
          description:
            e instanceof Error ? e.message : "Is DEV_TOOLS_ENABLED set?",
        });
      })
      .finally(() => setBusy(false));
  };
  const [previewTier, setPreviewTier] = useState<ReturnWelcomeTier | null>(null);

  const icon = (name: CrossPlatformSymbol) => (
    <SymbolView name={name} size={17} tintColor={mutedIconColor} />
  );

  const runStreak = (mode: "bump" | "reset") => {
    if (busy) return;
    setBusy(true);
    setStreak({ mode })
      .then((newStreak) => {
        // Make the reveal pending: acknowledged = the day before
        setLastAcknowledgedStreak(Math.max(newStreak - 1, 0));
        toast.show({
          label: `Streak set to day ${newStreak}`,
          description: "Go back home to watch the reveal.",
        });
      })
      .catch(() => {
        toast.show({
          variant: "danger",
          label: "Streak update failed",
          description: "Is DEV_TOOLS_ENABLED set on this deployment?",
        });
      })
      .finally(() => setBusy(false));
  };

  const replayReveal = () => {
    setLastAcknowledgedStreak(0);
    toast.show({
      label: "Reveal re-armed",
      description: "Go back home to watch it again.",
    });
  };

  return (
    <SettingsSection title="Dev tools">
      <SettingsRow
        variant="action"
        icon={icon(BUMP_ICON)}
        label="Bump streak +1"
        onPress={() => runStreak("bump")}
      />
      <SettingsRow
        variant="action"
        icon={icon(RESET_ICON)}
        label="Reset streak to day 1"
        onPress={() => runStreak("reset")}
      />
      <SettingsRow
        variant="action"
        icon={icon(REPLAY_ICON)}
        label="Replay streak reveal"
        onPress={replayReveal}
      />
      <SettingsRow
        variant="action"
        icon={icon(AWARENESS_ICON)}
        label="Reset awareness events"
        onPress={resetAwarenessEvents}
      />
      {RETURN_WELCOME_TIERS.map(({ tier, label }) => (
        <SettingsRow
          key={tier}
          variant="action"
          icon={icon(RETURN_ICON)}
          label={label}
          onPress={() => setPreviewTier(tier)}
        />
      ))}
      {FOLLOW_UP_TIERS.map(({ tier, label }, i) => (
        <SettingsRow
          key={tier}
          variant="action"
          icon={icon(FOLLOW_UP_ICON)}
          label={label}
          onPress={() => seedFollowUp(tier)}
          isLast={i === FOLLOW_UP_TIERS.length - 1}
        />
      ))}

      <ReturnWelcomeSheet
        isOpen={previewTier !== null}
        tier={previewTier ?? "recent"}
        onClose={() => setPreviewTier(null)}
      />
    </SettingsSection>
  );
};
