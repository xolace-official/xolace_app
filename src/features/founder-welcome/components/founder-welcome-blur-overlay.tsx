import { useBottomSheet, useBottomSheetAnimation } from 'heroui-native';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useDerivedValue } from 'react-native-reanimated';
import { useAppTheme } from '@/src/context/app-theme-context';
import { AnimatedBlurView } from '@/src/components/animated-blur-view';

const AnimatedView = Animated.createAnimatedComponent(View);

export const FounderWelcomeBlurOverlay = () => {
  const { isDark } = useAppTheme();
  const { isOpen } = useBottomSheet();
  const { progress } = useBottomSheetAnimation();

  const blurIntensity = useDerivedValue(() => {
    return interpolate(progress.get(), [0, 1, 2], [0, 70, 0]);
  });

  if (!isOpen) return null;

  return (
    <AnimatedView style={StyleSheet.absoluteFill} pointerEvents="auto">
      <AnimatedBlurView
        blurIntensity={blurIntensity}
        tint={isDark ? 'dark' : 'systemUltraThinMaterialDark'}
        style={StyleSheet.absoluteFill}
      />
    </AnimatedView>
  );
};
