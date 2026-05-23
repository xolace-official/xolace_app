import RNShare, { Social } from "react-native-share";
import * as Sharing from "expo-sharing";
import { useToast } from "heroui-native";
import { Presets } from "react-native-pulsar";

// Required for Instagram Stories since Jan 2023.
// Set EXPO_PUBLIC_FB_APP_ID in your .env to enable Stories sharing.
const FB_APP_ID = process.env.EXPO_PUBLIC_FB_APP_ID ?? "";

export function useQuoteShareActions(imageUri: string | null) {
  const { toast } = useToast();

  const shareGeneric = async () => {
    if (!imageUri) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(imageUri, {
          mimeType: "image/png",
          UTI: "public.png",
        });
      } else {
        toast.show({ label: "Sharing not available", variant: "default" });
      }
    } catch {
      toast.show({
        label: "Couldn't share image",
        description: "Something went wrong. Try again.",
        variant: "default",
      });
    }
  };

  const shareViaWhatsApp = async () => {
    Presets.flick();
    if (!imageUri) return;
    try {
      await RNShare.shareSingle({
        social: Social.Whatsapp,
        url: imageUri,
        type: "image/png",
        });
    } catch {
      await shareGeneric();
    }
  };

  const shareViaTelegram = async () => {
    Presets.flick();
    if (!imageUri) return;
    try {
      await RNShare.shareSingle({
        social: Social.Telegram,
        url: imageUri,
        type: "image/png",
        });
    } catch {
      await shareGeneric();
    }
  };

  const shareViaInstagram = async () => {
    Presets.flick();
    if (!imageUri) return;
    try {
      if (FB_APP_ID) {
        await RNShare.shareSingle({
          social: Social.InstagramStories,
          backgroundImage: imageUri,
          appId: FB_APP_ID,
            });
      } else {
        // Fall back to Instagram feed share when no FB App ID is configured
        await RNShare.shareSingle({
          social: Social.Instagram,
          url: imageUri,
          type: "image/*",
            });
      }
    } catch {
      await shareGeneric();
    }
  };

  const shareMore = async () => {
    Presets.flick();
    await shareGeneric();
  };

  return { shareViaWhatsApp, shareViaTelegram, shareViaInstagram, shareMore };
}
