import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { EaseView } from "react-native-ease/uniwind";
import { api } from "@/convex/_generated/api";
import { QuoteCard } from "@/src/features/quotes/components/quote-card";
import { SharingCard } from "@/src/features/quotes/components/sharing-card";
import { PreferenceSetupSheet } from "@/src/features/quotes/components/preference-setup-sheet";
import { QuoteShareSheet } from "@/src/features/quotes/components/quote-share-sheet";
import { QuoteLoadingAndError } from "@/src/features/quotes/components/quote-loading-and-error";
import { useQuoteNotifications } from "@/src/features/quotes/hooks/use-quote-notifications";
import { useQuoteSharing } from "@/src/features/quotes/hooks/use-quote-sharing";
import { removeEmDash } from "@/src/features/quotes/utils/text-utils";
import { Presets } from "react-native-pulsar";
import { StatusBar } from "expo-status-bar";

const GRADIENT_START: [number, number] = [1, 0];
const GRADIENT_END: [number, number] = [0.4, 0.3];
const HEART_ICON = { ios: "heart.fill", android: "favorite" } as const;
const CLOSE_ICON = { ios: "xmark", android: "close" } as const;
const EASE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
const EASE_TRANSITION = { type: "timing" as const, duration: 400, easing: [0.25, 0.1, 0.25, 1] as [number, number, number, number] };

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

  const [isColdStarting, setIsColdStarting] = useState(false);
  const [coldStartError, setColdStartError] = useState(false);

  const isLoading = todayQuotes === undefined || quotePrefs === undefined;
  const displayedQuote = todayQuotes?.session ?? todayQuotes?.curated ?? null;
  const showNudge = !isLoading && todayQuotes?.session === null && displayedQuote !== null;
  const isFirstVisit = !isLoading && quotePrefs === null;
  const needsColdStart =
    !isLoading && !isFirstVisit && displayedQuote === null && !isColdStarting && !coldStartError;

  console.log(`[quotesScreen:needsColdStart] needsColdStart=${needsColdStart}`);

  const {
    handleShare,
    onSharingCardLayout,
    sharingCardRef,
    isSharingLoading,
    showSharingCard,
    showShareSheet,
    setShowShareSheet,
    shareImageUri,
    setShareImageUri,
  } = useQuoteSharing(displayedQuote);

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
    coldStart().catch((e) => {
      console.error(e);
      setColdStartError(true);
      setIsColdStarting(false);
    });
    // coldStart is a stable Convex action ref — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsColdStart]);

  useEffect(() => {
    if (displayedQuote && isColdStarting) {
      setIsColdStarting(false);
    }
  }, [displayedQuote, isColdStarting]);

  const handlePrefsComplete = async (
    themes: string[],
    notifEnabled: boolean,
    notifTime?: string
  ) => {
    await scheduleNotification(themes, notifEnabled, notifTime);
    setIsColdStarting(true);
    coldStart().catch(() => {
      setColdStartError(true);
      setIsColdStarting(false);
    });
  };

  const handleRetry = () => {
    setColdStartError(false);
    setIsColdStarting(true);
    coldStart().catch((e) => {
      console.error(e);
      setColdStartError(true);
      setIsColdStarting(false);
    });
  };

  const handleReact = async (reaction: "resonates" | "not_today" | null | undefined) => {
    if (!displayedQuote) return;
    if (!reaction) {
      await clearReaction({ quoteId: displayedQuote._id });
    } else {
      await reactToQuote({ quoteId: displayedQuote._id, reaction });
    }
  };

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const closeButtonStyle = { paddingTop: top + 12 };
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const gradientBottomColors: [string, string] = ["transparent", `${accentColor}28`];
  // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
  const gradientTopRightColors: [string, string] = [`${accentColor}20`, "transparent"];
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const glassStyle = { width: 34, height: 34, borderRadius: 17, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: `${foregroundColor}10` };
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const prefContentStyle = { padding: 24, paddingTop: top + 24, gap: 16 };

  return (
    <>
    <StatusBar hidden />
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={gradientBottomColors}
        style={styles.gradientBottom}
        pointerEvents="none"
      />
      <LinearGradient
        colors={gradientTopRightColors}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.gradientTopRight}
        pointerEvents="none"
      />

      {/* Heart burst overlay */}
      <Animated.View
        pointerEvents="none"
        // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
        style={[styles.heartBurst, heartStyle]}
      >
        <SymbolView name={HEART_ICON} size={96} tintColor={accentColor} />
      </Animated.View>

      {/* Close button */}
      <View className="absolute top-0 right-5 z-10" style={closeButtonStyle}>
        <PressableFeedback onPress={() => { Presets.flick(); router.back(); }} accessibilityLabel="Close" hitSlop={8}>
          <GlassView
            style={glassStyle}
            glassEffectStyle="clear"
          >
            <SymbolView name={CLOSE_ICON} size={14} tintColor={`${foregroundColor}70`} />
          </GlassView>
        </PressableFeedback>
      </View>

      {/* First visit — preference setup */}
      {isFirstVisit && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={prefContentStyle}
          showsVerticalScrollIndicator={false}
        >
          <EaseView
            initialAnimate={EASE_INITIAL}
            animate={EASE_ANIMATE}
            transition={EASE_TRANSITION}
          >
            <PreferenceSetupSheet
              onComplete={handlePrefsComplete}
              isLoading={notifState === "requesting" || isColdStarting}
            />
          </EaseView>
        </ScrollView>
      )}

      <QuoteLoadingAndError
        isFirstVisit={isFirstVisit}
        isLoading={isLoading}
        isColdStarting={isColdStarting}
        coldStartError={coldStartError}
        top={top}
        onRetry={handleRetry}
      />

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

      <QuoteShareSheet
        visible={showShareSheet}
        imageUri={shareImageUri}
        onClose={() => { setShowShareSheet(false); setShareImageUri(null); }}
      />

      {/* Off-screen sharing card for capture */}
      {showSharingCard && displayedQuote && (
        <View style={styles.offscreen} pointerEvents="none" onLayout={onSharingCardLayout}>
          <SharingCard ref={sharingCardRef} text={removeEmDash(displayedQuote.text)} />
        </View>
      )}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  gradientTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 140,
    height: 140,
  },
  heartBurst: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  offscreen: {
    position: "absolute",
    top: -10000,
    left: 0,
  },
});
