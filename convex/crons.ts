import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for abandoned sessions every 15 minutes
crons.interval(
  "check abandoned sessions",
  { minutes: 15 },
  internal.sessions.checkAbandoned,
  {}
);

// Enforce data retention policies daily
crons.interval(
  "enforce data retention",
  { hours: 24 },
  internal.jobs.dataRetention.enforce,
  {}
);

// Process account deletions hourly
crons.interval(
  "process account deletions",
  { hours: 1 },
  internal.jobs.accountDeletion.purge,
  {}
);

export default crons;
