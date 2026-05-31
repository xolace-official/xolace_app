/**
 * Native tab bar for iOS and Android using expo-router's NativeTabs.
 * Renders platform-native tab bars with SF Symbols (iOS) and Material icons (Android).
 *
 * Tab configuration is driven by the TABS array in src/constants/tabs.ts.
 * The web version of this component is in app-tabs.web.tsx (Expo platform extension).
 *
 * To customize: edit TABS in constants/tabs.ts to add/remove/reorder tabs.
 */
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/src/lib/theme";
import { TABS } from "@/src/lib/tabs";
import { playSoftPress } from "@/src/lib/haptics";

const TABS_WITH_NATIVE_ICONS = TABS.map((tab) => ({
  ...tab,
  nativeSfIcon: { default: tab.icon.sf, selected: tab.icon.selected },
}));

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  const labelStyle = { selected: { color: colors.text } };

  const screenListeners = {
    tabPress: () => {
      playSoftPress();
    },
  };

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={labelStyle}
      screenListeners={screenListeners}
    >
      {TABS_WITH_NATIVE_ICONS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.nativeSfIcon} md={tab.icon.md} />
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
          src={require('@/src/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

*/
