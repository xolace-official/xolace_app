/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_cached from "../ai/cached.js";
import type * as ai_cachedActions from "../ai/cachedActions.js";
import type * as ai_clarify from "../ai/clarify.js";
import type * as ai_context from "../ai/context.js";
import type * as ai_helpers_patternSummary from "../ai/helpers/patternSummary.js";
import type * as ai_process from "../ai/process.js";
import type * as ai_prompts_articulator from "../ai/prompts/articulator.js";
import type * as ai_prompts_classifier from "../ai/prompts/classifier.js";
import type * as ai_prompts_distiller from "../ai/prompts/distiller.js";
import type * as ai_providers_anthropic from "../ai/providers/anthropic.js";
import type * as ai_providers_moderation from "../ai/providers/moderation.js";
import type * as ai_safeguard from "../ai/safeguard.js";
import type * as consent from "../consent.js";
import type * as crons from "../crons.js";
import type * as emotionalMetadata from "../emotionalMetadata.js";
import type * as escalation from "../escalation.js";
import type * as exercises from "../exercises.js";
import type * as jobs_accountDeletion from "../jobs/accountDeletion.js";
import type * as jobs_dataRetention from "../jobs/dataRetention.js";
import type * as jobs_dataWipe from "../jobs/dataWipe.js";
import type * as jobs_profileStats from "../jobs/profileStats.js";
import type * as jobs_reflectionAnonymizer from "../jobs/reflectionAnonymizer.js";
import type * as jobs_reflectionDistiller from "../jobs/reflectionDistiller.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_timeOfDay from "../lib/timeOfDay.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations from "../migrations.js";
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
  "ai/cached": typeof ai_cached;
  "ai/cachedActions": typeof ai_cachedActions;
  "ai/clarify": typeof ai_clarify;
  "ai/context": typeof ai_context;
  "ai/helpers/patternSummary": typeof ai_helpers_patternSummary;
  "ai/process": typeof ai_process;
  "ai/prompts/articulator": typeof ai_prompts_articulator;
  "ai/prompts/classifier": typeof ai_prompts_classifier;
  "ai/prompts/distiller": typeof ai_prompts_distiller;
  "ai/providers/anthropic": typeof ai_providers_anthropic;
  "ai/providers/moderation": typeof ai_providers_moderation;
  "ai/safeguard": typeof ai_safeguard;
  consent: typeof consent;
  crons: typeof crons;
  emotionalMetadata: typeof emotionalMetadata;
  escalation: typeof escalation;
  exercises: typeof exercises;
  "jobs/accountDeletion": typeof jobs_accountDeletion;
  "jobs/dataRetention": typeof jobs_dataRetention;
  "jobs/dataWipe": typeof jobs_dataWipe;
  "jobs/profileStats": typeof jobs_profileStats;
  "jobs/reflectionAnonymizer": typeof jobs_reflectionAnonymizer;
  "jobs/reflectionDistiller": typeof jobs_reflectionDistiller;
  "lib/auth": typeof lib_auth;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/timeOfDay": typeof lib_timeOfDay;
  "lib/validators": typeof lib_validators;
  migrations: typeof migrations;
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

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  actionCache: {
    crons: {
      purge: FunctionReference<
        "mutation",
        "internal",
        { expiresAt?: number },
        null
      >;
    };
    lib: {
      get: FunctionReference<
        "query",
        "internal",
        { args: any; name: string; ttl: number | null },
        { kind: "hit"; value: any } | { expiredEntry?: string; kind: "miss" }
      >;
      put: FunctionReference<
        "mutation",
        "internal",
        {
          args: any;
          expiredEntry?: string;
          name: string;
          ttl: number | null;
          value: any;
        },
        { cacheHit: boolean; deletedExpiredEntry: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { args: any; name: string },
        null
      >;
      removeAll: FunctionReference<
        "mutation",
        "internal",
        { batchSize?: number; before?: number; name?: string },
        null
      >;
    };
  };
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
          oneBatchOnly?: boolean;
          reset?: boolean;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
