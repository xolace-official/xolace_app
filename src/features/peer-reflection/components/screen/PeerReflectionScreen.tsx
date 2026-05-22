import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Presets } from "react-native-pulsar";
import { MorphLoader } from "@/src/components/shared/loader/morph/morph-loader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { EaseView } from "react-native-ease/uniwind";
import { useQuery, useMutation } from "convex/react";
import { useToast } from "heroui-native";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { PillButton } from "@/src/components/shared/pill-button";
import { ReflectionCard } from "@/src/features/peer-reflection/components/reflection-card";
import { usePathSession } from "@/src/features/sit-with-this/hooks/use-path-session";
import { ReportSheet } from "@/src/features/peer-reflection/components/report-sheet";
import { Id } from "@/convex/_generated/dataModel";

export const PeerReflectionScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const startedRef = useRef(false);

  const { sessionId, session, isLoading, startPath } = usePathSession();
  const posthog = usePostHog();

  useEffect(() => {
    Presets.murmur();
  }, []);

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
      ? { limit: 4 }
      : "skip",
  );

  // True when matched returned empty and fallback is still loading
  const awaitingFallback =
    matchedReflections !== undefined &&
    matchedReflections.length === 0 &&
    recentReflections === undefined;

  const isFallback =
    matchedReflections !== undefined &&
    matchedReflections.length === 0 &&
    (recentReflections?.length ?? 0) > 0;

  const reflections = (
    matchedReflections && matchedReflections.length > 0
      ? matchedReflections
      : recentReflections ?? []
  ) as NonNullable<typeof matchedReflections>;

  // Batch check resonance state from server
  const reflectionIds = reflections.map((r) => r._id);
  const resonatedMap = useQuery(
    api.reflections.hasResonated,
    reflectionIds.length > 0 ? { reflectionIds } : "skip",
  );

  const toggleResonanceMutation = useMutation(api.reflections.toggleResonance);
  const reportReflectionMutation = useMutation(api.reflections.reportReflection);

  const [reportTarget, setReportTarget] = useState<Id<"reflections"> | null>(null);

  const handleReport = async (reason: "offensive" | "self_harm" | "spam" | "other") => {
    if (!reportTarget) return;
    try {
      const result = await reportReflectionMutation({ reflectionId: reportTarget, reason });
      if (result?.rateLimited) {
        toast.show({
          label: "Too many reports",
          description: "You've reported a lot recently. Try again later.",
          variant: "default",
        });
      } else if (result?.alreadyReported) {
        toast.show({
          label: "Already reported",
          description: "You've already flagged this reflection.",
          variant: "default",
        });
      } else {
        toast.show({
          label: "Report received",
          description: "Thanks. We'll review this.",
          variant: "default",
        });
        posthog.capture('peer_reflection_reported', { reason });
      }
    } catch {
      toast.show({
        label: "Something went wrong",
        description: "Try again in a moment.",
        variant: "default",
      });
    }
  };

  const handleDone = () => {
    router.replace('/session-end?path=peers');
  };

  if (isLoading || matchedReflections === undefined || awaitingFallback) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <MorphLoader />
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
        <EaseView
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 400, easing: [0.455, 0.03, 0.515, 0.955] }}
          className="mt-8"
        >
          <PillButton label="Done" onPress={handleDone} />
        </EaseView>
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
        <EaseView
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, easing: [0.455, 0.03, 0.515, 0.955] }}
          className="mb-4"
        >
          <AppText className="text-lg leading-7 text-foreground/50">
            Others have felt{"\n"}something like this.
          </AppText>
          {isFallback && (
            <View className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3">
              <AppText className="text-xs font-medium uppercase tracking-widest text-warning/70">
                No close match found
              </AppText>
              <AppText className="mt-1 text-sm leading-6 text-foreground/50">
                We couldn&apos;t find a close match for what you&apos;re feeling right now.
                {"\n"}These are recent reflections from others; yours could be the first of its kind here.
              </AppText>
            </View>
          )}
        </EaseView>

        {reflections.map((reflection, i) => (
          <ReflectionCard
            key={reflection._id}
            text={reflection.displayText}
            index={i}
            resonanceCount={reflection.resonanceCount}
            resonated={!!resonatedMap?.[reflection._id]}
            onRequestReport={() => setReportTarget(reflection._id)}
            onToggleResonance={async () => {
              try {
                const result = await toggleResonanceMutation({ reflectionId: reflection._id });
                if (result != null && !result.rateLimited) {
                  posthog.capture('peer_resonance_toggled', {
                    resonated: result.resonated,
                    reflection_index: i,
                    is_fallback: isFallback,
                  });
                }
                if (result?.rateLimited) {
                  toast.show({
                    label: "Slow down",
                    description: "Take a breath before resonating again.",
                    variant: "default",
                  });
                }
              } catch {
                toast.show({
                  label: "Something went wrong",
                  description: "Try again in a moment.",
                  variant: "default",
                });
              }
            }}
          />
        ))}
      </ScrollView>

      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 800, easing: [0.455, 0.03, 0.515, 0.955] }}
        className="items-center gap-3 pb-2 pt-1"
      >
        <PillButton label="Done" onPress={handleDone} />
        <AppText className="text-xs text-foreground/25 text-center pb-2">
          Long press any card to report
        </AppText>
      </EaseView>

      <ReportSheet
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
      />
    </View>
  );
};
