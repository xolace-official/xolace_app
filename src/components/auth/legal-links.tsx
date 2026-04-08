import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinkButton } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { LegalBottomSheet } from './legal-bottom-sheet';
import { PRIVACY_POLICY, TERMS_OF_SERVICE, type LegalDocument } from './legal-content';

export const LegalLinks = () => {
  const [activeDocument, setActiveDocument] = useState<LegalDocument | null>(null);

  const openTerms = () => { playSoftPress(); setActiveDocument(TERMS_OF_SERVICE); };
  const openPrivacy = () => { playSoftPress(); setActiveDocument(PRIVACY_POLICY); };

  return (
    <>
      <Animated.View
        entering={FadeIn.delay(900).duration(800)}
        style={{ gap: 16 }}
      >
        <AppText
          className="text-white/40 text-[13px] leading-6"
          style={{ textAlign: 'center', fontWeight: '300' }}
        >
          This just saves your reflections so you{'\n'}
          never lose them. We don&apos;t see your{'\n'}
          name or email. We don&apos;t post anything. Ever.
        </AppText>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AppText className="text-white/30 text-[12px]">
            By continuing you agree to the{' '}
          </AppText>
          <LinkButton size="sm" onPress={openTerms}>
            <LinkButton.Label
              className="text-white/50 text-[12px]"
              style={{ textDecorationLine: 'underline' }}
            >
              Terms of Service
            </LinkButton.Label>
          </LinkButton>
          <AppText className="text-white/30 text-[12px]">{' '}and{' '}</AppText>
          <LinkButton size="sm" onPress={openPrivacy}>
            <LinkButton.Label
              className="text-white/50 text-[12px]"
              style={{ textDecorationLine: 'underline' }}
            >
              Privacy Policy
            </LinkButton.Label>
          </LinkButton>
        </View>
      </Animated.View>

      <LegalBottomSheet
        document={activeDocument}
        onClose={() => setActiveDocument(null)}
      />
    </>
  );
};
