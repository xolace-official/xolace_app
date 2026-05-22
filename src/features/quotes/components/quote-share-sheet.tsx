import { Modal, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback, useThemeColor, useToast } from "heroui-native";
import { SymbolView } from "expo-symbols";
import * as Sharing from "expo-sharing";
import * as SMS from "expo-sms";
import { AppText } from "@/src/components/shared/app-text";
import { Presets } from "react-native-pulsar";
import { QuickAction } from "./quick-action";
import { SocialIcon } from "./social-icon";

type Props = {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
};

const SOCIAL_ITEMS = [
  { label: "WhatsApp", ios: "bubble.left.fill", android: "chat" },
  { label: "Messages", ios: "message.fill", android: "sms" },
  { label: "Instagram", ios: "camera.fill", android: "photo_camera" },
  { label: "More", ios: "ellipsis", android: "more_horiz" },
] as const;

export function QuoteShareSheet({ visible, imageUri, onClose }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const foregroundColor = useThemeColor("foreground") as string;
  const backgroundColor = useThemeColor("background") as string;
  const surfaceColor = useThemeColor("surface") as string;
  const accentColor = useThemeColor("accent") as string;
  const { toast } = useToast();

  const previewWidth = width * 0.72;
  const previewHeight = previewWidth * (16 / 9);

  const shareImage = async () => {
    Presets.flick();
    if (!imageUri) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(imageUri, { mimeType: "image/png", UTI: "public.png" });
      } else {
        toast.show({ label: "Sharing not available", variant: "default" });
      }
    } catch {
      toast.show({ label: "Couldn't share image", description: "Something went wrong. Try again.", variant: "default" });
    }
  };

  const shareViaMessages = async () => {
    Presets.flick();
    if (!imageUri) return;
    try {
      const available = await SMS.isAvailableAsync();
      if (available) {
        await SMS.sendSMSAsync([], "", {
          attachments: { uri: imageUri, mimeType: "image/png", filename: "quote.png" },
        });
      } else {
        await shareImage();
      }
    } catch {
      toast.show({ label: "Couldn't open Messages", description: "Try sharing another way.", variant: "default" });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: `${backgroundColor}F2` }}>
        {/* Gradient layers — give GlassView content to refract */}
        <LinearGradient
          colors={[`${accentColor}18`, "transparent"]}
          start={[0, 0]}
          end={[1, 0.4]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160 }}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", `${accentColor}22`]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 260 }}
          pointerEvents="none"
        />

        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: top + 16, paddingBottom: 20 }}
        >
          <PressableFeedback onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <GlassView
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${foregroundColor}0D`,
              }}
              glassEffectStyle="clear"
            >
              <SymbolView
                name={{ ios: "xmark", android: "close" }}
                size={15}
                tintColor={`${foregroundColor}70`}
              />
            </GlassView>
          </PressableFeedback>
          <AppText className="text-sm font-medium" style={{ color: `${foregroundColor}60` }}>
            Share
          </AppText>
          <View style={{ width: 40 }} />
        </View>

        {/* Image preview */}
        <View className="items-center">
          <View
            style={{
              width: previewWidth,
              height: previewHeight,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: surfaceColor,
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <AppText className="text-xs" style={{ color: `${foregroundColor}40` }}>
                  Preparing…
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Quick actions */}
        <View className="flex-row justify-center gap-8" style={{ marginTop: 28 }}>
          <QuickAction
            iosIcon="square.and.arrow.down"
            androidIcon="save_alt"
            label="Save"
            foregroundColor={foregroundColor}
            onPress={shareImage}
          />
          <QuickAction
            iosIcon="square.and.arrow.up"
            androidIcon="share"
            label="Share"
            foregroundColor={foregroundColor}
            onPress={shareImage}
          />
        </View>

        {/* Social row */}
        <View
          className="flex-row justify-center gap-6"
          style={{ marginTop: 28, paddingBottom: bottom + 40 }}
        >
          {SOCIAL_ITEMS.map((item) => (
            <SocialIcon
              key={item.label}
              label={item.label}
              ios={item.ios}
              android={item.android}
              foregroundColor={foregroundColor}
              onPress={item.label === "Messages" ? shareViaMessages : shareImage}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}
