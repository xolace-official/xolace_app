import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Set CONVEX_ENV=production on the prod deployment, leave unset (or "development") on dev.
// Dev gets much longer intervals to avoid burning resources during development.
const CONVEX_ENV = process.env.CONVEX_ENV;
const VALID_ENVS = ["production", "development"] as const;
if (CONVEX_ENV !== undefined && !(VALID_ENVS as readonly string[]).includes(CONVEX_ENV)) {
  throw new Error(
    `Invalid CONVEX_ENV="${CONVEX_ENV}". Expected one of: ${VALID_ENVS.join(", ")} (or leave unset for development).`,
  );
}
const isProd = CONVEX_ENV === "production";

const crons = cronJobs();

// Check for abandoned sessions
crons.interval(
  "check abandoned sessions",
  isProd ? { hours: 6 } : { hours: 12 },
  internal.sessions.checkAbandoned,
  {}
);

// Enforce data retention policies
crons.interval(
  "enforce data retention",
  isProd ? { hours: 24 } : { hours: 72 },
  internal.jobs.dataRetention.enforce,
  {}
);

// Process account deletions
crons.interval(
  "process account deletions",
  isProd ? { hours: 2 } : { hours: 24 },
  internal.jobs.accountDeletion.purge,
  {}
);

// Check for gentle return notifications
crons.interval(
  "check gentle return notifications",
  isProd ? { hours: 6 } : { hours: 24 },
  internal.jobs.notificationTriggers.checkGentleReturn,
  {}
);

// Check for pattern nudge notifications
crons.interval(
  "check pattern nudge notifications",
  isProd ? { hours: 1 } : { hours: 12 },
  internal.jobs.notificationTriggers.checkPatternNudge,
  {}
);

// Nightly daily quotes generation (midnight UTC)
crons.cron(
  "nightly daily quotes",
  "0 0 * * *",
  internal.jobs.quotesGenerator.generateForNextBatch,
  { cursor: null }
);

export default crons;
