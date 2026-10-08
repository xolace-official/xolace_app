import type { ComponentProps } from "react";
import type { SymbolView } from "expo-symbols";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type Icon = Exclude<ComponentProps<typeof SymbolView>["name"], string>;
type FreeView = FunctionReturnType<typeof api.compounding.insights.freeView>;
type PlusView = NonNullable<FunctionReturnType<typeof api.compounding.insights.plusView>>;
/** Free or Xolace+: the Xolace+ fields are simply absent from the free view. */
export type InsightsView = FreeView & Partial<Pick<PlusView, "overallTrend">>;
export type DomainItem = FreeView["domains"][number] &
  Partial<Pick<PlusView["domains"][number], "steadiness" | "baseline" | "trend">>;

export const icon = (ios: string, android: string) => ({ ios, android, web: android }) as Icon;
export const GAUGE = icon("gauge.with.needle", "speed");

export const DOMAIN_META: Record<DomainItem["domain"], { label: string; icon: Icon }> = {
  self: { label: "Self", icon: icon("person.fill", "person") },
  purpose: { label: "Purpose & Future", icon: icon("sparkles", "auto_awesome") },
  work: { label: "Work & Studies", icon: icon("briefcase.fill", "work") },
  love: { label: "Love & Friendship", icon: icon("heart.fill", "favorite") },
  family: { label: "Family", icon: icon("figure.2.and.child.holdinghands", "family_restroom") },
  belonging: { label: "Belonging", icon: icon("person.3.fill", "groups") },
  health: { label: "Health & Rest", icon: icon("bed.double.fill", "bedtime") },
  money: { label: "Money & Home", icon: icon("house.fill", "home") },
};

/** The free view's word for a domain's state — how well Xolace knows it, never a grade. */
export const STAGE_WORD: Record<DomainItem["state"], string> = {
  warming: "Warming up",
  unlocked: "Getting to know it",
  settled: "Known well",
};

export const lastSeen = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const CAVEAT =
  "This is what Xolace knows from how you've used Xolace. It may not reflect your whole life.";
