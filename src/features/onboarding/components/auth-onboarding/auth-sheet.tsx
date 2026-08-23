/**
 * The sign-in half of the screen, revealed as the deck lifts off it.
 *
 * Keeps superlist's morphing bottom pill exactly: ONE button holding two rows
 * behind `overflow-hidden`. Collapsed it reads "Pull up a seat"; as the sheet
 * expands, that row slides up and out while the second row slides in from
 * below. Superlist's second row is "Continue with email" — we have no email
 * auth, so the second row becomes the way BACK to the tale, which keeps the
 * button useful in both states instead of morphing into a dead end.
 *
 * #201: no reassurance paragraph — too much text for a ~250px sheet. Legal
 * surfaces as a permanent, tappable Terms/Privacy row wired to the real
 * LegalBottomSheet.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { Button, PressableFeedback, Spinner } from 'heroui-native';

import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { LegalBottomSheet } from '@/src/features/auth/components/legal-bottom-sheet';
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  type LegalDocument,
} from '@/src/features/auth/components/legal-content';
import { AppleIcon } from '@/src/features/auth/components/apple-icon';
import { GoogleIcon } from '@/src/features/auth/components/google-icon';
import { useProviderSignIn } from '@/src/features/auth/use-provider-sign-in';
import { useDeckColor } from './deck-color';

const SPINNER_ENTERING = FadeIn.delay(50);
/** The old AuthScreen's morph: the row springs down to a spinner-sized pill
 *  rather than swapping its contents in place. */
const BUTTON_LAYOUT = LinearTransition.springify();
/** expo-symbols takes SF Symbol names on iOS and Material names on Android;
 *  a bare SF name renders nothing at all on Android. */
const CHEVRON_ICON = { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' } as const;
const SEAT_ICON = { ios: 'person', android: 'person', web: 'person' } as const;
const FLAME_ICON = { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' } as const;
const BUTTON_CLASS =
  'flex-row h-12 items-center justify-center gap-3 rounded-full border border-border bg-surface-secondary';

export const AuthSheetBlock = ({
  progress,
  onCollapse,
}: {
  progress: SharedValue<number>;
  onCollapse: () => void;
}) => {
  const muted = useDeckColor('muted');
  const foreground = useDeckColor('foreground');
  const [activeDocument, setActiveDocument] = useState<LegalDocument | null>(null);
  const { loadingProvider, signInWithApple, signInWithGoogle } = useProviderSignIn();

  const rStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.1, 0.8], [0, 1], Extrapolation.CLAMP),
    pointerEvents: progress.get() > 0.6 ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={rStyle}>
      <PressableFeedback onPress={onCollapse} className="self-center mb-5 p-1" hitSlop={12}>
        <SymbolView name={CHEVRON_ICON} size={16} tintColor={muted} />
      </PressableFeedback>

      <AppText
        className="text-foreground/90 text-[24px] text-center mb-7"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        The fire&apos;s already lit.
      </AppText>

      <View className="gap-3 px-6 mb-4">
        <Button
          onPress={signInWithGoogle}
          variant="ghost"
          size="lg"
          isDisabled={loadingProvider !== null}
          isIconOnly={loadingProvider === 'google'}
          layout={BUTTON_LAYOUT}
          className={`${BUTTON_CLASS}${loadingProvider === 'google' ? ' self-center' : ''}`}
        >
          {loadingProvider === 'google' ? (
            <Spinner entering={SPINNER_ENTERING} color={foreground} />
          ) : (
            <>
              <GoogleIcon size={17} />
              <Button.Label className="text-foreground/90 text-[15px]">
                Continue with Google
              </Button.Label>
            </>
          )}
        </Button>
        <Button
          onPress={signInWithApple}
          variant="ghost"
          size="lg"
          isDisabled={loadingProvider !== null}
          isIconOnly={loadingProvider === 'apple'}
          layout={BUTTON_LAYOUT}
          className={`${BUTTON_CLASS}${loadingProvider === 'apple' ? ' self-center' : ''}`}
        >
          {loadingProvider === 'apple' ? (
            <Spinner entering={SPINNER_ENTERING} color={foreground} />
          ) : (
            <>
              <AppleIcon size={17} color={foreground} />
              <Button.Label className="text-foreground/90 text-[15px]">
                Continue with Apple
              </Button.Label>
            </>
          )}
        </Button>
      </View>

      <View className="flex-row justify-center gap-1">
        <Pressable
          onPress={() => setActiveDocument(TERMS_OF_SERVICE)}
          hitSlop={12}
          accessibilityRole="link"
        >
          <AppText className="text-foreground/40 text-[11px] underline">Terms of Service</AppText>
        </Pressable>
        <AppText className="text-foreground/40 text-[11px]"> · </AppText>
        <Pressable
          onPress={() => setActiveDocument(PRIVACY_POLICY)}
          hitSlop={12}
          accessibilityRole="link"
        >
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
    playSoftPress();
    if (progress.get() > 0.5) onCollapse();
    else onExpand();
  };

  return (
    <PressableFeedback
      onPress={handlePress}
      style={{ borderCurve: 'continuous' }}
      className="h-12 mx-6 mt-4 items-center justify-center rounded-full border border-ember/25 bg-ember/10 overflow-hidden"
    >
      <Animated.View className="flex-row items-center gap-2" style={rTopRow}>
        <SymbolView name={SEAT_ICON} size={15} tintColor={ember} />
        <AppText className="text-ember text-[15px]">Pull up a seat</AppText>
      </Animated.View>
      <Animated.View className="flex-row items-center gap-2 -mt-5" style={rBottomRow}>
        <SymbolView name={FLAME_ICON} size={15} tintColor={ember} />
        <AppText className="text-ember text-[15px]">Back to the fire</AppText>
      </Animated.View>
    </PressableFeedback>
  );
};
