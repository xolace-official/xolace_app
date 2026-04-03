import { useEffect, useRef } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useQuery, useMutation } from "convex/react";
import { useToast } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/reflect/pill-button";
import { ReflectionCard } from "@/src/components/peer-reflection/reflection-card";
import { usePathSession } from "@/src/hooks/use-path-session";

export const PeerReflectionScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const startedRef = useRef(false);

  const { sessionId, session, isLoading, startPath } = usePathSession();

  // Start the path on mount
  useEffect(() => {
    if (startedRef.current || !sessionId || !session) return;
    if (session.state === "path_selected") {
      const go = async () => {
        const ok = await startPath();
        if (ok) startedRef.current = true;
      };
      go();
    } else if (session.state === "path_in_progress") {
      startedRef.current = true;
    }
  }, [sessionId, session, startPath]);

  // Guard: no active session (e.g. completed or abandoned externally)
  useEffect(() => {
    if (!isLoading && !sessionId) {
      router.replace('/');
    }
  }, [isLoading, sessionId, router]);

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

  // True when matched returned empty and fallback is still loading
  const awaitingFallback =
    matchedReflections !== undefined &&
    matchedReflections.length === 0 &&
    recentReflections === undefined;

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

  const handleDone = () => {
    router.replace('/session-end?path=peers');
  };

  if (isLoading || matchedReflections === undefined || awaitingFallback) {
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
            onToggleResonance={async () => {
              const result = await toggleResonanceMutation({ reflectionId: reflection._id });
              if (result?.rateLimited) {
                toast.show({
                  label: "Slow down",
                  description: "Take a breath before resonating again.",
                  variant: "default",
                });
              }
            }}
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
