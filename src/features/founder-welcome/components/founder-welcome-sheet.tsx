import { BottomSheet, PressableFeedback } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { FounderWelcomeBlurOverlay } from './founder-welcome-blur-overlay';

const PARAGRAPHS = [
  "you found the space for feelings that don't have names yet.",
  "this isn't a chatbot or a journal. it's infrastructure for your inner life — quiet, daily, no performance required.",
  "your words are private. ephemeral. never stored, never seen, never trained on.",
  "one question. write whatever is true. let it land here.",
] as const;

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
};

export const FounderWelcomeSheet = ({ isOpen, onDismiss }: Props) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 660);

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onDismiss(); }}
    >
      <BottomSheet.Portal>
        <FounderWelcomeBlurOverlay />
        <BottomSheet.Content
          snapPoints={[SHEET_HEIGHT]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          enableOverDrag={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="opacity-0"
          contentContainerClassName="h-full"
          accessibilityViewIsModal
        >
          {/* Founder photo — floats above the sheet top edge */}
          <View
            style={styles.photoWrapper}
            className="bg-surface border-2 border-accent/50"
            accessibilityLabel="Nathaniel, Founder of Xolace"
          >
            {/* Placeholder — swap for expo-image with founder-photo.jpg when asset is ready */}
            <AppText style={styles.photoInitial} className="text-foreground">
              N
            </AppText>
          </View>

          {/* Scrollable letter */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <AppText style={styles.greeting} className="text-foreground text-xl">
              hey friend. I&apos;m Nathaniel — one of the four people who built this.
            </AppText>

            {PARAGRAPHS.map((text, i) => (
              <AppText
                key={i}
                style={[styles.paragraph, i < PARAGRAPHS.length - 1 && styles.paragraphGap]}
                className="text-foreground/80"
              >
                {text}
              </AppText>
            ))}

            <View style={styles.signatureBlock}>
              <AppText style={styles.signatureClosing} className="text-foreground/60">
                with care,
              </AppText>
              {/* Placeholder — swap for expo-image with founder-signature.png when asset is ready */}
              <AppText style={styles.signatureName} className="text-foreground/50">
                Nathaniel ♡
              </AppText>
            </View>
          </BottomSheetScrollView>

          {/* Pinned CTA */}
          <View style={[styles.ctaContainer, { paddingBottom: Math.max(safeBottom, 24) }]}>
            <PressableFeedback
              onPress={onDismiss}
              style={styles.ctaButton}
              className="bg-accent rounded-2xl"
              accessibilityLabel="I'm ready"
              accessibilityRole="button"
            >
              <AppText style={styles.ctaLabel} className="text-white">
                I&apos;m ready
              </AppText>
            </PressableFeedback>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  photoWrapper: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoInitial: {
    fontFamily: 'Poppins-Medium',
    fontSize: 24,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 56,
    paddingBottom: 24,
  },
  greeting: {
    fontFamily: 'Poppins-Light',
    marginBottom: 20,
  },
  paragraph: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    lineHeight: 26,
  },
  paragraphGap: {
    marginBottom: 16,
  },
  signatureBlock: {
    paddingTop: 24,
  },
  signatureClosing: {
    fontFamily: 'Poppins-Italic',
    fontSize: 14,
  },
  signatureName: {
    fontFamily: 'Poppins-Light',
    fontSize: 18,
    marginTop: 6,
    letterSpacing: 1,
  },
  ctaContainer: {
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  ctaButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
});
