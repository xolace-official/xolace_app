import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

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

// Run both in sequence (renameRawInput first, then renameUserInput):
//   bunx convex run migrations:runAll
import { internal } from "./_generated/api";
export const runAll = migrations.runner([
  internal.migrations.renameRawInput,
  internal.migrations.renameUserInput,
]);
