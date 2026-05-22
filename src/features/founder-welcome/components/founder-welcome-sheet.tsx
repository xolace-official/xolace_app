import { BottomSheet, PressableFeedback } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';
//import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { FounderWelcomeBlurOverlay } from '@/src/features/founder-welcome/components/founder-welcome-blur-overlay';
import { Image } from 'expo-image';


type Segment = { text: string; highlight?: true };

const PARAGRAPHS: Segment[][] = [
  [
    { text: "We built Xolace for the feeling most of us never talk about; that heavy, unnamed thing sitting in your chest that isn't bad enough for therapy but won't leave you alone either. This is the space we wished existed." },
  ],
  [
    { text: "When you open this, just write what's actually going on, raw, unfiltered, even if it doesn't make sense yet. " },
    { text: "The more honest, the clearer it gets.", highlight: true },
  ],
  [
    { text: "We know how much it takes to trust something new with the feelings you've spent years burying or brushing past. We don't take that lightly. " },
    { text: "Earning that trust is the whole job.", highlight: true },
  ],
  [
    { text: "And long term; we're not building AI to replace the people in your life. We're building it to help you get clear enough to actually reach them." },
  ],
  [
    { text: "We'd love to walk this journey with you. You can reach me anytime at " },
    { text: "nathan@xolaceinc.com or +233-55-821-8741", highlight: true },
    { text: " via email or WhatsApp/SMS." },
  ],
];

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
};

export const FounderWelcomeSheet = ({ isOpen, onDismiss }: Props) => {
  // const { height: SCREEN_HEIGHT } = useWindowDimensions();
  //const { bottom: safeBottom } = useSafeAreaInsets();
  // const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 1660);

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onDismiss(); }}
    >
      <BottomSheet.Portal>
        <FounderWelcomeBlurOverlay />
        <BottomSheet.Content
          snapPoints={["90%"]}
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
            <Image
              source={require('@/assets/images/founder-images/Nathan-mini.jpeg')}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              contentPosition={"top"}
            />
          </View>

          {/* Scrollable letter */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <AppText style={styles.greeting} className="text-foreground text-lg">
              hey friend, I&apos;m Nathaniel, Xolace&apos;s CEO.
            </AppText>

            {PARAGRAPHS.map((segments, i) => (
              <AppText
                key={i}
                style={[styles.paragraph, i < PARAGRAPHS.length - 1 && styles.paragraphGap]}
                className="text-foreground/80 text-sm"
              >
                {segments.map((seg, j) =>
                  seg.highlight ? (
                    <AppText key={j} style={styles.highlight} className="text-accent">
                      {seg.text}
                    </AppText>
                  ) : (
                    seg.text
                  )
                )}
              </AppText>
            ))}

            <View style={styles.signatureBlock}>
              <AppText style={styles.signatureClosing} className="text-foreground/60">
                with care,
              </AppText>
              {/* Placeholder — swap for expo-image with founder-signature.png when asset is ready */}
              <AppText style={styles.signatureName} className="text-foreground/50">
                Nathaniel & the Xolace team ♡
              </AppText>
            </View>
          </BottomSheetScrollView>

          {/* Pinned CTA */}
          <View style={[styles.ctaContainer, { paddingBottom: 10 }]}>
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
    overflow: 'hidden',
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
    paddingTop: 70,
    paddingBottom: 24,
  },
  greeting: {
    fontFamily: 'Poppins-Light',
    marginBottom: 15,
  },
  paragraph: {
    fontFamily: 'Poppins-Regular',
    lineHeight: 26,
  },
  paragraphGap: {
    marginBottom: 16,
  },
  highlight: {
    fontFamily: 'Poppins-Medium',
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
