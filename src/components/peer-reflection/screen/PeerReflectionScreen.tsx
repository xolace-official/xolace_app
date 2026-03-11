import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { AppText } from "@/components/shared/app-text";
import { PillButton } from "@/components/reflect/pill-button";
import { ReflectionCard } from "@/components/peer-reflection/reflection-card";

const MOCK_REFLECTIONS = [
  "Some days I feel like I'm performing being okay and no one can tell.",
  "The exhaustion isn't physical. It's from pretending.",
  "I keep waiting for someone to ask how I really am.",
];

export const PeerReflectionScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [resonated, setResonated] = useState<Record<number, boolean>>({});

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)} className="mb-4">
          <AppText className="text-lg leading-7 text-foreground/50">
            Others have felt{"\n"}something like this.
          </AppText>
        </Animated.View>

        {MOCK_REFLECTIONS.map((text, i) => (
          <ReflectionCard
            key={i}
            text={text}
            index={i}
            resonated={!!resonated[i]}
            onToggleResonance={() =>
              setResonated((prev) => ({ ...prev, [i]: !prev[i] }))
            }
          />
        ))}
      </ScrollView>

      <Animated.View
        entering={FadeIn.delay(800).duration(400)}
        className="items-center pb-4"
      >
        <PillButton label="Done" onPress={() => router.back()} />
      </Animated.View>
    </View>
  );
};
