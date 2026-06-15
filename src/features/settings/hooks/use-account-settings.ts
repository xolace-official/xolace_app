import { useQuery } from "convex/react";
import { useClerk, useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import { usePreferenceMutation } from "./use-preference-mutation";

export const useAccountSettings = () => {
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = usePreferenceMutation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();

  const signInMethod = (() => {
    if (!user) return "—";
    for (const ext of user.externalAccounts ?? []) {
      const provider = (ext.provider ?? "").toLowerCase();
      if (provider.includes("apple")) return "Apple";
      if (provider.includes("google")) return "Google";
    }
    return "Email";
  })();

  const spaceName = preferences?.spaceName;

  const setSpaceName = async (next: string | null) => {
    await updatePreferences({ spaceName: next });
  };

  const performLogout = async () => {
    posthog.capture("user_signed_out");
    posthog.reset();
    try {
      await signOut();
    } catch {
      // Clerk updates its own auth state; ignore network errors
    }
  };

  return {
    signInMethod,
    spaceName,
    setSpaceName,
    performLogout,
  };
};
