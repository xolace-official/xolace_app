import { useEffect, useRef } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AppText } from "@/components/shared/app-text";
import { PillButton } from "@/components/reflect/pill-button";
import { ReflectionCard } from "@/components/peer-reflection/reflection-card";
import { usePathSession } from "@/hooks/use-path-session";

export const PeerReflectionScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startedRef = useRef(false);

  const { sessionId, session, isLoading, startPath, completePath } =
    usePathSession();

  // Start the path on mount
  useEffect(() => {
    if (startedRef.current || !sessionId || !session) return;
    if (session.state === "path_selected") {
      startedRef.current = true;
      startPath();
    } else if (session.state === "path_in_progress") {
      startedRef.current = true;
    }
  }, [sessionId, session, startPath]);

  // Try matching reflections for this session
  const matchedReflections = useQuery(
    api.reflections.matchForSession,
    sessionId ? { sessionId } : "skip",
  );

  // Fallback: recent reflections when match returns empty
  const recentReflections = useQuery(
    api.reflections.listRecent,
    matchedReflections !== undefined && matchedReflections.length === 0
      ? { limit: 5 }
      : "skip",
  );

  const reflections =
    matchedReflections && matchedReflections.length > 0
      ? matchedReflections
      : recentReflections ?? [];

  // Batch check resonance state from server
  const reflectionIds = reflections.map((r) => r._id);
  const resonatedMap = useQuery(
    api.reflections.hasResonated,
    reflectionIds.length > 0 ? { reflectionIds } : "skip",
  );

  const toggleResonanceMutation = useMutation(api.reflections.toggleResonance);

  const handleDone = async () => {
    await completePath(true);
    router.back();
  };

  if (isLoading || matchedReflections === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (reflections.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <AppText className="text-center text-base text-foreground/40">
          No reflections yet. You&apos;re among the first.
        </AppText>
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          className="mt-8"
        >
          <PillButton label="Done" onPress={handleDone} />
        </Animated.View>
      </View>
    );
  }

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

        {reflections.map((reflection, i) => (
          <ReflectionCard
            key={reflection._id}
            text={reflection.displayText}
            index={i}
            resonanceCount={reflection.resonanceCount}
            resonated={!!resonatedMap?.[reflection._id]}
            onToggleResonance={() =>
              toggleResonanceMutation({ reflectionId: reflection._id })
            }
          />
        ))}
      </ScrollView>

      <Animated.View
        entering={FadeIn.delay(800).duration(400)}
        className="items-center pb-4 pt-1"
      >
        <PillButton label="Done" onPress={handleDone} />
      </Animated.View>
    </View>
  );
};
