"use client";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { tokenCache } from "@clerk/expo/token-cache";
import { AuthSyncGuard } from "./auth-sync-guard";
// Force navigator.onLine=true so Clerk's offline gate doesn't block JWT minting
// in React Native. Primary install is the first import in app/_layout.tsx; this
// keeps the provider correct if it is ever loaded independently. See module doc.
import "@/src/lib/clerk-online-polyfill";

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
        <AuthSyncGuard />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
