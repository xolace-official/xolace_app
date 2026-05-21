import { useEffect, useRef, useState } from "react";
import { ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { captureRef } from "react-native-view-shot";
import { PressableFeedback, Separator, SkeletonGroup, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { QuoteCard } from "@/src/features/quotes/components/quote-card";
import { SharingCard } from "@/src/features/quotes/components/sharing-card";
import { PreferenceSetupSheet } from "@/src/features/quotes/components/preference-setup-sheet";
import { useQuoteNotifications } from "@/src/features/quotes/hooks/use-quote-notifications";
import { Presets } from "react-native-pulsar";

const ENTRANCE = {
  type: "timing" as const,
  duration: 400,
  easing: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export function QuotesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground") as string;

  const todayQuotes = useQuery(api.dailyQuotes.getToday);
  const quotePrefs = useQuery(api.preferences.getQuotePreferences);
  const coldStart = useAction(api.dailyQuotes.coldStart);
  const reactToQuote = useMutation(api.dailyQuotes.react);
  const clearReaction = useMutation(api.dailyQuotes.clearReaction);

  const { state: notifState, scheduleNotification } = useQuoteNotifications();

  const sharingCardRef = useRef<View>(null);
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [showSharingCard, setShowSharingCard] = useState(false);

  const [isColdStarting, setIsColdStarting] = useState(false);
  const [coldStartError, setColdStartError] = useState(false);

  const isLoading = todayQuotes === undefined || quotePrefs === undefined;
  const displayedQuote = todayQuotes?.session ?? todayQuotes?.curated ?? null;
  const showNudge = !isLoading && todayQuotes?.session === null && displayedQuote !== null;
  const isFirstVisit = !isLoading && quotePrefs === null;
  const needsColdStart =
    !isLoading && !isFirstVisit && displayedQuote === null && !isColdStarting && !coldStartError;

  useEffect(() => {
    if (!needsColdStart) return;
    setIsColdStarting(true);
    coldStart()
      .catch(() => setColdStartError(true))
      .finally(() => setIsColdStarting(false));
  }, [needsColdStart]);

  const handlePrefsComplete = async (
    themes: string[],
    notifEnabled: boolean,
    notifTime?: string
  ) => {
    await scheduleNotification(themes, notifEnabled, notifTime);
    setIsColdStarting(true);
    coldStart()
      .catch(() => setColdStartError(true))
      .finally(() => setIsColdStarting(false));
  };

  const handleReact = async (reaction: "resonates" | "not_today" | null | undefined) => {
    if (!displayedQuote) return;
    if (!reaction) {
      await clearReaction({ quoteId: displayedQuote._id });
    } else {
      await reactToQuote({ quoteId: displayedQuote._id, reaction });
    }
  };

  const handleShare = async () => {
    if (!displayedQuote || isSharingLoading) return;
    setIsSharingLoading(true);
    setShowSharingCard(true);
    await new Promise((r) => setTimeout(r, 120));
    try {
      const uri = await captureRef(sharingCardRef, { format: "png", quality: 1 });
      await Share.share({ url: uri });
    } catch {
      // User dismissed share sheet — silent
    } finally {
      setIsSharingLoading(false);
      setShowSharingCard(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <AppText className="text-base font-medium text-foreground/60">Today</AppText>
        <PressableFeedback
          onPress={() => {
            Presets.flick();
            router.back();
          }}
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close" }}
            size={18}
            tintColor={`${foregroundColor}60`}
          />
        </PressableFeedback>
      </View>

      <Separator />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* First-visit: preference setup takes whole screen */}
        {isFirstVisit && (
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={ENTRANCE}
            className="min-h-96"
          >
            <PreferenceSetupSheet
              onComplete={handlePrefsComplete}
              isLoading={notifState === "requesting" || isColdStarting}
            />
          </EaseView>
        )}

        {/* Loading skeleton */}
        {!isFirstVisit && (isLoading || isColdStarting) && (
          <SkeletonGroup isLoading isSkeletonOnly>
            <View className="gap-4">
              <SkeletonGroup.Item className="h-4 w-32 rounded-full" />
              <SkeletonGroup.Item className="h-32 rounded-2xl" />
              <View className="flex-row gap-3">
                <SkeletonGroup.Item className="h-11 w-32 rounded-full" />
                <SkeletonGroup.Item className="h-11 w-28 rounded-full" />
              </View>
            </View>
          </SkeletonGroup>
        )}

        {/* Inline error */}
        {coldStartError && !isColdStarting && (
          <AppText className="text-xs text-foreground/40 mt-2">
            Something went wrong. Pull to refresh.
          </AppText>
        )}

        {/* Quote card */}
        {!isFirstVisit && !isLoading && !isColdStarting && displayedQuote && (
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={ENTRANCE}
          >
            <QuoteCard
              quoteId={displayedQuote._id}
              text={displayedQuote.text}
              type={displayedQuote.type}
              reaction={displayedQuote.reaction}
              onReact={handleReact}
              onShare={handleShare}
              isSharingLoading={isSharingLoading}
            />
            {showNudge && (
              <AppText className="text-xs text-foreground/40 mt-4">
                Try a session for a more personal quote.
              </AppText>
            )}
          </EaseView>
        )}

        {/* Notification denied */}
        {notifState === "denied" && (
          <AppText className="text-xs text-foreground/40 mt-2">
            You can enable notifications in Settings anytime.
          </AppText>
        )}
      </ScrollView>

      {/* Off-screen sharing card for capture */}
      {showSharingCard && displayedQuote && (
        <View
          style={{
            position: "absolute",
            top: -10000,
            left: 0,
            pointerEvents: "none",
          }}
        >
          <SharingCard ref={sharingCardRef} text={displayedQuote.text} />
        </View>
      )}
    </View>
  );
}
