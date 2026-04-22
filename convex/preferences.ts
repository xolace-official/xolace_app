import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { mirrorToneValidator } from "./lib/validators";

const CRISIS_BLOCKLIST = [
  "kill", "die", "suicide", "suicid", "hurt", "dead", "death",
  "harm", "selfharm", "self-harm", "cut", "bleed",
];

const VALID_NAME_RE = /^[A-Za-z0-9-]+$/;

function validateSpaceName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty");
  if (trimmed.length > 20) throw new Error("Name must be 20 characters or fewer");
  if (/\s/.test(trimmed)) throw new Error("Name cannot contain spaces");
  if (!VALID_NAME_RE.test(trimmed)) throw new Error("Only letters, numbers, and hyphens");
  const lower = trimmed.toLowerCase();
  for (const term of CRISIS_BLOCKLIST) {
    if (lower.includes(term)) throw new Error("That's not a name we can use here");
  }
  return trimmed;
}

/**
 * Fetch preferences for the current user's profile.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    if (!preferences) {
      throw new Error("Preferences not found");
    }

    return preferences;
  },
});

/**
 * Whether the user has "share by default" enabled.
 * Narrow query to avoid re-renders from unrelated preference changes.
 */
export const getContributeByDefault = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    return preferences?.contributeByDefault ?? false;
  },
});

/**
 * Partial update of preferences. All fields optional.
 */
export const update = mutation({
  args: {
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
    reducedMotion: v.optional(v.boolean()),
    notifications: v.optional(
      v.object({
        enabled: v.boolean(),
        gentleReturn: v.boolean(),
        patternNudge: v.boolean(),
        milestone: v.boolean(),
      })
    ),
    mirrorTone: v.optional(mirrorToneValidator),
    contributeByDefault: v.optional(v.boolean()),
    dataRetentionPreference: v.optional(
      v.union(
        v.literal("indefinite"),
        v.literal("6_months"),
        v.literal("1_year")
      )
    ),
    preferredInputType: v.optional(
      v.union(v.literal("text"), v.literal("voice"))
    ),
    colorTheme: v.optional(v.string()),
    // null = clear the name; string = set/update; undefined = no-op
    spaceName: v.optional(v.union(v.string(), v.null())),
    spaceNamePromptDismissed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) =>
        q.eq("emotionalProfileId", profile._id)
      )
      .unique();

    if (!preferences) {
      throw new Error("Preferences not found");
    }

    // Build patch from provided args only
    const patch: Record<string, unknown> = {};
    if (args.theme !== undefined) patch.theme = args.theme;
    if (args.reducedMotion !== undefined) patch.reducedMotion = args.reducedMotion;
    if (args.notifications !== undefined) patch.notifications = args.notifications;
    if (args.mirrorTone !== undefined) patch.mirrorTone = args.mirrorTone;
    if (args.contributeByDefault !== undefined)
      patch.contributeByDefault = args.contributeByDefault;
    if (args.dataRetentionPreference !== undefined)
      patch.dataRetentionPreference = args.dataRetentionPreference;
    if (args.preferredInputType !== undefined)
      patch.preferredInputType = args.preferredInputType;
    if (args.colorTheme !== undefined) patch.colorTheme = args.colorTheme;
    if (args.spaceName !== undefined) {
      patch.spaceName = args.spaceName === null ? undefined : validateSpaceName(args.spaceName);
    }
    if (args.spaceNamePromptDismissed !== undefined) {
      patch.spaceNamePromptDismissed = args.spaceNamePromptDismissed;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(preferences._id, patch);
    }

    return null;
  },
});

