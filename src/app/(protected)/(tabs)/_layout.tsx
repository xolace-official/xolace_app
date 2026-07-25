import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColor } from 'heroui-native';

/**
 * Tab surface — a sibling stack entry to the reflect (index) screen, not the
 * app entry. Reached via `router.replace('/discovery')` from the idle menu so
 * reflect stays the permanent "/" landing with no back-stack accumulation.
 */
export default function TabsLayout() {
  const background = useThemeColor('background');
  const accent = useThemeColor('accent');

  return (
    <NativeTabs backgroundColor={background} tintColor={accent}>
      <NativeTabs.Trigger name="discovery">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'safari', selected: 'safari.fill' }}
          md="explore"
        />
        <NativeTabs.Trigger.Label>Discovery</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* Route name stays "check-in" (no route rename per design review);
          only the label/icon/content changed when Listener Chat landed here. */}
      <NativeTabs.Trigger name="check-in">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          md="forum"
        />
        <NativeTabs.Trigger.Label>Connect</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
