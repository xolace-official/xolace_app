import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColor } from 'heroui-native';
import { playSoftPress } from '@/src/lib/haptics';
import { useTabBarHidden } from '@/src/lib/tab-bar';

/**
 * Tab surface — a sibling stack entry to the reflect (index) screen, not the
 * app entry. Reached via `router.replace('/discovery')` from the idle menu so
 * reflect stays the permanent "/" landing with no back-stack accumulation.
 */
export default function AppTabs() {
  const background = useThemeColor('background');
  const accent = useThemeColor('accent');
  // Yielded to a screen raising a bottom toolbar — the two share the same strip.
  const hidden = useTabBarHidden();

  const screenListeners = {
    tabPress: () => {
      playSoftPress();
    },
  };

  return (
    <NativeTabs
      hidden={hidden}
      backgroundColor={background}
      tintColor={accent}
      disableTransparentOnScrollEdge
      screenListeners={screenListeners}
    >
      <NativeTabs.Trigger name="discovery">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'safari', selected: 'safari.fill' }}
          md="explore"
        />
        <NativeTabs.Trigger.Label>Discovery</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="connect">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          md="forum"
        />
        <NativeTabs.Trigger.Label>Connect</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
