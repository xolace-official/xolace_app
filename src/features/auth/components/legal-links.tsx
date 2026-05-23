import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { LinkButton } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { LegalBottomSheet } from './legal-bottom-sheet';
import { PRIVACY_POLICY, TERMS_OF_SERVICE, type LegalDocument } from './legal-content';

const EASE_EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_INITIAL = { opacity: 0 };
const EASE_ANIMATE = { opacity: 1 };
const EASE_TRANSITION = { type: 'timing' as const, duration: 800, delay: 900, easing: EASE_EASING };

export const LegalLinks = () => {
  const [activeDocument, setActiveDocument] = useState<LegalDocument | null>(null);

  const openTerms = () => { playSoftPress(); setActiveDocument(TERMS_OF_SERVICE); };
  const openPrivacy = () => { playSoftPress(); setActiveDocument(PRIVACY_POLICY); };
  const handleClose = () => setActiveDocument(null);

  return (
    <>
      <EaseView
        initialAnimate={EASE_INITIAL}
        animate={EASE_ANIMATE}
        transition={EASE_TRANSITION}
        style={styles.container}
      >
        <AppText
          className="text-foreground/45 text-[13px] leading-6"
          style={styles.centeredLight}
        >
          This just saves your reflections so you{'\n'}
          never lose them. We don&apos;t see your{'\n'}
          name or email. We don&apos;t post anything. Ever.
        </AppText>

        <AppText
          className="text-foreground/30 text-[11px] leading-5"
          style={styles.centeredLight}
        >
          Xolace is not designed for crisis situations or substitute for professional mental health care.{'\n'}If you feel unsafe, contact emergency services{'\n'}or a crisis line immediately.
        </AppText>

        <View style={styles.linkRow}>
          <AppText className="text-foreground/30 text-[12px]">
            By continuing you agree to the{' '}
          </AppText>
          <LinkButton size="sm" onPress={openTerms}>
            <LinkButton.Label
              className="text-foreground/60 text-[12px]"
              style={styles.underline}
            >
              Terms of Service
            </LinkButton.Label>
          </LinkButton>
          <AppText className="text-foreground/30 text-[12px]">{' '}and{' '}</AppText>
          <LinkButton size="sm" onPress={openPrivacy}>
            <LinkButton.Label
              className="text-foreground/60 text-[12px]"
              style={styles.underline}
            >
              Privacy Policy
            </LinkButton.Label>
          </LinkButton>
        </View>
      </EaseView>

      <LegalBottomSheet
        document={activeDocument}
        onClose={handleClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  centeredLight: { textAlign: 'center', fontWeight: '300' },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  underline: { textDecorationLine: 'underline' },
});
