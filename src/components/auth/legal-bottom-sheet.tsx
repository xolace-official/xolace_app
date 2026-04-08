import { BottomSheet } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { AppText } from '@/src/components/shared/app-text';
import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import type { LegalDocument } from './legal-content';

type Props = {
  document: LegalDocument | null;
  onClose: () => void;
};

export const LegalBottomSheet = ({ document, onClose }: Props) => {
  const isOpen = document !== null;

  const handleOpenFull = async () => {
    if (!document) return;
    await openBrowserAsync(document.fullUrl, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          snapPoints={['90%']}
          enableOverDrag={false}
          enableDynamicSizing={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground"
          contentContainerClassName="h-full"
        >
          <BottomSheet.Close className="absolute top-4 right-4 z-10" />

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8 }}
          >
            {document && (
              <>
                <AppText
                  className="text-white/90 text-[22px] mb-6"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {document.title}
                </AppText>

                {document.sections.map((section) => (
                  <View key={section.heading} style={{ marginBottom: 20 }}>
                    <AppText
                      className="text-white/80 text-[14px] mb-1"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {section.heading}
                    </AppText>
                    <AppText
                      className="text-white/50 text-[13px] leading-6"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {section.body}
                    </AppText>
                  </View>
                ))}

                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <AppText
                    className="text-white/30 text-[12px] text-center"
                    style={{ fontFamily: 'Poppins-Regular' }}
                    onPress={handleOpenFull}
                  >
                    This is a summary.{' '}
                    <AppText
                      className="text-white/50 text-[12px]"
                      style={{ textDecorationLine: 'underline' }}
                    >
                      Read the full version at xolaceinc.com
                    </AppText>
                  </AppText>
                </View>
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
