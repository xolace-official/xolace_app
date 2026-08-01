import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { api } from '@/convex/_generated/api';

/**
 * Identify the client on the pseudonymous `emotional_profiles._id`.
 *
 * Every server capture uses that id as its distinctId (RevenueCat's
 * `appUserId` is the same id — see premium.ts), so identifying on `users._id`
 * put client and server events on two different persons and silently split
 * every funnel that crossed the boundary.
 *
 * Runs on app open rather than at sign-in: existing installs never call
 * `users.getOrCreate` again, so a sign-in-only fix would never reach them.
 * Sign-out already calls `posthog.reset()`, so the anonymous → identified
 * merge is clean on the next sign-in.
 */
export function usePostHogIdentity() {
  const posthog = usePostHog();
  const context = useQuery(api.users.getFullContext);
  const identified = useRef<string | null>(null);

  useEffect(() => {
    const profileId = context?.profile?._id;
    if (!profileId || identified.current === profileId) return;
    identified.current = profileId;

    posthog.identify(profileId, {
      $set: { auth_provider: context.user.authProvider },
      $set_once: {
        first_sign_in_date: new Date(context.user.createdAt).toISOString(),
      },
    });
  }, [context, posthog]);
}
