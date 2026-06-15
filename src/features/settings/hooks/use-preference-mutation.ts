import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Single-sourced optimistic-update mutation for preferences.
 * Every sub-screen hook calls this instead of wiring its own copy.
 * Convex deduplicates the underlying `useQuery(api.preferences.get)` across
 * all components, so subscribing in multiple hooks adds zero extra network cost.
 */
export const usePreferenceMutation = () =>
  useMutation(api.preferences.update).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.preferences.get, {});
    if (current === undefined) return;

    const hasNotificationsChange =
      args.notifications !== undefined ||
      args.notificationReach !== undefined ||
      args.notificationQuietWindow !== undefined ||
      args.notificationTimezone !== undefined;

    const mergedNotifications = hasNotificationsChange
      ? {
          ...(args.notifications ?? current.notifications),
          ...(args.notificationReach !== undefined && { reach: args.notificationReach }),
          ...(args.notificationQuietWindow !== undefined && {
            quietWindow: args.notificationQuietWindow ?? undefined,
          }),
          ...(args.notificationTimezone !== undefined && { timezone: args.notificationTimezone }),
        }
      : undefined;

    localStore.setQuery(api.preferences.get, {}, {
      ...current,
      ...(args.theme !== undefined && { theme: args.theme }),
      ...(args.reducedMotion !== undefined && { reducedMotion: args.reducedMotion }),
      ...(args.mirrorTone !== undefined && { mirrorTone: args.mirrorTone }),
      ...(args.contributeByDefault !== undefined && { contributeByDefault: args.contributeByDefault }),
      ...(args.dataRetentionPreference !== undefined && { dataRetentionPreference: args.dataRetentionPreference }),
      ...(args.preferredInputType !== undefined && { preferredInputType: args.preferredInputType }),
      ...(args.colorTheme !== undefined && { colorTheme: args.colorTheme }),
      ...(args.spaceName !== undefined && { spaceName: args.spaceName ?? undefined }),
      ...(args.spaceNamePromptDismissed !== undefined && { spaceNamePromptDismissed: args.spaceNamePromptDismissed }),
      ...(mergedNotifications !== undefined && { notifications: mergedNotifications }),
    });
  });
