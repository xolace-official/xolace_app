import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import type { Id } from "@/convex/_generated/dataModel";
import { QuoteStack } from "@/src/features/quotes/components/archive/quote-stack";

/** The native header supplies the back button — the profile screen's shape. */
const SCREEN_OPTIONS = {
  animation: "slide_from_bottom",
  headerShown: true,
  headerTransparent: true,
  headerTitle: "",
  headerShadowVisible: false,
  headerBackVisible: true,
  headerBackButtonDisplayMode: "minimal",
} as const;

/**
 * The archive: a themed screen holding fixed-tint cards (#305).
 *
 * Its own route, not a sheet — a bottom sheet over the poster had to arbitrate
 * its dismiss pan against a stack that is itself a vertical scroll surface, and
 * the two-stage back had to be hand-wired around Expo Router rather than
 * through it. As a screen the stack is a plain list and back is the header's.
 */
export function ArchiveScreen() {
  const { top } = useSafeAreaInsets();
  const [openId, setOpenId] = useState<Id<"daily_quotes"> | null>(null);

  // The count strip rides on `getToday` — the same query the poster's star
  // patches optimistically, so an unsave here moves it without a round trip.
  const savedCount = useQuery(api.dailyQuotes.getToday)?.savedCount ?? 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={SCREEN_OPTIONS} />

      {/* Clears the transparent header, which floats over the content. */}
      <View className="gap-1 px-[22px] pb-2" style={{ paddingTop: top + 48 }}>
        <AppText className="font-poster-display text-[22px] tracking-[1.6px] text-foreground">
          OLD QUOTES
        </AppText>
        <AppText className="font-poster-body text-[12.5px] text-foreground/60">
          {savedCount} kept
        </AppText>
      </View>

      <QuoteStack openId={openId} onToggle={setOpenId} />
    </View>
  );
}
