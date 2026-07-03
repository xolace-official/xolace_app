import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRevenueCat } from "./revenuecat-context";

/**
 * The single entitlement read for all gated UI — client counterpart of the
 * server's hasPremium(). Server truth (reactive: flips the instant the
 * RevenueCat webhook lands) OR'd with the local SDK state as an optimistic
 * hint covering webhook lag right after a purchase.
 */
export function usePlusEntitlement(): { isPlus: boolean; isLoading: boolean } {
  const { isAuthenticated } = useConvexAuth();
  const entitlement = useQuery(
    api.premium.getEntitlement,
    isAuthenticated ? {} : "skip",
  );
  const { isProUser, isLoading: sdkLoading } = useRevenueCat();

  return {
    isPlus: (entitlement?.isPlus ?? false) || isProUser,
    isLoading: (isAuthenticated && entitlement === undefined) || sdkLoading,
  };
}
