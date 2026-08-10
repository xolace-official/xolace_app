import { query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { hasPremium } from "./lib/premium";

/**
 * Xolace Insights V1
 *
 * Derived server-side from existing profile/session data.
 * No new database table is required.
 *
 * V1:
 * - Words That Keep Finding You     (Plus)
 * - What Seems To Help              (Plus)
 * - Your Rhythm                     (Free)
 * - Mirror Resonance                (Plus)
 */

const MIN_COMPLETED_SESSIONS = 8;
const MIN_PATH_SESSIONS = 5;
const MIN_RHYTHM_SESSIONS = 5;
const MIN_MIRROR_SESSIONS = 5;

// Keep the query bounded. This is deliberately conservative for V1.
const HISTORY_LIMIT = 100;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const TIME_LABELS = [
  "midnight",
  "1 AM",
  "2 AM",
  "3 AM",
  "4 AM",
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "noon",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
] as const;

type PathKey = "solo" | "peers" | "exit";

type SessionForInsight = {
  state: string;
  pathChosen?: PathKey;
  postSessionMood?: "lighter" | "same" | "heavier" | "unsure";
  confirmationState?: "confirmed" | "refined" | "gave_up" | "abandoned";
};

function percentage(value: number): number {
  return Math.round(value * 100);
}

function getPathLabel(path: PathKey): string {
  switch (path) {
    case "solo":
      return "Sit With This";
    case "peers":
      return "You're Not Alone";
    case "exit":
      return "Take This With You";
  }
}

function getTimeLabel(hour: number): string {
  if (hour < 0 || hour > 23) return "the evening";
  return TIME_LABELS[hour];
}

function buildWordsInsight(
  metadataRows: Array<{ userLanguageTags: string[] }>,
  premium: boolean,
) {
  if (!premium) {
    return {
      available: false,
      premiumRequired: true,
      items: [],
    };
  }

  // Each metadata row represents one session. A Set prevents repeated use
  // of the same word inside one session from inflating the recurrence count.
  const counts = new Map<string, number>();

  for (const row of metadataRows) {
    const wordsThisSession = new Set<string>();

    for (const rawWord of row.userLanguageTags ?? []) {
      const word = rawWord.trim().toLowerCase();
      if (word.length > 0) {
        wordsThisSession.add(word);
      }
    }

    for (const word of wordsThisSession) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const items = Array.from(counts.entries())
    .filter(([, sessionCount]) => sessionCount >= 3)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 5)
    .map(([word, sessionCount]) => ({
      word,
      sessionCount,
    }));

  return {
    available: items.length > 0,
    premiumRequired: false,
    items,
  };
}

function buildWhatHelpsInsight(
  sessions: SessionForInsight[],
  premium: boolean,
) {
  if (!premium) {
    return {
      available: false,
      premiumRequired: true,
      bestPath: null,
      bestPathLabel: null,
      lighterRate: null,
      sessionCount: 0,
    };
  }

  const pathStats: Record<
    PathKey,
    { total: number; lighter: number }
  > = {
    solo: { total: 0, lighter: 0 },
    peers: { total: 0, lighter: 0 },
    exit: { total: 0, lighter: 0 },
  };

  for (const session of sessions) {
    if (!session.pathChosen || !session.postSessionMood) continue;

    const stats = pathStats[session.pathChosen];
    stats.total += 1;

    if (session.postSessionMood === "lighter") {
      stats.lighter += 1;
    }
  }

  let bestPath: PathKey | null = null;
  let bestRate = -1;
  let bestCount = 0;

  for (const path of Object.keys(pathStats) as PathKey[]) {
    const stats = pathStats[path];

    if (stats.total < MIN_PATH_SESSIONS) continue;

    const rate = stats.lighter / stats.total;

    // Prefer the path with the strongest lighter rate.
    // If tied, prefer the one with more observations.
    if (
      rate > bestRate ||
      (rate === bestRate && stats.total > bestCount)
    ) {
      bestPath = path;
      bestRate = rate;
      bestCount = stats.total;
    }
  }

  if (!bestPath) {
    return {
      available: false,
      premiumRequired: false,
      bestPath: null,
      bestPathLabel: null,
      lighterRate: null,
      sessionCount: 0,
    };
  }

  return {
    available: sessions.length >= MIN_COMPLETED_SESSIONS,
    premiumRequired: false,
    bestPath,
    bestPathLabel: getPathLabel(bestPath),
    lighterRate: percentage(bestRate),
    sessionCount: bestCount,
  };
}

function buildRhythmInsight(
  sessionCount: number,
  typicalUsagePattern:
    | { dayOfWeek: number; hourOfDay: number }
    | undefined,
) {
  if (
    sessionCount < MIN_RHYTHM_SESSIONS ||
    !typicalUsagePattern ||
    typicalUsagePattern.dayOfWeek < 0 ||
    typicalUsagePattern.dayOfWeek > 6 ||
    typicalUsagePattern.hourOfDay < 0 ||
    typicalUsagePattern.hourOfDay > 23
  ) {
    return {
      available: false,
      dayOfWeek: null,
      timeOfDay: null,
    };
  }

  return {
    available: true,
    dayOfWeek: DAY_NAMES[typicalUsagePattern.dayOfWeek],
    timeOfDay: getTimeLabel(typicalUsagePattern.hourOfDay),
  };
}

function buildMirrorResonanceInsight(
  sessions: SessionForInsight[],
  premium: boolean,
) {
  if (!premium) {
    return {
      available: false,
      premiumRequired: true,
      firstTryRate: null,
      eligibleSessions: 0,
    };
  }

  const eligible = sessions.filter(
    (session) =>
      session.confirmationState === "confirmed" ||
      session.confirmationState === "refined",
  );

  if (eligible.length < MIN_MIRROR_SESSIONS) {
    return {
      available: false,
      premiumRequired: false,
      firstTryRate: null,
      eligibleSessions: eligible.length,
    };
  }

  const firstTrySessions = eligible.filter(
    (session) => session.confirmationState === "confirmed",
  ).length;

  return {
    available: true,
    premiumRequired: false,
    firstTryRate: percentage(firstTrySessions / eligible.length),
    eligibleSessions: eligible.length,
  };
}

/**
 * Single server-side Insights entry point.
 *
 * The client receives derived data only.
 * Raw session content is never returned.
 */
export const getMyInsights = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);
    const premium = await hasPremium(ctx, profile);

    // Bounded metadata history for the recurring-language insight.
    // Each metadata row is one session, so recurrence can be counted by
    // distinct sessions rather than raw word frequency.
    const recentMetadata = premium
      ? await ctx.db
          .query("emotional_metadata")
          .withIndex("by_profile_createdAt", (q) =>
            q.eq("emotionalProfileId", profile._id),
          )
          .order("desc")
          .take(HISTORY_LIMIT)
      : [];

    const words = buildWordsInsight(recentMetadata, premium);

    // Bounded session history for V1.
    // Existing `by_profile_time` index gives us newest-first user history.
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_time", (q) =>
        q.eq("emotionalProfileId", profile._id),
      )
      .order("desc")
      .take(HISTORY_LIMIT);

    const completedSessions = recentSessions.filter(
      (session) => session.state === "completed",
    ) as SessionForInsight[];

    const whatHelps = buildWhatHelpsInsight(
      completedSessions,
      premium,
    );

    // This already has an existing server-side 5-session gate.
    const rhythm = buildRhythmInsight(
      profile.sessionCount,
      profile.typicalUsagePattern,
    );

    /*
     * `confirmationState` already records the terminal mirror outcome:
     *   confirmed = landed without refinement
     *   refined   = required refinement
     *
     * Using the terminal state avoids an N+1 session_turns query for every
     * historical session. session_turns remains the underlying refinement
     * history and can be used later for deeper analysis.
     */
    const mirrorResonance = buildMirrorResonanceInsight(
      completedSessions,
      premium,
    );

    return {
      version: 1,

      sessionCount: profile.sessionCount,

      words,
      whatHelps,
      rhythm,
      mirrorResonance,

      // Useful to the UI for empty/insufficient-data states.
      hasEnoughHistory:
        profile.sessionCount >= MIN_COMPLETED_SESSIONS,

      premium,
    };
  },
});