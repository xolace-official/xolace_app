// PROTOTYPE — issue #246. Four candidate layouts for everything ABOVE the card:
// the identity strip (streak calendar, space name, event pill), the
// "A word for today" pill, and where Flux stands among them.
//
// Fake data only — the real values come from `variant`, `spaceName` and
// `pendingEventPrompt` in idle-state. Delete with the rest of this directory.
import { useState } from "react";
import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useCSSVariable } from "uniwind";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { StreakCalendar } from "@/src/features/reflect/components/streak-calendar";
import { useAppStore } from "@/src/store/store";

const DAY = 12;
const SPACE = "Nathan's corner";
const EVENT = "This month";

/** Where the variant wants Flux, relative to MorphCard's default perch. */
export type FluxOffset = { dx: number; dy: number; scale: number };

/**
 * The real streak reveal fires whenever the day count outruns what the store
 * has acknowledged — which on this throwaway route is always, and it covers
 * the whole screen with a Portal. Acknowledge the fake day once on mount so
 * the mini card is what we actually get to judge.
 */
const Streak = () => {
  const ack = useAppStore((s) => s.setLastAcknowledgedStreak);
  useState(() => {
    ack(DAY);
    return null;
  });
  return <StreakCalendar currentStreak={DAY} />;
};

const SpacePill = () => (
  <View className="rounded-full bg-accent/15 px-3 py-1">
    <AppText className="text-xs font-semibold text-accent">{SPACE}</AppText>
  </View>
);

const EventPill = () => {
  const [eventColor] = useCSSVariable(["--color-event"]);
  return (
    <View className="shrink flex-row items-center gap-1.5 rounded-full bg-event/15 px-3 py-1">
      <SymbolView
        name={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
        size={11}
        tintColor={String(eventColor)}
      />
      <AppText className="shrink text-xs font-semibold text-event" numberOfLines={1}>
        {EVENT}
      </AppText>
    </View>
  );
};

const WordPill = () => {
  const accent = useThemeColor("accent") as string;
  return (
    <PressableFeedback accessibilityLabel="Open today's reflection" hitSlop={8}>
      <View className="flex-row items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5">
        <SymbolView
          name={{ ios: "sparkles", android: "auto_awesome" }}
          size={11}
          tintColor={accent}
        />
        <AppText className="text-xs font-medium text-accent/80">
          A word for today
        </AppText>
      </View>
    </PressableFeedback>
  );
};

/** 1 — Ledger: one full-width band of chrome, then air, then the card. */
const Ledger = () => (
  <View className="flex-row items-center gap-2 px-6 pt-2">
    <Streak />
    <View className="flex-1 flex-row flex-wrap items-center gap-2">
      <SpacePill />
      <EventPill />
    </View>
    <WordPill />
  </View>
);

/** 2 — Shelf: Flux anchors the top-left; the chrome stacks on his right. */
const Shelf = () => (
  <View className="flex-row items-start gap-3 px-6 pt-2" style={{ paddingLeft: 116 }}>
    <View className="flex-1 gap-2">
      <View className="flex-row items-center gap-2">
        <Streak />
        <View className="flex-1 gap-1.5">
          <SpacePill />
          <EventPill />
        </View>
      </View>
      <View className="self-start">
        <WordPill />
      </View>
    </View>
  </View>
);

/** 3 — Margin: chrome demoted to one hairline of text. No second card. */
const Margin = () => (
  <View className="flex-row items-center justify-between px-6 pt-3">
    <AppText className="text-xs text-foreground/35">
      Day {DAY} · {SPACE} · {EVENT}
    </AppText>
    <PressableFeedback accessibilityLabel="Open today's reflection" hitSlop={8}>
      <AppText className="text-xs font-medium text-accent/70">
        A word for today ›
      </AppText>
    </PressableFeedback>
  </View>
);

/** 4 — Masthead: centered stack, mirroring the centered card below it. */
const Masthead = () => (
  <View className="items-center gap-2 px-6 pt-2">
    <AppText className="text-[11px] uppercase tracking-[2px] text-foreground/35">
      {SPACE}
    </AppText>
    <Streak />
    <View className="flex-row items-center gap-2">
      <WordPill />
      <EventPill />
    </View>
  </View>
);

export const TOP_VARIANTS = [
  {
    name: "Ledger",
    Component: Ledger,
    flux: { dx: 0, dy: 0, scale: 1 } as FluxOffset,
  },
  {
    name: "Shelf",
    Component: Shelf,
    // Flux leaves the card's shoulder and becomes the top-left anchor.
    flux: { dx: -71, dy: -94, scale: 1 } as FluxOffset,
  },
  {
    name: "Margin",
    Component: Margin,
    // Nothing competes with him, so he can be bigger and sit higher.
    flux: { dx: -8, dy: -40, scale: 1.3 } as FluxOffset,
  },
  {
    // The ask: Ledger's header with Masthead's perched Flux. He straddles the
    // card's top edge — Flux renders before the card in MorphCard, so the card
    // paints over his legs and he reads as leaning on the page to whisper at it.
    name: "Perch",
    Component: Ledger,
    flux: { dx: 0, dy: 56, scale: 0.8 } as FluxOffset,
  },
  {
    name: "Masthead",
    Component: Masthead,
    // Tucked onto the card's top-left corner so the centred stack stays clean.
    flux: { dx: -34, dy: 34, scale: 0.8 } as FluxOffset,
  },
] as const;
