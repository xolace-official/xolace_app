import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomSheet, PressableFeedback, Skeleton } from 'heroui-native';
import { BottomSheetFooter, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';

import { AppText } from '@/src/components/shared/app-text';
import { useAppStore } from '@/src/store/store';
import { posthog } from '@/src/config/posthog';
import type { Doc } from '@/convex/_generated/dataModel';

const CTA_ROUTE_ALLOWLIST = ['/(protected)/crisis-resources'] as const;

type Props = {
  event: Doc<'monthlyEvents'> | null;
};

export const MonthlyEventSheet = ({ event }: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const addToSeenEventIds = useAppStore((s) => s.addToSeenEventIds);
  const setPendingEventPrompt = useAppStore((s) => s.setPendingEventPrompt);

  const [imageLoading, setImageLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const isOpen = event !== null;
  const showImage = !!(event?.imageUrl) && !imageFailed;
  const hasCta = !!(event?.ctaLabel && event?.ctaRoute);

  // Footer overlays the scroll content (gorhom footers are not part of the
  // measured content height), so we pad the scroll content by its height.
  const [footerHeight, setFooterHeight] = useState(hasCta ? 132 : 76);

  // Reset image state when a new event arrives
  useEffect(() => {
    if (event?.imageUrl) {
      setImageLoading(true);
      setImageFailed(false);
    }
  }, [event?.slug, event?.imageUrl]);

  const capturedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (event && capturedSlug.current !== event.slug) {
      capturedSlug.current = event.slug;
      posthog.capture('awareness_event_shown', { slug: event.slug });
    }
  }, [event]);

  const markSeen = (slug: string, sessionPrompt?: string) => {
    if (sessionPrompt) {
      setPendingEventPrompt({
        text: sessionPrompt,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    }
    addToSeenEventIds(slug);
  };

  const handleDismiss = () => {
    if (!event) return;
    markSeen(event.slug, event.sessionPrompt);
    posthog.capture('awareness_event_dismissed', { slug: event.slug });
  };

  const handleCta = () => {
    if (!event) return;
    markSeen(event.slug, event.sessionPrompt);
    posthog.capture('awareness_event_cta_tapped', { slug: event.slug });
    const route = event.ctaRoute;
    if (route && (CTA_ROUTE_ALLOWLIST as readonly string[]).includes(route)) {
      router.push(route as typeof CTA_ROUTE_ALLOWLIST[number]);
    }
  };

  const renderFooter = (props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props}>
      <View
        className="px-5 pt-3 pb-5 gap-1 bg-overlay rounded-b-[32px]"
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        {hasCta && (
          <PressableFeedback
            onPress={handleCta}
            className="h-[52px] bg-accent rounded-2xl items-center justify-center"
            accessibilityLabel={event!.ctaLabel}
            accessibilityRole="button"
          >
            <AppText
              className="text-white"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 16 }}
            >
              {event!.ctaLabel}
            </AppText>
          </PressableFeedback>
        )}

        <PressableFeedback
          onPress={handleDismiss}
          className="py-3 items-center justify-center"
          accessibilityLabel="Dismiss awareness event"
          accessibilityRole="button"
        >
          <AppText
            className={hasCta ? 'text-foreground/50' : 'text-foreground/70'}
            style={{ fontFamily: 'Poppins-Regular', fontSize: 13, textAlign: 'center' }}
          >
            {hasCta ? 'Not right now' : 'I see this'}
          </AppText>
        </PressableFeedback>
      </View>
    </BottomSheetFooter>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) handleDismiss(); }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached={true}
          bottomInset={insets.bottom + 12}
          enablePanDownToClose={false}
          enableOverDrag={false}
          footerComponent={renderFooter}
          className="mx-4"
          backgroundClassName="rounded-[32px] bg-overlay overflow-hidden"
          contentContainerClassName="p-0"
          handleIndicatorClassName="opacity-0"
          accessibilityViewIsModal
        >
          {/* Cap the scrollable itself so short content keeps a snug dynamic
              height while long content scrolls under the pinned footer. */}
          <BottomSheetScrollView
            style={{ maxHeight: screenHeight * 0.75 }}
            contentContainerStyle={{ paddingBottom: footerHeight }}
            showsVerticalScrollIndicator={false}
          >
            {/* Image slot */}
            {showImage && (
              <View className="h-[180px] overflow-hidden rounded-tl-[32px] rounded-tr-[32px]">
                {imageLoading && (
                  <Skeleton className="absolute inset-x-0 top-0 h-[180px] rounded-tl-[32px] rounded-tr-[32px]" />
                )}
                <Image
                  source={{ uri: event!.imageUrl }}
                  contentFit="cover"
                  className="w-full h-[180px]"
                  accessibilityLabel={`${event!.title} — awareness event image`}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageFailed(true)}
                />
              </View>
            )}

            {/* Content */}
            <View className="px-5" style={{ paddingTop: showImage ? 16 : 24 }}>
              <AppText
                className="text-foreground text-left mb-2.5"
                style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 20, lineHeight: 28 }}
                accessibilityRole="header"
              >
                {event?.title}
              </AppText>
              <AppText
                className="text-foreground/80 text-left"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 22 }}
              >
                {event?.body}
              </AppText>
            </View>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
