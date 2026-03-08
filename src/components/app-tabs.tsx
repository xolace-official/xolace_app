/**
 * Native tab bar for iOS and Android using expo-router's NativeTabs.
 * Renders platform-native tab bars with SF Symbols (iOS) and Material icons (Android).
 *
 * Tab configuration is driven by the TABS array in src/constants/tabs.ts.
 * The web version of this component is in app-tabs.web.tsx (Expo platform extension).
 *
 * To customize: edit TABS in constants/tabs.ts to add/remove/reorder tabs.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';

import { Colors, TABS } from '@/constants';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: tab.icon.sf, selected: tab.icon.selected }}
            md={tab.icon.md}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}


/*
Note: If you want to use an image for the tab icon, you can use the following code:

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

*/