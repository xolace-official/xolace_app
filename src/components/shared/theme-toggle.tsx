import { Ionicons } from '@expo/vector-icons';

import AntDesign from '@expo/vector-icons/AntDesign';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { cn } from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';
import { type FC } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { useAppTheme } from '@/src/context/app-theme-context';

const StyledIonicons = withUniwind(Ionicons);
const StyledAntDesign = withUniwind(AntDesign);

export const ThemeToggle: FC = () => {
  const { toggleTheme, isLight } = useAppTheme();

  const isLGAvailable = isLiquidGlassAvailable();

  return (
    <TouchableOpacity
      onPressIn={() => {
        playSoftPress();
      }}
      onPressOut={() => {
        toggleTheme();
      }}
      className={cn('p-3 z-50', isLGAvailable && 'px-2.5 py-2')}
      hitSlop={12}
      activeOpacity={0.8}
    >
      {isLight ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <StyledAntDesign name="moon" size={20} className="text-foreground" />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <StyledIonicons name="sunny" size={20} className="text-foreground" />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};
