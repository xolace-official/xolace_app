import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppStore } from "@/src/store/store";
import { usePreferenceMutation } from "./use-preference-mutation";

export type RetentionOption = "indefinite" | "6_months" | "1_year";

export const useDataSettings = () => {
  const preferences = useQuery(api.preferences.get);
  const updatePreferences = usePreferenceMutation();
  const requestDataWipe = useMutation(api.users.requestDataWipe);
  const requestDeletion = useMutation(api.users.requestDeletion);
  const bridgeEnabled = useAppStore((s) => s.bridgeEnabled);
  const setBridgeEnabled = useAppStore((s) => s.setBridgeEnabled);

  const contributeAnonymously = preferences?.contributeByDefault ?? false;
  const retention: RetentionOption = preferences?.dataRetentionPreference ?? "indefinite";

  const retentionDisplay =
    retention === "indefinite"
      ? "Indefinite"
      : retention === "6_months"
        ? "6 months"
        : "1 year";

  const setContributeAnonymously = (v: boolean) => {
    updatePreferences({ contributeByDefault: v });
  };

  const setRetention = (value: RetentionOption) => {
    updatePreferences({ dataRetentionPreference: value });
  };

  const performDeleteData = async () => {
    await requestDataWipe();
  };

  const performDeleteAccount = async () => {
    await requestDeletion();
  };

  return {
    contributeAnonymously,
    setContributeAnonymously,
    bridgeEnabled,
    setBridgeEnabled,
    retention,
    retentionDisplay,
    setRetention,
    performDeleteData,
    performDeleteAccount,
  };
};
