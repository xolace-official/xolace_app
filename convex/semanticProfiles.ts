import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// =============================================================
// SEMANTIC PROFILES — the AI-written narrative of who this person
// is emotionally (Cognition Layer §1.2).
//
// Append-only versions; emotional_profiles.currentSemanticProfileId
// points at the live one. Written ONLY by the Reflection Agent
// (Phase 3) through createVersion — no other write path is
// sanctioned. Read whole (never vector-searched) by the articulator
// context and, progressively, the insights UI.
// =============================================================

/** Render a profile document as prompt-ready text. Null when empty. */
export function renderSemanticProfile(
  profile: Doc<"semantic_profiles">,
): string | null {
  const sections = [
    profile.recurringThemes && `Recurring themes: ${profile.recurringThemes}`,
    profile.emotionalSignatures &&
      `Emotional signatures: ${profile.emotionalSignatures}`,
    profile.calibration && `What lands: ${profile.calibration}`,
    profile.trajectory && `Recent trajectory: ${profile.trajectory}`,
  ].filter((s): s is string => !!s);
  return sections.length > 0 ? sections.join("\n") : null;
}

/** The current semantic profile version for a user, or null. */
export const getCurrent = internalQuery({
  args: { emotionalProfileId: v.id("emotional_profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.emotionalProfileId);
    if (!profile?.currentSemanticProfileId) return null;
    return await ctx.db.get(profile.currentSemanticProfileId);
  },
});

/**
 * Append a new profile version and move the pointer. The sole
 * sanctioned write path — the Reflection Agent's passes call this.
 * Sections not provided are carried forward from the current version
 * so a light pass can update trajectory without erasing the rest.
 */
export const createVersion = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    recurringThemes: v.optional(v.string()),
    emotionalSignatures: v.optional(v.string()),
    calibration: v.optional(v.string()),
    trajectory: v.optional(v.string()),
    writerVersion: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"semantic_profiles">> => {
    const profile = await ctx.db.get(args.emotionalProfileId);
    if (!profile) throw new Error("Profile not found");

    const current = profile.currentSemanticProfileId
      ? await ctx.db.get(profile.currentSemanticProfileId)
      : null;

    const newId = await ctx.db.insert("semantic_profiles", {
      emotionalProfileId: args.emotionalProfileId,
      version: (current?.version ?? 0) + 1,
      recurringThemes: args.recurringThemes ?? current?.recurringThemes,
      emotionalSignatures:
        args.emotionalSignatures ?? current?.emotionalSignatures,
      calibration: args.calibration ?? current?.calibration,
      trajectory: args.trajectory ?? current?.trajectory,
      writerVersion: args.writerVersion,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.emotionalProfileId, {
      currentSemanticProfileId: newId,
      updatedAt: Date.now(),
    });

    return newId;
  },
});

/**
 * Roll the pointer back to an earlier version (a bad agent pass
 * corrupts every subsequent mirror — this is the one-step revert).
 * The bad version row is kept for auditability, not deleted.
 */
export const revertToVersion = internalMutation({
  args: {
    emotionalProfileId: v.id("emotional_profiles"),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db
      .query("semantic_profiles")
      .withIndex("by_profile_version", (q) =>
        q
          .eq("emotionalProfileId", args.emotionalProfileId)
          .eq("version", args.version),
      )
      .unique();
    if (!target) throw new Error("Version not found");

    await ctx.db.patch(args.emotionalProfileId, {
      currentSemanticProfileId: target._id,
      updatedAt: Date.now(),
    });
    return null;
  },
});
