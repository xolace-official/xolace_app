/**
 * The steadiness-insight quality gate (#525, ADR 0019). Failure modes: an
 * insight shown that cites under two sessions, a burned or someone else's
 * session, or sessions that never touched its domain; one a template could
 * write (restating the score, "came up in 6 of 10 sessions"); generic comfort
 * ("be gentle with yourself"); a sensitive life area or clinical label; one
 * contradicting the score's direction; a "then vs now" with no real span, a
 * "what helped" citing nothing that ended lighter, a link whose onset order
 * its own sessions contradict, a "shape" seen only twice.
 */
import { describe, expect, it } from "vitest";
import { gateInsight, type CitableSession, type InsightDraft } from "./insightGate";

const DAY = 86_400_000;
const T = Date.UTC(2026, 9, 1);

const s = (id: string, daysAgo: number, domains: CitableSession["domains"], lighter = false): CitableSession => ({
  id, at: T - daysAgo * DAY, domains, lighter,
});

const sessions = new Map(
  [
    s("a", 40, ["health"]),
    s("b", 37, ["work", "health"]),
    s("c", 12, ["health"]),
    s("d", 9, ["work", "health"], true),
    s("e", 2, ["work"]),
    s("f", 1, ["money"]),
  ].map((x) => [x.id, x]),
);
const domains = new Map([
  ["work", { steadiness: 48, baseline: 66 }],
  ["health", { steadiness: 55, baseline: 61 }],
  ["money", { steadiness: 72, baseline: 64 }],
] as const);

const evidence = { sessions, domains };

const draft = (over: Partial<InsightDraft> = {}): InsightDraft => ({
  kind: "link",
  domains: ["health", "work"],
  text: "Both times work got heavy, your sleep slipped first: short nights in late August, then the deadline dread a few days after.",
  citedSessionIds: ["a", "b", "d"],
  direction: "lower",
  ...over,
});

const reason = (d: InsightDraft) => {
  const r = gateInsight(d, evidence);
  return r.ok ? null : r.reason;
};

describe("gateInsight", () => {
  it("passes a grounded, specific link", () => {
    expect(gateInsight(draft(), evidence)).toEqual({ ok: true });
  });

  it("needs two distinct cited sessions", () => {
    expect(reason(draft({ citedSessionIds: ["b", "b"] }))).toMatch(/two/);
  });

  it("refuses a session that isn't citable (burned, missing, someone else's)", () => {
    expect(reason(draft({ citedSessionIds: ["a", "b", "zzz"] }))).toMatch(/can't be cited/);
  });

  it("refuses a cited session that touched none of its domains", () => {
    expect(reason(draft({ citedSessionIds: ["a", "b", "f"] }))).toMatch(/touch/);
  });

  it("needs every named domain backed by a cited session", () => {
    expect(reason(draft({ citedSessionIds: ["a", "c"] }))).toMatch(/work/);
  });

  it("refuses a link whose onset order its sessions contradict", () => {
    expect(reason(draft({ domains: ["work", "health"] }))).toMatch(/order/);
  });

  it("refuses a link that isn't two different domains", () => {
    expect(reason(draft({ domains: ["work"] }))).toMatch(/two domains/);
    expect(reason(draft({ kind: "helped", domains: ["work", "health"] }))).toMatch(/one domain/);
  });

  it("refuses 'what helped' when nothing cited ended lighter", () => {
    const d = draft({ kind: "helped", domains: ["work"], citedSessionIds: ["b", "e"] });
    expect(reason(d)).toMatch(/lighter/);
    expect(reason({ ...d, citedSessionIds: ["b", "d"] })).toBeNull();
  });

  it("refuses 'then vs now' without two weeks between its sessions", () => {
    const d = draft({ kind: "then_now", domains: ["work"], citedSessionIds: ["d", "e"] });
    expect(reason(d)).toMatch(/span/);
    expect(reason({ ...d, citedSessionIds: ["b", "e"] })).toBeNull();
  });

  it("refuses a 'shape' seen in under three sessions", () => {
    const d = draft({ kind: "shape", domains: ["health"], citedSessionIds: ["a", "c"] });
    expect(reason(d)).toMatch(/three/);
    expect(reason({ ...d, citedSessionIds: ["a", "c", "d"] })).toBeNull();
  });

  it("refuses a 'shape' that hasn't recurred over two weeks", () => {
    const d = draft({ kind: "shape", domains: ["work"], direction: "none", citedSessionIds: ["d", "e", "b"] });
    expect(reason(d)).toBeNull();
    const week = new Map([...sessions, ["g", s("g", 4, ["work"])]]);
    expect(gateInsight({ ...d, citedSessionIds: ["d", "e", "g"] }, { sessions: week, domains })).toMatchObject({
      reason: expect.stringMatching(/span/),
    });
  });

  it("refuses internal numbers the person never sees", () => {
    const text = "In July work was 'drowning' at intensity 8; this month it's 'stretched' at intensity 5, the same desk.";
    expect(reason(draft({ kind: "then_now", domains: ["work"], citedSessionIds: ["b", "e"], text }))).toMatch(/internal/);
  });

  it("refuses a claim against the score's direction", () => {
    expect(reason(draft({ direction: "higher" }))).toMatch(/direction/);
    expect(reason(draft({ direction: "none" }))).toBeNull();
  });

  it.each([
    "Work & Studies came up in 6 of your last 10 sessions, more than any other part of your life lately.",
    "Work & Studies has been heavier than your usual lately, sitting below where it normally is.",
    "Work is at 48 right now, under your usual of 66 — the lowest it has been in weeks for you.",
  ])("refuses what a template could write: %s", (text) => {
    expect(reason(draft({ kind: "then_now", domains: ["work"], citedSessionIds: ["b", "e"], text }))).toMatch(
      /template|score/,
    );
  });

  it.each([
    "Remember to be gentle with yourself when work and sleep both pull at you like this.",
    "It's okay to feel this way; balancing work and rest is a journey that takes real time.",
    "It seems like work has been weighing on you, and that rest might be worth prioritizing.",
  ])("refuses generic comfort: %s", (text) => {
    expect(reason(draft({ text }))).toMatch(/generic/i);
  });

  it.each([
    "Work got heavier right after the nights the addiction came back up, both times this autumn.",
    "Your sleep symptoms showed up first, before the work dread both times, which looks like a disorder.",
  ])("refuses sensitive or clinical words: %s", (text) => {
    expect(reason(draft({ text }))).toMatch(/sensitive|clinical/);
  });

  it("refuses text too short to say anything", () => {
    expect(reason(draft({ text: "Sleep goes first." }))).toMatch(/short/);
  });
});
