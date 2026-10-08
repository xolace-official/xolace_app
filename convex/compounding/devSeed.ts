/**
 * Dev-only: seed a fresh profile with a fixed scenario that exercises every
 * rule of the steadiness engine (#515), dated relative to now. Repeatable:
 *
 *   bunx convex run users:getOrCreate '{"authProvider":"google"}' \
 *     --identity '{"subject":"seed-steadiness","issuer":"<CLERK_JWT_ISSUER_DOMAIN>"}'
 *   bunx convex run compounding/devSeed:seedScenario '{"profileId":"…"}'
 *   bunx convex run compounding/dev:steadiness '{"profileId":"…"}'
 *
 * Expected: work settled (burned, crisis and gave_up sessions counted, studies
 * + work once, a follow-up answered today), self unlocked at 75 (joy at
 * intensity 9, valence guard), family warming (abuse ignored, 2 days),
 * purpose warming (legacy "direction"), no reading from texture-only,
 * untagged or off-list sessions, overall = mean(work, self).
 */
import type { WorkflowId } from "@convex-dev/workflow";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { assertDevToolsEnabled } from "../devTools";
import { evaluateCompounding } from "./stretches";

const DAY = 86_400_000;

type Seed = {
  daysAgo: number;
  intensity: number;
  tags: string[];
  emotion?: string;
  session?: Partial<Doc<"sessions">>;
  followUp?: { response: "processed"; answeredDaysAgo: number };
};

const SCENARIO: Seed[] = [
  { daysAgo: 30, intensity: 4, tags: ["work"] },
  { daysAgo: 20, intensity: 5, tags: ["burnout", "conflict"], session: { confirmationState: "gave_up" } },
  { daysAgo: 10, intensity: 6, tags: ["studies", "work"], session: { kept: false } },
  {
    daysAgo: 3,
    intensity: 8,
    tags: ["work"],
    session: { safeguardLevel: "crisis", escalationTriggered: true },
    followUp: { response: "processed", answeredDaysAgo: 0 },
  },
  { daysAgo: 1, intensity: 8, tags: ["work"], session: { postSessionMood: "heavier" } },
  { daysAgo: 6, intensity: 9, tags: ["self-worth"], emotion: "joy" },
  { daysAgo: 4, intensity: 9, tags: ["identity"], emotion: "pride" },
  { daysAgo: 0, intensity: 9, tags: ["self-worth", "loss"], emotion: "joy" },
  { daysAgo: 7, intensity: 7, tags: ["abuse", "family"] },
  { daysAgo: 2, intensity: 5, tags: ["parenting"] },
  { daysAgo: 3, intensity: 6, tags: ["direction"] },
  { daysAgo: 0, intensity: 9, tags: ["loss", "change"] },
  { daysAgo: 0, intensity: 9, tags: [] },
  { daysAgo: 0, intensity: 9, tags: ["trust"] },
];

export const seedScenario = internalMutation({
  args: { profileId: v.id("emotional_profiles") },
  returns: v.number(),
  handler: async (ctx, { profileId }) => {
    assertDevToolsEnabled();
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) => q.eq("emotionalProfileId", profileId))
      .first();
    if (existing) throw new Error("seedScenario needs a profile with no sessions");

    const now = Date.now();
    for (const s of SCENARIO) {
      const at = now - s.daysAgo * DAY;
      const sessionId = await ctx.db.insert("sessions", {
        emotionalProfileId: profileId,
        state: "completed",
        entryType: "open_prompt",
        confirmationState: "confirmed",
        kept: true,
        createdAt: at,
        updatedAt: at,
        ...s.session,
      });
      await ctx.db.insert("emotional_metadata", {
        sessionId,
        emotionalProfileId: profileId,
        classifierVersion: "seed-steadiness",
        primaryEmotion: s.emotion ?? "anxiety",
        primaryEmotionConfidence: 0.9,
        intensity: s.intensity,
        specificity: 5,
        thematicTags: s.tags,
        userLanguageTags: [],
        riskFlag: false,
        createdAt: at,
      });
      if (s.followUp) {
        await ctx.db.insert("follow_up_cards", {
          emotionalProfileId: profileId,
          sessionId,
          workflowId: "seed-steadiness" as WorkflowId,
          tier: "standard",
          cardText: "How's it sitting now?",
          escalationDerived: false,
          status: "resolved",
          userResponse: s.followUp.response,
          createdAt: at,
          resolvedAt: now - s.followUp.answeredDaysAgo * DAY,
        });
      }
    }
    return SCENARIO.length;
  },
});

/**
 * Dev-only (#520): a compounding Work on any profile, for the insights screen.
 * A settled usual every other day, a heavy last week, then tonight's session
 * opens the stretch through the real evaluation, and lights an active kindling
 * (one breathing twig) so the detail card's hand-off shows. Tagged
 * `seed-compounding`; run with PREMIUM_DEV_OVERRIDE=true to see it. Adds
 * 58 sessions to the profile and replaces its active kindling: use a test
 * profile, not one whose data you want kept.
 *
 *   bunx convex run compounding/devSeed:seedCompounding '{"profileId":"…"}'
 */
export const seedCompounding = internalMutation({
  args: { profileId: v.id("emotional_profiles") },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    assertDevToolsEnabled();
    const now = Date.now();
    const days = [
      ...Array.from({ length: 50 }, (_, i) => ({ daysAgo: 120 - i * 2, intensity: 4 })),
      ...Array.from({ length: 7 }, (_, i) => ({ daysAgo: 1.5 + i, intensity: 10 })),
      { daysAgo: 0.05, intensity: 10 },
    ];
    let sessionId: Id<"sessions"> | undefined;
    for (const { daysAgo, intensity } of days) {
      const at = now - daysAgo * DAY;
      sessionId = await ctx.db.insert("sessions", {
        emotionalProfileId: profileId,
        state: "completed",
        entryType: "open_prompt",
        confirmationState: "confirmed",
        kept: true,
        createdAt: at,
        updatedAt: at,
      });
      await ctx.db.insert("emotional_metadata", {
        sessionId,
        emotionalProfileId: profileId,
        classifierVersion: "seed-compounding",
        primaryEmotion: "anxiety",
        primaryEmotionConfidence: 0.9,
        intensity,
        specificity: 5,
        thematicTags: ["work"],
        userLanguageTags: [],
        riskFlag: false,
        createdAt: at,
      });
    }
    await evaluateCompounding(ctx, profileId, { sessionId });

    for (const old of await ctx.db
      .query("paths")
      .withIndex("by_profile_and_status", (q) => q.eq("emotionalProfileId", profileId).eq("status", "active"))
      .take(10)) {
      await ctx.db.patch("paths", old._id, { status: "replaced" });
    }
    const pathId = await ctx.db.insert("paths", {
      emotionalProfileId: profileId,
      sessionId: sessionId!, // days is never empty
      status: "active",
      model: "seed-compounding",
      modelVersion: "seed-compounding",
      generatedAt: now,
    });
    await ctx.db.insert("path_steps", {
      pathId,
      actionType: "breathing",
      order: 1,
      why: "A minute to let the day settle.",
      params: null,
      state: "pending",
    });
    return null;
  },
});
