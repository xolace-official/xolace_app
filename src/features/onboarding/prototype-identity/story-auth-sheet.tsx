/**
 * PROTOTYPE — throwaway. Ticket #198, variants D & E. Content decided by #201.
 *
 * Keeps superlist's morphing bottom pill exactly: ONE button holding two rows
 * behind `overflow-hidden`. Collapsed it reads "Pull up a seat"; as the sheet
 * expands, that row slides up and out while the second row slides in from
 * below. Superlist's second row is "Continue with email" — we have no email
 * auth, so the second row becomes the way BACK to the tale, which keeps the
 * button useful in both states instead of morphing into a dead end.
 *
 * #201: the reassurance paragraph is cut — too much text for a ~250px sheet.
 * Legal surfaces as a permanent, tappable Terms/Privacy row wired to the real
 * LegalBottomSheet, not a paragraph.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useDeckColor } from './deck-color';

import { AppText } from '@/src/components/shared/app-text';
import { LegalBottomSheet } from '@/src/features/auth/components/legal-bottom-sheet';
import { PRIVACY_POLICY, TERMS_OF_SERVICE, type LegalDocument } from '@/src/features/auth/components/legal-content';

export const StoryAuthBlock = ({
  progress,
  onCollapse,
}: {
  progress: SharedValue<number>;
  onCollapse: () => void;
}) => {
  const muted = useDeckColor('muted');
  const foreground = useDeckColor('foreground');
  const [activeDocument, setActiveDocument] = useState<LegalDocument | null>(null);

  const rStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.1, 0.8], [0, 1], Extrapolation.CLAMP),
    pointerEvents: progress.get() > 0.6 ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={rStyle}>
      <Pressable onPress={onCollapse} className="self-center mb-5 p-1">
        <SymbolView name="chevron.down" size={16} tintColor={muted} />
      </Pressable>

      <AppText
        className="text-foreground/90 text-[24px] text-center mb-7"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        The fire&apos;s already lit.
      </AppText>

      <View className="gap-3 px-6 mb-4">
        <Pressable className="flex-row h-12 items-center justify-center gap-3 rounded-full border border-border bg-surface-secondary">
          <SymbolView name="globe" size={17} tintColor={foreground} />
          <AppText className="text-foreground/90 text-[15px]">Continue with Google</AppText>
        </Pressable>
        <Pressable className="flex-row h-12 items-center justify-center gap-3 rounded-full border border-border bg-surface-secondary">
          <SymbolView name="apple.logo" size={17} tintColor={foreground} />
          <AppText className="text-foreground/90 text-[15px]">Continue with Apple</AppText>
        </Pressable>
      </View>

      <View className="flex-row justify-center gap-1">
        <Pressable onPress={() => setActiveDocument(TERMS_OF_SERVICE)}>
          <AppText className="text-foreground/40 text-[11px] underline">Terms of Service</AppText>
        </Pressable>
        <AppText className="text-foreground/40 text-[11px]"> · </AppText>
        <Pressable onPress={() => setActiveDocument(PRIVACY_POLICY)}>
          <AppText className="text-foreground/40 text-[11px] underline">Privacy Policy</AppText>
        </Pressable>
      </View>

      <LegalBottomSheet document={activeDocument} onClose={() => setActiveDocument(null)} />
    </Animated.View>
  );
};

/**
 * Superlist's two-row morph. Row one exits upward, row two enters from below,
 * both driven off the same expansion progress.
 */
export const MorphingSeatButton = ({
  progress,
  onExpand,
  onCollapse,
}: {
  progress: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
}) => {
  // The deck's CTA is the fire, not the app's violet accent — it sits beside a
  // flame glyph and says "Back to the fire".
  const ember = useDeckColor('ember');

  const rTopRow = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [0, -42], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.get(), [0, 0.7], [1, 0], Extrapolation.CLAMP),
  }));

  const rBottomRow = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [42, 0], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.get(), [0.3, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const handlePress = () => {
    if (progress.get() > 0.5) onCollapse();
    else onExpand();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ borderCurve: 'continuous' }}
      className="h-12 mx-6 mt-4 items-center justify-center rounded-full border border-ember/25 bg-ember/10 overflow-hidden"
    >
      <Animated.View className="flex-row items-center gap-2" style={rTopRow}>
        <SymbolView name="person" size={15} tintColor={ember} />
        <AppText className="text-ember text-[15px]">Pull up a seat</AppText>
      </Animated.View>
      <Animated.View className="flex-row items-center gap-2 -mt-5" style={rBottomRow}>
        <SymbolView name="flame" size={15} tintColor={ember} />
        <AppText className="text-ember text-[15px]">Back to the fire</AppText>
      </Animated.View>
    </Pressable>
  );
};
