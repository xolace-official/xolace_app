/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_context from "../ai/context.js";
import type * as ai_process from "../ai/process.js";
import type * as consent from "../consent.js";
import type * as crons from "../crons.js";
import type * as emotionalMetadata from "../emotionalMetadata.js";
import type * as escalation from "../escalation.js";
import type * as exercises from "../exercises.js";
import type * as jobs_accountDeletion from "../jobs/accountDeletion.js";
import type * as jobs_dataRetention from "../jobs/dataRetention.js";
import type * as jobs_profileStats from "../jobs/profileStats.js";
import type * as jobs_reflectionAnonymizer from "../jobs/reflectionAnonymizer.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_timeOfDay from "../lib/timeOfDay.js";
import type * as lib_validators from "../lib/validators.js";
import type * as notifications from "../notifications.js";
import type * as preferences from "../preferences.js";
import type * as reflections from "../reflections.js";
import type * as seed from "../seed.js";
import type * as sessionTurns from "../sessionTurns.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/context": typeof ai_context;
  "ai/process": typeof ai_process;
  consent: typeof consent;
  crons: typeof crons;
  emotionalMetadata: typeof emotionalMetadata;
  escalation: typeof escalation;
  exercises: typeof exercises;
  "jobs/accountDeletion": typeof jobs_accountDeletion;
  "jobs/dataRetention": typeof jobs_dataRetention;
  "jobs/profileStats": typeof jobs_profileStats;
  "jobs/reflectionAnonymizer": typeof jobs_reflectionAnonymizer;
  "lib/auth": typeof lib_auth;
  "lib/timeOfDay": typeof lib_timeOfDay;
  "lib/validators": typeof lib_validators;
  notifications: typeof notifications;
  preferences: typeof preferences;
  reflections: typeof reflections;
  seed: typeof seed;
  sessionTurns: typeof sessionTurns;
  sessions: typeof sessions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
