import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Shared push notification component instance.
 * Keyed to emotional_profiles — consistent with how all Xolace
 * user-facing data is indexed (decoupled from auth identity).
 */
export const pushNotifications = new PushNotifications<
  Id<"emotional_profiles">
>(components.pushNotifications);
