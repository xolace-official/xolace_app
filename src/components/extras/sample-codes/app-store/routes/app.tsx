import { Upload } from "lucide-react-native";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
} from "react-native-reanimated";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useScrollContext } from "@/src/apps/(a-c)/app-store/lib/providers/scroll-provider";
import { APP_STORE_CONSTANTS } from "@/src/apps/(a-c)/app-store/lib/constants/animation-config";
import AppImage from "@/assets/images/icon-ios.png";
import { Image } from "expo-image";
import { simulatePress } from "@/src/shared/lib/utils/simulate-press";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// app-store-header-animation 🔽

const CONTENT_DISAPPEAR_OFFSET = APP_STORE_CONSTANTS.CONTENT_DISAPPEAR_OFFSET;

export const App = () => {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { scrollY } = useScrollContext();

  // UI-thread scroll pipe: pushes ScrollView offset to shared value for header/layout consumers.
  // Keep minimal work in handler to sustain 60fps.
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(event.contentOffset.y);
    },
  });

  // Gates the large hero content visibility; starts 30px before full disappearance
  // so the header controls can cross-fade without a gap.
  const shouldShowContent = useDerivedValue(() => {
    return scrollY.get() < CONTENT_DISAPPEAR_OFFSET - 30;
  });

  // Cross-fade the hero block as we approach the header threshold.
  const appContentStyle = useAnimatedStyle(() => {
    const opacity = withTiming(shouldShowContent.get() ? 1 : 0);

    return {
      opacity,
    };
  });

  return (
    <View className="flex-1 bg-black">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: insets.bottom + 12 }}
        onScroll={scrollHandler}
        // ~60fps updates; lower values risk stutter in header blur/controls sync.
        scrollEventThrottle={16}
      >
        <Animated.View className="px-6 flex-row gap-[10px] mb-8" style={appContentStyle}>
          <Image source={AppImage} style={styles.image} />
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Make It Animated</Text>
            <Text className="text-neutral-500 text-lg">Developer Tools</Text>
            <View className="flex-row justify-between mt-auto">
              <Pressable className="bg-blue-600 rounded-full px-4 py-1" onPress={simulatePress}>
                <Text className="text-white text-lg font-bold">Open</Text>
              </Pressable>
              <Upload size={24} color="#007AFF" />
            </View>
          </View>
        </Animated.View>

        <View className="px-5 pt-3">
          {/* Rating section */}
          <View className="flex-row mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="flex-1 items-center">
                <View className="p-2 w-[70] mb-2 bg-neutral-900 rounded-lg" />
                <View className="p-1 w-[50] bg-neutral-900 rounded-lg" />
              </View>
            ))}
          </View>

          {/* What's New section */}
          <View className="mb-8">
            <View className="p-2 w-[120] mb-3 bg-neutral-900 rounded-lg" />
            <View className="p-1.5 w-full mb-2 bg-neutral-900 rounded-lg" />
            <View className="p-1.5 w-full mb-2 bg-neutral-900 rounded-lg" />
            <View className="p-1.5 w-[180] bg-neutral-900 rounded-lg" />
          </View>

          {/* Preview section */}
          <View className="mb-8">
            <View className="p-2 w-[100] mb-3 bg-neutral-900 rounded-lg" />
            <View className="flex-row gap-3">
              <View className="w-[220] h-[400] bg-neutral-900 rounded-2xl" />
              <View className="w-[220] h-[400] bg-neutral-900 rounded-2xl" />
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <View className="p-1.5 w-full mb-2 bg-neutral-900 rounded-lg" />
            <View className="p-1.5 w-full mb-2 bg-neutral-900 rounded-lg" />
            <View className="p-1.5 w-[200] bg-neutral-900 rounded-lg" />
          </View>

          {/* Ratings & Reviews */}
          <View className="mb-8">
            <View className="p-2 w-[180] mb-4 bg-neutral-900 rounded-lg" />
            <View className="flex-row items-center mb-4">
              <View className="p-8 w-[80] mr-6 bg-neutral-900 rounded-lg" />
              <View className="p-1.5 w-[100] bg-neutral-900 rounded-lg" />
            </View>
          </View>

          {/* App Privacy */}
          <View className="mb-8">
            <View className="p-2 w-[140] mb-4 bg-neutral-900 rounded-lg" />
            <View className="items-center justify-center py-12 bg-neutral-900 rounded-2xl">
              <View className="p-6 w-[60] mb-3 bg-black rounded-full" />
              <View className="p-2 w-[160] bg-black rounded-lg" />
            </View>
          </View>

          {/* Information */}
          <View className="mb-6">
            <View className="p-2 w-[120] mb-4 bg-neutral-900 rounded-lg" />
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} className="flex-row justify-between items-center py-3">
                <View className="p-2 w-[100] bg-neutral-900 rounded-lg" />
                <View className="p-2 w-[140] bg-neutral-900 rounded-lg" />
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 110,
    height: 110,
    borderRadius: 28,
    borderCurve: "continuous",
  },
});

// app-store-header-animation 🔼
