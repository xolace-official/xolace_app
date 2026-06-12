/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_bridge from "../ai/bridge.js";
import type * as ai_cached from "../ai/cached.js";
import type * as ai_cachedActions from "../ai/cachedActions.js";
import type * as ai_clarify from "../ai/clarify.js";
import type * as ai_context from "../ai/context.js";
import type * as ai_generateNotification from "../ai/generateNotification.js";
import type * as ai_helpers_patternSummary from "../ai/helpers/patternSummary.js";
import type * as ai_process from "../ai/process.js";
import type * as ai_prompts_articulator from "../ai/prompts/articulator.js";
import type * as ai_prompts_classifier from "../ai/prompts/classifier.js";
import type * as ai_prompts_distiller from "../ai/prompts/distiller.js";
import type * as ai_prompts_notificationTemplates from "../ai/prompts/notificationTemplates.js";
import type * as ai_prompts_notificationWriter from "../ai/prompts/notificationWriter.js";
import type * as ai_providers_anthropic from "../ai/providers/anthropic.js";
import type * as ai_providers_moderation from "../ai/providers/moderation.js";
import type * as ai_quotesDistiller from "../ai/quotesDistiller.js";
import type * as ai_safeguard from "../ai/safeguard.js";
import type * as ai_slotFill from "../ai/slotFill.js";
import type * as ai_tts from "../ai/tts.js";
import type * as ai_ventAcknowledge from "../ai/ventAcknowledge.js";
import type * as consent from "../consent.js";
import type * as crons from "../crons.js";
import type * as dailyQuotes from "../dailyQuotes.js";
import type * as devTools from "../devTools.js";
import type * as emotionalMetadata from "../emotionalMetadata.js";
import type * as escalation from "../escalation.js";
import type * as exercises from "../exercises.js";
import type * as exercises_match from "../exercises/match.js";
import type * as feedback from "../feedback.js";
import type * as jobs_accountDeletion from "../jobs/accountDeletion.js";
import type * as jobs_dataRetention from "../jobs/dataRetention.js";
import type * as jobs_dataWipe from "../jobs/dataWipe.js";
import type * as jobs_notificationTriggers from "../jobs/notificationTriggers.js";
import type * as jobs_profileStats from "../jobs/profileStats.js";
import type * as jobs_quotesGenerator from "../jobs/quotesGenerator.js";
import type * as jobs_reflectionAnonymizer from "../jobs/reflectionAnonymizer.js";
import type * as jobs_reflectionDistiller from "../jobs/reflectionDistiller.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_notificationPrefs from "../lib/notificationPrefs.js";
import type * as lib_pushNotifications from "../lib/pushNotifications.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_spaceName from "../lib/spaceName.js";
import type * as lib_timeOfDay from "../lib/timeOfDay.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as posthog from "../posthog.js";
import type * as preferences from "../preferences.js";
import type * as quotes from "../quotes.js";
import type * as reflections from "../reflections.js";
import type * as seed from "../seed.js";
import type * as sessionTurns from "../sessionTurns.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";
import type * as vent from "../vent.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/bridge": typeof ai_bridge;
  "ai/cached": typeof ai_cached;
  "ai/cachedActions": typeof ai_cachedActions;
  "ai/clarify": typeof ai_clarify;
  "ai/context": typeof ai_context;
  "ai/generateNotification": typeof ai_generateNotification;
  "ai/helpers/patternSummary": typeof ai_helpers_patternSummary;
  "ai/process": typeof ai_process;
  "ai/prompts/articulator": typeof ai_prompts_articulator;
  "ai/prompts/classifier": typeof ai_prompts_classifier;
  "ai/prompts/distiller": typeof ai_prompts_distiller;
  "ai/prompts/notificationTemplates": typeof ai_prompts_notificationTemplates;
  "ai/prompts/notificationWriter": typeof ai_prompts_notificationWriter;
  "ai/providers/anthropic": typeof ai_providers_anthropic;
  "ai/providers/moderation": typeof ai_providers_moderation;
  "ai/quotesDistiller": typeof ai_quotesDistiller;
  "ai/safeguard": typeof ai_safeguard;
  "ai/slotFill": typeof ai_slotFill;
  "ai/tts": typeof ai_tts;
  "ai/ventAcknowledge": typeof ai_ventAcknowledge;
  consent: typeof consent;
  crons: typeof crons;
  dailyQuotes: typeof dailyQuotes;
  devTools: typeof devTools;
  emotionalMetadata: typeof emotionalMetadata;
  escalation: typeof escalation;
  exercises: typeof exercises;
  "exercises/match": typeof exercises_match;
  feedback: typeof feedback;
  "jobs/accountDeletion": typeof jobs_accountDeletion;
  "jobs/dataRetention": typeof jobs_dataRetention;
  "jobs/dataWipe": typeof jobs_dataWipe;
  "jobs/notificationTriggers": typeof jobs_notificationTriggers;
  "jobs/profileStats": typeof jobs_profileStats;
  "jobs/quotesGenerator": typeof jobs_quotesGenerator;
  "jobs/reflectionAnonymizer": typeof jobs_reflectionAnonymizer;
  "jobs/reflectionDistiller": typeof jobs_reflectionDistiller;
  "lib/auth": typeof lib_auth;
  "lib/notificationPrefs": typeof lib_notificationPrefs;
  "lib/pushNotifications": typeof lib_pushNotifications;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/spaceName": typeof lib_spaceName;
  "lib/timeOfDay": typeof lib_timeOfDay;
  "lib/validators": typeof lib_validators;
  migrations: typeof migrations;
  notifications: typeof notifications;
  posthog: typeof posthog;
  preferences: typeof preferences;
  quotes: typeof quotes;
  reflections: typeof reflections;
  seed: typeof seed;
  sessionTurns: typeof sessionTurns;
  sessions: typeof sessions;
  users: typeof users;
  vent: typeof vent;
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
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  actionCache: import("@convex-dev/action-cache/_generated/component.js").ComponentApi<"actionCache">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  pushNotifications: import("@convex-dev/expo-push-notifications/_generated/component.js").ComponentApi<"pushNotifications">;
  posthog: import("@posthog/convex/_generated/component.js").ComponentApi<"posthog">;
};
