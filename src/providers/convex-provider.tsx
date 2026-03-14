"use client";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { tokenCache } from "@clerk/expo/token-cache";

// Clerk's native JS bundle checks navigator.onLine before making network
// requests to mint JWTs. In React Native this property is undefined/false,
// causing getToken({ template: "convex" }) to throw "clerk_offline" even
// though the device has connectivity. Polyfill it so the check passes.
if (typeof navigator !== "undefined" && navigator.onLine === undefined) {
  Object.defineProperty(navigator, "onLine", {
    get: () => true,
    configurable: true,
  });
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

/**
 * Provides Clerk and Convex contexts configured for the app, injecting Clerk's publishable key and token cache and passing the `useAuth` hook to Convex.
 *
 * @unmemoized
 */
export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
