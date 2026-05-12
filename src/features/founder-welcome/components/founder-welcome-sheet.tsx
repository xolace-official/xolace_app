import { BottomSheet, PressableFeedback } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { View, useWindowDimensions } from 'react-native';
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
  console.log("SHEET_HEIGHT ", SHEET_HEIGHT)

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
          {/* Founder photo placeholder — centered, overlapping top edge */}
          <View
            style={{
              position: 'absolute',
              top: -36,
              alignSelf: 'center',
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#2a2a2a',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            accessibilityLabel="Nathaniel, Founder of Xolace"
          >
            <AppText
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 24,
              }}
              className='text-foreground'
            >
              N
            </AppText>
          </View>

          {/* Scrollable letter body */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingTop: 52,
              paddingBottom: 24,
            }}
          >
            <AppText
              style={{
                fontFamily: 'Poppins-Light',
                marginBottom: 20,
              }}
              className="text-foreground text-2xl"
            >
              hey.
            </AppText>

            {PARAGRAPHS.map((text, i) => (
              <AppText
                key={i}
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: 15,
                  lineHeight: 26,
                  marginBottom: i < PARAGRAPHS.length - 1 ? 16 : 0,
                }}
                className="text-foreground/80"
              >
                {text}
              </AppText>
            ))}

            {/* Signature area */}
            <View style={{ paddingTop: 24 }}>
              <AppText
                style={{ fontFamily: 'Poppins-Italic', fontSize: 14 }}
                className="text-foreground/60"
              >
                with care,
              </AppText>
              {/* Signature placeholder — replace with founder-signature.png asset */}
              <AppText
                style={{
                  fontFamily: 'Poppins-Light',
                  fontSize: 18,
                  marginTop: 6,
                  letterSpacing: 1,
                }}
                className="text-foreground/50"
              >
                Nathaniel ♡
              </AppText>
            </View>
          </BottomSheetScrollView>

          {/* Pinned CTA — outside scroll zone */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: Math.max(safeBottom, 24),
            }}
          >
            <PressableFeedback
              onPress={onDismiss}
              style={{
                height: 52,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="bg-accent"
              accessibilityLabel="I'm ready"
              accessibilityRole="button"
            >
              <AppText
                style={{ fontFamily: 'Poppins-Medium', fontSize: 16, color: '#fff' }}
              >
                I'm ready
              </AppText>
            </PressableFeedback>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
