import { ScrollView, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { Card, useThemeColor } from "heroui-native";
import { AppText } from "@/components/shared/app-text";
import { MOCK_ENTRIES } from "@/helpers/utils/timeline-mock";

const formatDate = (date: Date) => ({
  day: new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date),
  time: new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date),
});

const SectionLabel = ({ children }: { children: string }) => (
  <AppText className="text-xs tracking-widest uppercase text-foreground/35 mb-3">
    {children}
  </AppText>
);

export const SessionDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor("foreground") as string;

  const entry = MOCK_ENTRIES.find((e) => e.id === id);

  if (!entry) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <AppText className="text-foreground/40">Session not found.</AppText>
      </View>
    );
  }

  const { day, time } = formatDate(entry.timestamp);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Back button */}
        <View className="px-6 pt-3 pb-1">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="self-start"
          >
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "arrow_back",
                web: "arrow_back",
              }}
              size={20}
              tintColor={tintColor}
            />
          </Pressable>
        </View>

        {/* Date + time */}
        <View className="px-6 pt-5 pb-8">
          <AppText className="text-base font-medium text-foreground/50">
            {day}
          </AppText>
          <AppText className="text-base font-medium text-foreground/50 mt-0.5">
            {time}
          </AppText>
        </View>

        {/* YOU SAID */}
        <View className="px-6">
          <SectionLabel>You said</SectionLabel>
          <Card
            variant="tertiary"
            className="border border-foreground/10 rounded-2xl mb-8"
            style={{ borderCurve: "continuous" }}
          >
            <Card.Body className="py-4 px-5">
              <AppText className="text-sm font-light leading-6 text-foreground/55">
                &ldquo;{entry.userText}&rdquo;
              </AppText>
            </Card.Body>
          </Card>

          {/* THE MIRROR */}
          <SectionLabel>The mirror</SectionLabel>
          <AppText className="text-xl font-light italic leading-9 text-foreground mb-8">
            &ldquo;{entry.mirrorText}&rdquo;
          </AppText>

          {/* Emotion row */}
          <View className="flex-row items-center gap-2">
            <AppText className="text-base">
              {entry.emotionEmoji}
            </AppText>
            <AppText className="text-sm text-foreground/60">
              {entry.emotion}
            </AppText>
            <AppText className="text-sm text-foreground/25">·</AppText>
            <AppText className="text-sm text-foreground/40">
              {entry.responseType}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
