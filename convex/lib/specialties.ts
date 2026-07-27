import { v } from "convex/values";

/**
 * What a listener is here for — a fixed, self-declared taxonomy, never free
 * text. Free text would let a volunteer advertise "depression" or "trauma" on
 * a profile the app can't stand behind, and it makes the roster's filter chips
 * impossible.
 *
 * The list deliberately stops short of clinical territory: no depression, no
 * trauma, no addiction. Advertising a peer volunteer as a specialist in those
 * invites exactly the conversations the escalation exclusion exists to keep
 * out.
 *
 * `label` is the compact chip (roster rows, profile); `pickerLabel` is the
 * fuller phrasing used in the setup list, where there's room to be specific.
 * Shared by the Convex validator and the app so the picker, the chips and the
 * filter can never drift apart.
 */
export const SPECIALTIES = [
  { slug: "anxiety", label: "Anxiety", pickerLabel: "Anxiety & overthinking" },
  { slug: "sleep", label: "Sleep", pickerLabel: "Sleep & exhaustion" },
  { slug: "loneliness", label: "Loneliness", pickerLabel: "Loneliness" },
  { slug: "grief", label: "Grief", pickerLabel: "Grief & loss" },
  { slug: "burnout", label: "Burnout", pickerLabel: "Burnout & work stress" },
  { slug: "relationships", label: "Relationships", pickerLabel: "Relationships" },
  { slug: "family", label: "Family", pickerLabel: "Family" },
  { slug: "identity", label: "Identity", pickerLabel: "Identity & belonging" },
  { slug: "change", label: "Big changes", pickerLabel: "Big life changes" },
] as const;

export type Specialty = (typeof SPECIALTIES)[number]["slug"];

/** Hard cap. Past three, a profile stops saying anything specific at all. */
export const MAX_SPECIALTIES = 3;

export const specialtyValidator = v.union(
  ...SPECIALTIES.map((specialty) => v.literal(specialty.slug)),
);

export function specialtyLabel(slug: string): string {
  return SPECIALTIES.find((specialty) => specialty.slug === slug)?.label ?? slug;
}
