import { Linking } from "react-native";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { SettingsRow } from "@/src/features/settings/components/settings-row";

export const FollowUsSection = () => (
  <SettingsSection title="Follow Us">
    <SettingsRow
      variant="chevron"
      label="Website"
      onPress={() => Linking.openURL("https://xolaceinc.com").catch(console.error)}
    />
    <SettingsRow
      variant="chevron"
      label="Instagram"
      onPress={() => Linking.openURL("https://www.instagram.com/xolaceinc").catch(console.error)}
    />
    <SettingsRow
      variant="chevron"
      label="TikTok"
      onPress={() => Linking.openURL("https://www.tiktok.com/@talk.with.xolace").catch(console.error)}
    />
    <SettingsRow
      variant="chevron"
      label="LinkedIn"
      onPress={() => Linking.openURL("https://www.linkedin.com/company/xolace-inc/").catch(console.error)}
    />
    <SettingsRow
      variant="chevron"
      label="Snapchat"
      onPress={() => Linking.openURL("https://snapchat.com/t/ooayya7k").catch(console.error)}
    />
    <SettingsRow
      variant="chevron"
      label="WhatsApp Channel"
      onPress={() => Linking.openURL("https://whatsapp.com/channel/0029Vb68RgXGpLHPmY1pL73s").catch(console.error)}
      isLast
    />
  </SettingsSection>
);
