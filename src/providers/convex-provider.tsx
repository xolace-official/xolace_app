"use client";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { tokenCache } from "@clerk/expo/token-cache";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

/**
 * This component is marked as @unmemoized because it passes a hook reference (`useAuth`)
 * as a prop to `ConvexProviderWithClerk`. The React Compiler forbids passing hooks as 
 * normal values, but this is the standard pattern required by the Convex/Clerk integration.
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
