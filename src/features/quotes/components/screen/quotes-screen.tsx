import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { captureRef } from "react-native-view-shot";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PressableFeedback, SkeletonGroup, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { QuoteCard } from "@/src/features/quotes/components/quote-card";
import { SharingCard } from "@/src/features/quotes/components/sharing-card";
import { PreferenceSetupSheet } from "@/src/features/quotes/components/preference-setup-sheet";
import { QuoteShareSheet } from "@/src/features/quotes/components/quote-share-sheet";
import { useQuoteNotifications } from "@/src/features/quotes/hooks/use-quote-notifications";
import { removeEmDash } from "@/src/features/quotes/utils/text-utils";
import { Presets } from "react-native-pulsar";
import { StatusBar } from "expo-status-bar";


export function QuotesScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground") as string;
  const accentColor = useThemeColor("accent") as string;

  const todayQuotes = useQuery(api.dailyQuotes.getToday);
  const quotePrefs = useQuery(api.preferences.getQuotePreferences);
  const coldStart = useAction(api.dailyQuotes.coldStart);
  const reactToQuote = useMutation(api.dailyQuotes.react);
  const clearReaction = useMutation(api.dailyQuotes.clearReaction);

  const { state: notifState, scheduleNotification } = useQuoteNotifications();

  const sharingCardRef = useRef<View>(null);
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [showSharingCard, setShowSharingCard] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const [isColdStarting, setIsColdStarting] = useState(false);
  const [coldStartError, setColdStartError] = useState(false);

  const isLoading = todayQuotes === undefined || quotePrefs === undefined;
  const displayedQuote = todayQuotes?.session ?? todayQuotes?.curated ?? null;
  const showNudge = !isLoading && todayQuotes?.session === null && displayedQuote !== null;
  const isFirstVisit = !isLoading && quotePrefs === null;
  const needsColdStart =
    !isLoading && !isFirstVisit && displayedQuote === null && !isColdStarting && !coldStartError;

  // Heart burst animation
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const triggerHeartBurst = () => {
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.5, { damping: 6, stiffness: 200 }),
      withDelay(180, withTiming(0, { duration: 320 }))
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 40 }),
      withDelay(350, withTiming(0, { duration: 270 }))
    );
  };

  useEffect(() => {
    if (!needsColdStart) return;
    setIsColdStarting(true);
    coldStart()
      .catch(() => setColdStartError(true))
      .finally(() => setIsColdStarting(false));
    // coldStart is a stable Convex action ref — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setShareImageUri(uri);
      setShowShareSheet(true);
    } catch {
      // silent
    } finally {
      setIsSharingLoading(false);
      setShowSharingCard(false);
    }
  };

  return (

    <>
    <StatusBar hidden />  
    <View className="flex-1 bg-background">
      {/* Heart burst overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 20,
          },
          heartStyle,
        ]}
      >
        <SymbolView
          name={{ ios: "heart.fill", android: "favorite" }}
          size={96}
          tintColor={accentColor}
        />
      </Animated.View>

      {/* Close button */}
      <View
        className="absolute top-0 right-3 z-10 p-4"
        style={{ paddingTop: top + 8 }}
      >
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
            tintColor={`${foregroundColor}50`}
          />
        </PressableFeedback>
      </View>

      {/* First visit — preference setup */}
      {isFirstVisit && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingTop: top + 24, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <EaseView
            initialAnimate={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, easing: [0.25, 0.1, 0.25, 1] }}
          >
            <PreferenceSetupSheet
              onComplete={handlePrefsComplete}
              isLoading={notifState === "requesting" || isColdStarting}
            />
          </EaseView>
        </ScrollView>
      )}

      {/* Loading skeleton */}
      {!isFirstVisit && (isLoading || isColdStarting) && (
        <View className="flex-1 justify-center px-8" style={{ paddingTop: top + 46 }}>
          <SkeletonGroup isLoading isSkeletonOnly>
            <View className="gap-5">
              <SkeletonGroup.Item className="h-1.5 w-8 rounded-full" />
              <SkeletonGroup.Item className="h-10 rounded-xl" />
              <SkeletonGroup.Item className="h-10 w-4/5 rounded-xl" />
              <SkeletonGroup.Item className="h-10 w-2/3 rounded-xl" />
            </View>
          </SkeletonGroup>
        </View>
      )}

      {/* Inline error */}
      {coldStartError && !isColdStarting && (
        <View className="flex-1 items-center justify-center">
          <AppText className="text-xs text-foreground/40">
            Something went wrong. Pull to refresh.
          </AppText>
        </View>
      )}

      {/* Immersive quote display */}
      {!isFirstVisit && !isLoading && !isColdStarting && displayedQuote && (
        <QuoteCard
          text={removeEmDash(displayedQuote.text)}
          type={displayedQuote.type}
          reaction={displayedQuote.reaction}
          onReact={handleReact}
          onShare={handleShare}
          onHeartBurst={triggerHeartBurst}
          isSharingLoading={isSharingLoading}
          showNudge={showNudge}
          top={top}
          bottom={bottom}
        />
      )}

      {/* Share sheet */}
      <QuoteShareSheet
        visible={showShareSheet}
        imageUri={shareImageUri}
        onClose={() => {
          setShowShareSheet(false);
          setShareImageUri(null);
        }}
      />

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
          <SharingCard ref={sharingCardRef} text={removeEmDash(displayedQuote.text)} />
        </View>
      )}
    </View>
    </>
  );
}
