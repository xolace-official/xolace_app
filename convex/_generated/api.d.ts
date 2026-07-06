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
import type * as ai_evalMetrics from "../ai/evalMetrics.js";
import type * as ai_generateNotification from "../ai/generateNotification.js";
import type * as ai_helpers_patternSummary from "../ai/helpers/patternSummary.js";
import type * as ai_process from "../ai/process.js";
import type * as ai_prompts_articulator from "../ai/prompts/articulator.js";
import type * as ai_prompts_classifier from "../ai/prompts/classifier.js";
import type * as ai_prompts_distiller from "../ai/prompts/distiller.js";
import type * as ai_prompts_followUpCardWriter from "../ai/prompts/followUpCardWriter.js";
import type * as ai_prompts_notificationTemplates from "../ai/prompts/notificationTemplates.js";
import type * as ai_prompts_notificationWriter from "../ai/prompts/notificationWriter.js";
import type * as ai_prompts_reflectionConsolidation from "../ai/prompts/reflectionConsolidation.js";
import type * as ai_prompts_reflectionLight from "../ai/prompts/reflectionLight.js";
import type * as ai_providers_anthropic from "../ai/providers/anthropic.js";
import type * as ai_providers_moderation from "../ai/providers/moderation.js";
import type * as ai_quotesDistiller from "../ai/quotesDistiller.js";
import type * as ai_reflectionAgent_calibration from "../ai/reflectionAgent/calibration.js";
import type * as ai_reflectionAgent_calibrationSignals from "../ai/reflectionAgent/calibrationSignals.js";
import type * as ai_reflectionAgent_consolidation from "../ai/reflectionAgent/consolidation.js";
import type * as ai_reflectionAgent_toolQueries from "../ai/reflectionAgent/toolQueries.js";
import type * as ai_reflectionAgent_tools from "../ai/reflectionAgent/tools.js";
import type * as ai_reflectionAgent_trigger from "../ai/reflectionAgent/trigger.js";
import type * as ai_reflectionAgent_triggerQueries from "../ai/reflectionAgent/triggerQueries.js";
import type * as ai_routing from "../ai/routing.js";
import type * as ai_safeguard from "../ai/safeguard.js";
import type * as ai_slotFill from "../ai/slotFill.js";
import type * as ai_tts from "../ai/tts.js";
import type * as ai_ventAcknowledge from "../ai/ventAcknowledge.js";
import type * as avatars from "../avatars.js";
import type * as consent from "../consent.js";
import type * as crons from "../crons.js";
import type * as dailyQuotes from "../dailyQuotes.js";
import type * as devTools from "../devTools.js";
import type * as emotionalMetadata from "../emotionalMetadata.js";
import type * as episodicImportance from "../episodicImportance.js";
import type * as episodicMemory from "../episodicMemory.js";
import type * as escalation from "../escalation.js";
import type * as evals from "../evals.js";
import type * as exercises from "../exercises.js";
import type * as exercises_match from "../exercises/match.js";
import type * as feedback from "../feedback.js";
import type * as followUps from "../followUps.js";
import type * as http from "../http.js";
import type * as jobs_accountDeletion from "../jobs/accountDeletion.js";
import type * as jobs_dataRetention from "../jobs/dataRetention.js";
import type * as jobs_dataWipe from "../jobs/dataWipe.js";
import type * as jobs_notificationTriggers from "../jobs/notificationTriggers.js";
import type * as jobs_profileStats from "../jobs/profileStats.js";
import type * as jobs_quotesGenerator from "../jobs/quotesGenerator.js";
import type * as jobs_reflectionAnonymizer from "../jobs/reflectionAnonymizer.js";
import type * as jobs_reflectionDistiller from "../jobs/reflectionDistiller.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_displayName from "../lib/displayName.js";
import type * as lib_followUpCadence from "../lib/followUpCadence.js";
import type * as lib_notificationPrefs from "../lib/notificationPrefs.js";
import type * as lib_premium from "../lib/premium.js";
import type * as lib_pushNotifications from "../lib/pushNotifications.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_reflectionMatching from "../lib/reflectionMatching.js";
import type * as lib_spaceName from "../lib/spaceName.js";
import type * as lib_streak from "../lib/streak.js";
import type * as lib_timeOfDay from "../lib/timeOfDay.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations from "../migrations.js";
import type * as monthlyEvents from "../monthlyEvents.js";
import type * as notifications from "../notifications.js";
import type * as posthog from "../posthog.js";
import type * as preferences from "../preferences.js";
import type * as premium from "../premium.js";
import type * as productFeedback from "../productFeedback.js";
import type * as profile from "../profile.js";
import type * as quotes from "../quotes.js";
import type * as rag from "../rag.js";
import type * as reflections from "../reflections.js";
import type * as reflectionsRag from "../reflectionsRag.js";
import type * as revenuecat from "../revenuecat.js";
import type * as seed from "../seed.js";
import type * as semanticProfiles from "../semanticProfiles.js";
import type * as sessionTurns from "../sessionTurns.js";
import type * as sessions from "../sessions.js";
import type * as understanding from "../understanding.js";
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
  "ai/evalMetrics": typeof ai_evalMetrics;
  "ai/generateNotification": typeof ai_generateNotification;
  "ai/helpers/patternSummary": typeof ai_helpers_patternSummary;
  "ai/process": typeof ai_process;
  "ai/prompts/articulator": typeof ai_prompts_articulator;
  "ai/prompts/classifier": typeof ai_prompts_classifier;
  "ai/prompts/distiller": typeof ai_prompts_distiller;
  "ai/prompts/followUpCardWriter": typeof ai_prompts_followUpCardWriter;
  "ai/prompts/notificationTemplates": typeof ai_prompts_notificationTemplates;
  "ai/prompts/notificationWriter": typeof ai_prompts_notificationWriter;
  "ai/prompts/reflectionConsolidation": typeof ai_prompts_reflectionConsolidation;
  "ai/prompts/reflectionLight": typeof ai_prompts_reflectionLight;
  "ai/providers/anthropic": typeof ai_providers_anthropic;
  "ai/providers/moderation": typeof ai_providers_moderation;
  "ai/quotesDistiller": typeof ai_quotesDistiller;
  "ai/reflectionAgent/calibration": typeof ai_reflectionAgent_calibration;
  "ai/reflectionAgent/calibrationSignals": typeof ai_reflectionAgent_calibrationSignals;
  "ai/reflectionAgent/consolidation": typeof ai_reflectionAgent_consolidation;
  "ai/reflectionAgent/toolQueries": typeof ai_reflectionAgent_toolQueries;
  "ai/reflectionAgent/tools": typeof ai_reflectionAgent_tools;
  "ai/reflectionAgent/trigger": typeof ai_reflectionAgent_trigger;
  "ai/reflectionAgent/triggerQueries": typeof ai_reflectionAgent_triggerQueries;
  "ai/routing": typeof ai_routing;
  "ai/safeguard": typeof ai_safeguard;
  "ai/slotFill": typeof ai_slotFill;
  "ai/tts": typeof ai_tts;
  "ai/ventAcknowledge": typeof ai_ventAcknowledge;
  avatars: typeof avatars;
  consent: typeof consent;
  crons: typeof crons;
  dailyQuotes: typeof dailyQuotes;
  devTools: typeof devTools;
  emotionalMetadata: typeof emotionalMetadata;
  episodicImportance: typeof episodicImportance;
  episodicMemory: typeof episodicMemory;
  escalation: typeof escalation;
  evals: typeof evals;
  exercises: typeof exercises;
  "exercises/match": typeof exercises_match;
  feedback: typeof feedback;
  followUps: typeof followUps;
  http: typeof http;
  "jobs/accountDeletion": typeof jobs_accountDeletion;
  "jobs/dataRetention": typeof jobs_dataRetention;
  "jobs/dataWipe": typeof jobs_dataWipe;
  "jobs/notificationTriggers": typeof jobs_notificationTriggers;
  "jobs/profileStats": typeof jobs_profileStats;
  "jobs/quotesGenerator": typeof jobs_quotesGenerator;
  "jobs/reflectionAnonymizer": typeof jobs_reflectionAnonymizer;
  "jobs/reflectionDistiller": typeof jobs_reflectionDistiller;
  "lib/auth": typeof lib_auth;
  "lib/displayName": typeof lib_displayName;
  "lib/followUpCadence": typeof lib_followUpCadence;
  "lib/notificationPrefs": typeof lib_notificationPrefs;
  "lib/premium": typeof lib_premium;
  "lib/pushNotifications": typeof lib_pushNotifications;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/reflectionMatching": typeof lib_reflectionMatching;
  "lib/spaceName": typeof lib_spaceName;
  "lib/streak": typeof lib_streak;
  "lib/timeOfDay": typeof lib_timeOfDay;
  "lib/validators": typeof lib_validators;
  migrations: typeof migrations;
  monthlyEvents: typeof monthlyEvents;
  notifications: typeof notifications;
  posthog: typeof posthog;
  preferences: typeof preferences;
  premium: typeof premium;
  productFeedback: typeof productFeedback;
  profile: typeof profile;
  quotes: typeof quotes;
  rag: typeof rag;
  reflections: typeof reflections;
  reflectionsRag: typeof reflectionsRag;
  revenuecat: typeof revenuecat;
  seed: typeof seed;
  semanticProfiles: typeof semanticProfiles;
  sessionTurns: typeof sessionTurns;
  sessions: typeof sessions;
  understanding: typeof understanding;
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
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  revenuecat: import("convex-revenuecat/_generated/component.js").ComponentApi<"revenuecat">;
  posthog: import("@posthog/convex/_generated/component.js").ComponentApi<"posthog">;
};
