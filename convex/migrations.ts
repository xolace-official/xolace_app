import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { reflectionRank } from "./lib/aggregates";
import { displayStreak } from "./lib/streak";
import { localDayKey } from "./lib/activityLog";

// Run both in sequence (renameRawInput first, then renameUserInput):
//   bunx convex run migrations:runAll
import { internal } from "./_generated/api";

export const migrations = new Migrations<DataModel>(components.migrations);

// General-purpose runner — invoke via CLI:
//   bunx convex run migrations:run '{"fn": "migrations:foo"}'
export const run = migrations.runner();

// COMPLETED: rawInputEncrypted → rawInput (sessions)
// Ran 2026-04-08. Schema narrowed. Safe to keep as a no-op record.
export const renameRawInput = migrations.define({
  table: "sessions",
  migrateOne: async (_ctx, _doc) => {},
});

// COMPLETED: userInputEncrypted → userInput (session_turns)
// Ran 2026-04-08. Schema narrowed. Safe to keep as a no-op record.
export const renameUserInput = migrations.define({
  table: "session_turns",
  migrateOne: async (_ctx, _doc) => {},
});

// Backfill longestStreak from currentStreak for profiles created before the
// field existed. Idempotent — skips rows that already have a value.
//   bunx convex run migrations:run '{"fn": "migrations:backfillLongestStreak"}'
export const backfillLongestStreak = migrations.define({
  table: "emotional_profiles",
  migrateOne: async (_ctx, doc) => {
    if (doc.longestStreak === undefined) {
      return { longestStreak: doc.currentStreak };
    }
  },
});

// Backfill the reflectionRank aggregate from existing emotional_profiles rows.
// Must run once before the percentile card is enabled, otherwise the aggregate
// only knows about profiles touched since the component was deployed.
// Idempotent — insertIfDoesNotExist skips keys already present, so it is safe
// to re-run after a partial failure.
//   bunx convex run migrations:run '{"fn": "migrations:backfillReflectionRank"}'
export const backfillReflectionRank = migrations.define({
  table: "emotional_profiles",
  migrateOne: async (ctx, doc) => {
    await reflectionRank.insertIfDoesNotExist(ctx, doc);
  },
});
// Activity-log cutover (#432). Seeds one `activity_log` row per profile from
// the streak as it's *currently displayed* (displayStreak), not a full
// historical backfill — an expired streak seeds nothing and its mirror is
// zeroed to match what users already see; a live streak gets a single
// "reflect" row for its last qualifying local day. Idempotent — skips a
// profile that already has a row for that day/action.
//   bunx convex run migrations:run '{"fn": "migrations:cutoverActivityLog"}'
export const cutoverActivityLog = migrations.define({
  table: "emotional_profiles",
  migrateOne: async (ctx, doc) => {
    const streak = displayStreak(doc.currentStreak, doc.lastSessionAt);

    if (streak === 0) {
      if (doc.currentStreak !== 0) return { currentStreak: 0 };
      return;
    }

    if (!doc.lastSessionAt) return;

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_profile", (q) => q.eq("emotionalProfileId", doc._id))
      .unique();
    const timezone = preferences?.notifications.timezone ?? "UTC";
    const dayKey = localDayKey(doc.lastSessionAt, timezone);

    const existing = await ctx.db
      .query("activity_log")
      .withIndex("by_profile_day_action", (q) =>
        q.eq("emotionalProfileId", doc._id).eq("dayKey", dayKey).eq("actionType", "reflect"),
      )
      .unique();
    if (existing) return;

    await ctx.db.insert("activity_log", {
      emotionalProfileId: doc._id,
      dayKey,
      actionType: "reflect",
      count: 1,
      createdAt: doc.lastSessionAt,
      updatedAt: doc.lastSessionAt,
    });
  },
});

export const runAll = migrations.runner([
  internal.migrations.renameRawInput,
  internal.migrations.renameUserInput,
  internal.migrations.backfillLongestStreak,
  internal.migrations.backfillReflectionRank,
]);
