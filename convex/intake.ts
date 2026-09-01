import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { intakeAnswerValidators } from "./lib/validators";
import { validateDisplayName } from "./lib/displayName";

/**
 * Questionnaire revision stamped onto every row written from here. A
 * capture-time stamp, NOT a re-prompt gate — bumping it never re-interrogates
 * anyone (T3, issue #234). Server-owned: the client never sends a version.
 */
export const INTAKE_VERSION = 1;

/** Max options a multi-select question accepts. A validator can't express it. */
const MAX_SELECTIONS = 3;

/**
 * Terminal mutation of the intake flow (T3, issue #234).
 *
 * Writes the `intake_responses` row, `preferences.displayName` (Q1), and
 * `emotional_profiles.onboardingComplete = true` in ONE transaction — the
 * flag is the server-side gate, so it must never be true without the answers
 * beside it, nor the reverse.
 *
 * Identity is derived server-side via `requireAuth`; no user or profile id is
 * accepted for authorization.
 *
 * Idempotent: a retry after a flaky network overwrites the existing row
 * rather than failing or duplicating.
 */
export const complete = mutation({
  args: {
    /** Q1. Written to the existing `preferences.displayName`, max 30 chars. */
    displayName: v.string(),
    ...intakeAnswerValidators,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const validated = validateDisplayName(args.displayName);
    if (!validated.ok) {
      throw new ConvexError({
        code: "invalid_display_name",
        message: validated.message,
      });
    }

    for (const [field, selections] of [
      ["weighingOn", args.weighingOn],
      ["copingStyle", args.copingStyle],
    ] as const) {
      if (selections.length > MAX_SELECTIONS) {
        throw new ConvexError({
          code: "too_many_selections",
          message: `${field} accepts at most ${MAX_SELECTIONS} options`,
        });
      }
    }

    // The series branch only fires for short-form-video arrivals. Dropping
    // stray answers keeps "absent" meaning exactly one thing: the branch
    // never ran (never "declined").
    const branched = args.acquisitionSource === "short_form_video";

    const answers = {
      emotionalProfileId: profile._id,
      intakeVersion: INTAKE_VERSION,
      completedAt: Date.now(),
      intent: args.intent,
      weighingOn: args.weighingOn,
      emotionAwareness: args.emotionAwareness,
      disclosureStyle: args.disclosureStyle,
      copingStyle: args.copingStyle,
      supportFrequency: args.supportFrequency,
      ageBracket: args.ageBracket,
      acquisitionSource: args.acquisitionSource,
      seriesSeen: branched ? args.seriesSeen : undefined,
      seriesWantInApp: branched ? args.seriesWantInApp : undefined,
    };

    const existing = await ctx.db
      .query("intake_responses")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profile._id))
      .unique();

    if (existing) {
      await ctx.db.replace("intake_responses", existing._id, answers);
    } else {
      await ctx.db.insert("intake_responses", answers);
    }

    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profile._id))
      .unique();
    if (!prefs) {
      throw new ConvexError({
        code: "preferences_not_found",
        message: "Preferences not found",
      });
    }
    await ctx.db.patch("preferences", prefs._id, {
      displayName: validated.trimmed,
    });

    await ctx.db.patch("emotional_profiles", profile._id, {
      onboardingComplete: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});
