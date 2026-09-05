import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { EaseView } from "react-native-ease/uniwind";
import { Presets } from "react-native-pulsar";
import { ActionRow } from "@/src/features/quotes/components/poster/action-row";
import { HeartBurst, useHeartBurst } from "@/src/features/quotes/components/heart-burst";
import { HeroCard } from "@/src/features/quotes/components/poster/hero-card";
import { PosterBody } from "@/src/features/quotes/components/poster/poster-body";
import { PosterSourceLine } from "@/src/features/quotes/components/poster/poster-source-line";
import { PreferenceSetupSheet } from "@/src/features/quotes/components/preference-setup-sheet";
import { QuoteLoadingAndError } from "@/src/features/quotes/components/quote-loading-and-error";
import { QuoteShareSheet } from "@/src/features/quotes/components/quote-share-sheet";
import { SharingCard } from "@/src/features/quotes/components/sharing-card";
import { useQuoteSharing } from "@/src/features/quotes/hooks/use-quote-sharing";
import { useTodayQuote } from "@/src/features/quotes/hooks/use-today-quote";
import { removeEmDash } from "@/src/features/quotes/utils/text-utils";
import { usePaywall } from "@/src/features/purchases/use-paywall";

const EASE_INITIAL = { opacity: 0, translateY: 20 };
const EASE_ANIMATE = { opacity: 1, translateY: 0 };
const EASE_TRANSITION = {
  type: "timing" as const,
  duration: 400,
  easing: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export function QuotesScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const openPaywall = usePaywall((s) => s.open);

  const {
    quote,
    sourceLine,
    isFirstVisit,
    isColdStarting,
    coldStartError,
    isCompletingPreferences,
    retry,
    react,
    completePreferences,
  } = useTodayQuote();

  const {
    handleShare,
    onSharingCardLayout,
    onSharingCardImageLoadEnd,
    sharingCardRef,
    isSharingLoading,
    showSharingCard,
    showShareSheet,
    setShowShareSheet,
    shareImageUri,
    setShareImageUri,
  } = useQuoteSharing(quote);

  const heartBurst = useHeartBurst();

  // the burst fires on the way *to* resonating, never on clearing it
  const handleReact = (next: "resonates" | null) => {
    if (next === "resonates") heartBurst.trigger();
    void react(next);
  };

  const goBack = () => {
    Presets.flick();
    router.back();
  };

  // First visit is its own themed takeover — no hero behind it.
  if (isFirstVisit) {
    return (
      <>
        <StatusBar hidden />
        <View className="flex-1 bg-background">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24, paddingTop: top + 24, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <EaseView
              initialAnimate={EASE_INITIAL}
              animate={EASE_ANIMATE}
              transition={EASE_TRANSITION}
            >
              <PreferenceSetupSheet
                onComplete={completePreferences}
                isLoading={isCompletingPreferences}
              />
            </EaseView>
          </ScrollView>
        </View>
      </>
    );
  }

  const hasQuote = quote !== null && sourceLine !== null && !isColdStarting;

  return (
    <>
      <StatusBar hidden />
      <View className="flex-1 bg-background">
        <HeartBurst scale={heartBurst.scale} opacity={heartBurst.opacity} />
        <KeyboardAwareScrollView
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <HeroCard
            onBack={goBack}
            actions={
              hasQuote ? (
                <ActionRow
                  resonates={quote.reaction === "resonates"}
                  isSharingLoading={isSharingLoading}
                  onShare={handleShare}
                  onReact={handleReact}
                />
              ) : (
                // holds the row's space so the hero does not grow when the
                // quote lands — the poster box is only half of that promise
                <View className="mt-4 h-12" />
              )
            }
          >
            {hasQuote ? (
              <>
                <PosterSourceLine
                  line={sourceLine}
                  onUnlock={() => openPaywall("daily_quote")}
                />
                <PosterBody title={quote.title} body={removeEmDash(quote.text)} />
              </>
            ) : (
              <QuoteLoadingAndError
                coldStartError={coldStartError && !isColdStarting}
                onRetry={retry}
              />
            )}
          </HeroCard>
        </KeyboardAwareScrollView>

        <QuoteShareSheet
          visible={showShareSheet}
          imageUri={shareImageUri}
          quoteType={quote?.type ?? "curated"}
          onClose={() => {
            setShowShareSheet(false);
            setShareImageUri(null);
          }}
        />

        {/* Off-screen sharing card for capture */}
        {showSharingCard && quote && (
          <View
            style={styles.offscreen}
            pointerEvents="none"
            onLayout={onSharingCardLayout}
          >
            <SharingCard
              ref={sharingCardRef}
              text={removeEmDash(quote.text)}
              onMascotLoadEnd={onSharingCardImageLoadEnd}
            />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: "absolute", top: -10000, left: 0 },
});
