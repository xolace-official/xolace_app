import { Image, Modal, Share, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { Presets } from "react-native-pulsar";

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

  const previewWidth = width * 0.72;
  const previewHeight = previewWidth * (16 / 9);

  const handleShare = async () => {
    if (!imageUri) return;
    Presets.flick();
    try {
      await Share.share({ url: imageUri });
    } catch {
      // dismissed
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
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: top + 16, paddingBottom: 20 }}
        >
          <PressableFeedback onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${foregroundColor}0D` }}
            >
              <SymbolView
                name={{ ios: "xmark", android: "close" }}
                size={15}
                tintColor={`${foregroundColor}70`}
              />
            </View>
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
                resizeMode="cover"
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
            surfaceColor={surfaceColor}
            onPress={handleShare}
          />
          <QuickAction
            iosIcon="square.and.arrow.up"
            androidIcon="share"
            label="Share"
            foregroundColor={foregroundColor}
            surfaceColor={surfaceColor}
            onPress={handleShare}
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
              surfaceColor={surfaceColor}
              onPress={handleShare}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function QuickAction({
  iosIcon,
  androidIcon,
  label,
  foregroundColor,
  surfaceColor,
  onPress,
}: {
  iosIcon: string;
  androidIcon: string;
  label: string;
  foregroundColor: string;
  surfaceColor: string;
  onPress: () => void;
}) {
  return (
    <PressableFeedback onPress={onPress} accessibilityLabel={label} hitSlop={8}>
      <View className="items-center gap-2">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: surfaceColor }}
        >
          <SymbolView
            name={{ ios: iosIcon as any, android: androidIcon as any }}
            size={22}
            tintColor={`${foregroundColor}70`}
          />
        </View>
        <AppText className="text-xs" style={{ color: `${foregroundColor}50` }}>
          {label}
        </AppText>
      </View>
    </PressableFeedback>
  );
}

function SocialIcon({
  label,
  ios,
  android,
  foregroundColor,
  surfaceColor,
  onPress,
}: {
  label: string;
  ios: string;
  android: string;
  foregroundColor: string;
  surfaceColor: string;
  onPress: () => void;
}) {
  return (
    <PressableFeedback onPress={onPress} accessibilityLabel={`Share via ${label}`} hitSlop={8}>
      <View className="items-center gap-2">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: `${foregroundColor}08`, borderWidth: 1, borderColor: `${foregroundColor}10` }}
        >
          <SymbolView
            name={{ ios: ios as any, android: android as any }}
            size={18}
            tintColor={`${foregroundColor}50`}
          />
        </View>
        <AppText className="text-xs" style={{ color: `${foregroundColor}40`, fontSize: 10 }}>
          {label}
        </AppText>
      </View>
    </PressableFeedback>
  );
}
