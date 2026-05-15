import { useState } from 'react';
import { View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
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
      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 800, delay: 900, easing: [0.455, 0.03, 0.515, 0.955] }}
        style={{ gap: 16 }}
      >
        <AppText
          className="text-foreground/45 text-[13px] leading-6"
          style={{ textAlign: 'center', fontWeight: '300' }}
        >
          This just saves your reflections so you{'\n'}
          never lose them. We don&apos;t see your{'\n'}
          name or email. We don&apos;t post anything. Ever.
        </AppText>

        <AppText
          className="text-foreground/30 text-[11px] leading-5"
          style={{ textAlign: 'center', fontWeight: '300' }}
        >
          Xolace is not designed for crisis situations or substitute for professional mental health care.{'\n'}If you feel unsafe, contact emergency services{'\n'}or a crisis line immediately.
        </AppText>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AppText className="text-foreground/30 text-[12px]">
            By continuing you agree to the{' '}
          </AppText>
          <LinkButton size="sm" onPress={openTerms}>
            <LinkButton.Label
              className="text-foreground/60 text-[12px]"
              style={{ textDecorationLine: 'underline' }}
            >
              Terms of Service
            </LinkButton.Label>
          </LinkButton>
          <AppText className="text-foreground/30 text-[12px]">{' '}and{' '}</AppText>
          <LinkButton size="sm" onPress={openPrivacy}>
            <LinkButton.Label
              className="text-foreground/60 text-[12px]"
              style={{ textDecorationLine: 'underline' }}
            >
              Privacy Policy
            </LinkButton.Label>
          </LinkButton>
        </View>
      </EaseView>

      <LegalBottomSheet
        document={activeDocument}
        onClose={() => setActiveDocument(null)}
      />
    </>
  );
};
