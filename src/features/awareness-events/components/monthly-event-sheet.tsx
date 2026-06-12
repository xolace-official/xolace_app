import { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomSheet, PressableFeedback, Skeleton } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
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

  // Reset image state when a new event arrives
  useEffect(() => {
    if (event?.imageUrl) {
      setImageLoading(true);
      setImageFailed(false);
    }
  }, [event?.slug, event?.imageUrl]);

  useEffect(() => {
    if (event) {
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) handleDismiss(); }}
    >
      <BottomSheet.Portal>
        {/* No overlay — card floats above the live home screen */}
        <BottomSheet.Content
          detached={true}
          bottomInset={insets.bottom + 12}
          snapPoints={[screenHeight * 0.75]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          enableOverDrag={false}
          className="mx-4"
          backgroundClassName="rounded-[32px] bg-overlay"
          handleIndicatorClassName="opacity-0"
          accessibilityViewIsModal
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

          {/* Scrollable title + body */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, paddingTop: showImage ? 16 : 24 }}
          >
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
          </BottomSheetScrollView>

          {/* Pinned actions */}
          <View className="px-5 pt-3 pb-5 gap-1">
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
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
