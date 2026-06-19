import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { generateDisplayName } from "./lib/displayName";

// Premium stub — swap for hasEntitlement() when RevenueCat is wired in Wave 2.
// Gate server-side so client never receives locked data, only null + premiumRequired.
function hasPremium(): boolean {
  return false;
}

// Deterministic fallback name for users created before displayName existed.
// Consistent per-profile so the same user always sees the same name.
function seededDisplayName(profileId: string): string {
  const NAMES = [
    'Wren', 'River', 'Sage', 'Cedar', 'Vale', 'Fern', 'Lumen', 'Mist',
    'Dusk', 'Ash', 'Reed', 'Birch', 'Lyra', 'Haze', 'Cloud', 'Stone',
    'Cove', 'Flint', 'Glen', 'Sable', 'Haven', 'Soleil', 'Briar', 'Crest',
  ];
  let hash = 0;
  for (const ch of profileId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return NAMES[hash % NAMES.length];
}

/**
 * Full profile summary for the profile screen.
 * Reads denormalized profile fields + preferences in two bounded point reads.
 */
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profile._id))
      .unique();

    // Recent language tags for the P5 words teaser — bounded 5-entry scan.
    const recentMeta = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) => q.eq("emotionalProfileId", profile._id))
      .order("desc")
      .take(5);
    const recentWords = [...new Set(recentMeta.flatMap((m) => m.userLanguageTags))].slice(0, 4);

    return {
      displayName: prefs?.displayName ?? seededDisplayName(profile._id),
      avatarId: prefs?.avatarId ?? "default",
      firstSessionAt: profile.firstSessionAt ?? null,
      sessionCount: profile.sessionCount,
      currentStreak: profile.currentStreak,
      dominantEmotionTags: profile.dominantEmotionTags,
      typicalUsagePattern: profile.typicalUsagePattern ?? null,
      recentWords,
    };
  },
});

/**
 * Mood delta — majority bucket from last 10 sessions with postSessionMood set.
 * Returns null if fewer than 3 data points (not enough to show a pattern).
 */
export const getMoodDelta = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    // Take last 30 sessions; filter in JS (bounded, one user's data).
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) => q.eq("emotionalProfileId", profile._id))
      .order("desc")
      .take(30);

    const moods = sessions
      .filter((s) => s.postSessionMood !== undefined)
      .slice(0, 10)
      .map((s) => s.postSessionMood as "lighter" | "same" | "heavier" | "unsure");

    if (moods.length < 3) return null;

    const counts: Record<string, number> = { lighter: 0, same: 0, heavier: 0, unsure: 0 };
    for (const m of moods) counts[m]++;

    const [topBucket, topCount] = (Object.entries(counts) as [string, number][]).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );

    if (topCount / moods.length < 0.4) return "mixed" as const;
    return topBucket as "lighter" | "same" | "heavier" | "unsure" | "mixed";
  },
});

/**
 * Current-week intensity data for the P2 chart teaser (Mon–Sun).
 * Returns per-day averages and which day peaked.
 * Earlier-week depth is gated premium — returns null + premiumRequired flag.
 */
export const getWeekIntensity = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    const now = Date.now();
    // Shift so Mon=0, Sun=6
    const dayOfWeek = (new Date(now).getDay() + 6) % 7;
    const weekStart = new Date(now - dayOfWeek * 86_400_000);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

    // Bounded scan: take up to 50, filter to current week in JS.
    const allMeta = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_profile_theme", (q) => q.eq("emotionalProfileId", profile._id))
      .order("desc")
      .take(50);

    const metadata = allMeta.filter(
      (m) => m.createdAt >= weekStart.getTime() && m.createdAt < weekEnd.getTime(),
    );

    const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
    const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const buckets: number[][] = [[], [], [], [], [], [], []];

    for (const m of metadata) {
      const idx = (new Date(m.createdAt).getDay() + 6) % 7;
      buckets[idx].push(m.intensity);
    }

    const todayIdx = (new Date(now).getDay() + 6) % 7;

    const days = DAY_LABELS.map((label, i) => {
      const vals = buckets[i];
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return { label, dayName: DAY_NAMES[i], intensity: avg, isToday: i === todayIdx };
    });

    const peakIdx = days.reduce<number | null>((best, d, i) => {
      if (d.intensity === null) return best;
      if (best === null) return i;
      return (days[i].intensity ?? 0) > (days[best].intensity ?? 0) ? i : best;
    }, null);

    return {
      days,
      peakDay: peakIdx !== null ? days[peakIdx].dayName : null,
      hasData: days.some((d) => d.intensity !== null),
      premiumRequired: !hasPremium(),
    };
  },
});

/**
 * Record intent-only waitlist interest for a premium insight teaser.
 * Pre-billing desire signal — no price, no IAP. Idempotent per profile+feature.
 */
export const joinInsightWaitlist = mutation({
  args: { feature: v.string() },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const existing = await ctx.db
      .query("insight_waitlist")
      .withIndex("by_profile_feature", (q) =>
        q.eq("emotionalProfileId", profile._id).eq("feature", args.feature),
      )
      .unique();

    if (existing) return { alreadyJoined: true };

    await ctx.db.insert("insight_waitlist", {
      emotionalProfileId: profile._id,
      feature: args.feature,
      joinedAt: Date.now(),
    });
    return { alreadyJoined: false };
  },
});

/**
 * Features the authenticated profile has already joined the waitlist for.
 * Lets the teaser show an "already on the list" state on re-tap.
 */
export const listInsightWaitlist = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const rows = await ctx.db
      .query("insight_waitlist")
      .withIndex("by_profile_feature", (q) => q.eq("emotionalProfileId", profile._id))
      .take(20);
    return rows.map((r) => r.feature);
  },
});

/**
 * Update displayName. Max 30 chars. Emoji and symbols allowed.
 */
export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const trimmed = args.displayName.trim();
    if (trimmed.length === 0) throw new Error("Name cannot be empty");
    if ([...trimmed].length > 30) throw new Error("Name must be 30 characters or fewer");

    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", profile._id))
      .unique();
    if (!prefs) throw new Error("Preferences not found");

    await ctx.db.patch(prefs._id, { displayName: trimmed });
    return null;
  },
});
