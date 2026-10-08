// PROTOTYPE (#491) — throwaway fixtures for the insights screen variants.
// Shapes follow the Compounding Layer map (#484) decisions, not a real API.
import type { ComponentProps } from "react";
import type { SymbolView } from "expo-symbols";

export type Icon = Exclude<ComponentProps<typeof SymbolView>["name"], string>;

/** warming → unlocked (≥3 days) → settled (baseline + compounding live). */
export type Stage = "warming" | "unlocked" | "settled";
export type Compounding = "none" | "compounding" | "easing";

export type Domain = {
  key: string;
  label: string;
  icon: Icon;
  stage: Stage;
  score: number | null; // null while warming
  baseline: number | null; // settled only
  weekDelta: number | null;
  compounding: Compounding;
  lastSeen?: string; // set when quiet (>30 days without a reading)
  insight?: string; // Reflection Agent line, Xolace+
};

export type Tier = "plus" | "free";
export type Scenario = "rich" | "early";

const I = (ios: string, android: string): Icon =>
  ({ ios, android, web: android }) as Icon;

const RICH: Domain[] = [
  {
    key: "work", label: "Work & Studies", icon: I("briefcase.fill", "work"),
    stage: "settled", score: 41, baseline: 62, weekDelta: -9, compounding: "compounding",
    insight:
      "Work started getting heavier nine days ago, and Health & Rest followed three days later. Last spring the same run eased once you took the Friday off.",
  },
  {
    key: "health", label: "Health & Rest", icon: I("bed.double.fill", "bedtime"),
    stage: "settled", score: 52, baseline: 60, weekDelta: 6, compounding: "easing",
    insight: "Sleep came up less this week. It's lifting, still under your usual.",
  },
  { key: "self", label: "Self", icon: I("person.fill", "person"), stage: "settled", score: 64, baseline: 66, weekDelta: -2, compounding: "none" },
  { key: "purpose", label: "Purpose & Future", icon: I("sparkles", "auto_awesome"), stage: "settled", score: 58, baseline: 55, weekDelta: 4, compounding: "none" },
  { key: "love", label: "Love & Friendship", icon: I("heart.fill", "favorite"), stage: "unlocked", score: 72, baseline: null, weekDelta: 0, compounding: "none" },
  { key: "belonging", label: "Belonging", icon: I("person.3.fill", "groups"), stage: "settled", score: 66, baseline: 63, weekDelta: null, compounding: "none", lastSeen: "Aug 30" },
  { key: "family", label: "Family", icon: I("figure.2.and.child.holdinghands", "family_restroom"), stage: "warming", score: null, baseline: null, weekDelta: null, compounding: "none" },
  { key: "money", label: "Money & Home", icon: I("house.fill", "home"), stage: "warming", score: null, baseline: null, weekDelta: null, compounding: "none" },
];

const EARLY: Domain[] = [
  { key: "work", label: "Work & Studies", icon: I("briefcase.fill", "work"), stage: "unlocked", score: 55, baseline: null, weekDelta: null, compounding: "none" },
  { key: "self", label: "Self", icon: I("person.fill", "person"), stage: "warming", score: null, baseline: null, weekDelta: null, compounding: "none" },
];

export function domainsFor(scenario: Scenario): Domain[] {
  return scenario === "rich" ? RICH : EARLY;
}

/** Overall = equal-weight mean of shown domains; needs ≥2 unlocked. */
export function overallFor(domains: Domain[]) {
  const scored = domains.filter((d) => d.score !== null);
  if (scored.length < 2) return null;
  const score = Math.round(scored.reduce((s, d) => s + (d.score ?? 0), 0) / scored.length);
  // ponytail: fixed mock — real overall baseline/delta come from score history (fog on #484).
  return { score, baseline: 63, weekDelta: -3 };
}

/** The word under a number — relative to the person's own baseline, never a grade. */
export function stateWord(d: Pick<Domain, "stage" | "compounding" | "score" | "baseline">) {
  if (d.stage === "warming") return "Warming up";
  if (d.compounding === "compounding") return "Heavier than usual";
  if (d.compounding === "easing") return "Easing";
  if (d.stage === "unlocked" || d.baseline === null || d.score === null) return "Getting to know it";
  if (d.score - d.baseline >= 8) return "Steadier than usual";
  return "Steady";
}

export const CAVEAT =
  "This is what Xolace knows from how you've used Xolace. It may not reflect your whole life.";

/** Free sees domain stages, never numbers or compounding (#496). */
export function freeWord(d: Pick<Domain, "stage">) {
  return d.stage === "warming" ? "Warming up" : d.stage === "unlocked" ? "Getting to know it" : "Known well";
}

/** Most pressing first: compounding, easing, then the rest; warming last. */
export function ranked(domains: Domain[]) {
  const w = (d: Domain) =>
    d.stage === "warming" ? 4 : d.compounding === "compounding" ? 0 : d.compounding === "easing" ? 1 : d.lastSeen ? 3 : 2;
  return [...domains].sort((a, b) => w(a) - w(b));
}
