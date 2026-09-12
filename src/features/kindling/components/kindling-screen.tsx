import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMutation, useQuery } from "convex/react";
import { useThemeColor, useToast } from "heroui-native";
import { usePostHog } from "posthog-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { ConfirmationDialog } from "@/src/components/shared/confirmation-dialog";
import { MorphLoader } from "@/src/components/shared/loader/morph/morph-loader";
import { playSoftPress } from "@/src/lib/haptics";
import { twigHref, type Twig } from "../twig-presentation";
import { TwigRow } from "./twig-row";

const HEADER_OPTIONS = {
  headerShown: true,
  headerTransparent: true,
  headerTitle: "",
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
} as const;

/**
 * The active-kindling screen (docs/paths-v1.md §9.1, #333) — Variant D:
 * header progress line, then a continuous rail of full-width twig cards.
 * Only ever waits on its own query; generation runs off `completeSession`.
 */
export function KindlingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const posthog = usePostHog();
  const { toast } = useToast();
  const foreground = useThemeColor("foreground") as string;

  const kindling = useQuery(api.paths.getActive, {});
  const skipStep = useMutation(api.paths.skipStep);
  const dismiss = useMutation(api.paths.dismiss);
  const [confirmDismiss, setConfirmDismiss] = useState(false);

  useEffect(() => {
    if (kindling) posthog.capture("path_opened", { pathId: kindling._id });
    // Once per landing, not per re-render of the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindling?._id]);

  const handleBegin = (twig: Twig) => {
    if (!kindling) return;
    playSoftPress();
    posthog.capture("step_started", { pathId: kindling._id, actionType: twig.actionType });
    const href = twigHref(twig, kindling.sessionId);
    if (href) router.push(href);
    else toast.show({ label: "Not quite ready", description: "Playback is on its way." });
  };

  const handleSkip = (twig: Twig) => {
    playSoftPress();
    void skipStep({ stepId: twig._id });
  };

  const handleDismiss = async () => {
    if (!kindling) return;
    await dismiss({ pathId: kindling._id });
    setConfirmDismiss(false);
    router.back();
  };

  if (kindling === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={HEADER_OPTIONS} />
        <MorphLoader />
        <AppText className="mt-6 text-sm text-muted">Setting up your kindling…</AppText>
      </View>
    );
  }

  if (kindling === null) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 44 }}>
        <Stack.Screen options={HEADER_OPTIONS} />
        <View className="px-5 pb-6">
          <AppText className="text-2xl font-semibold text-foreground">Your kindling</AppText>
        </View>
        <View className="flex-1 items-center justify-center px-10 pb-24">
          <SymbolView
            name={{ ios: "leaf", android: "eco", web: "eco" }}
            size={40}
            tintColor={foreground}
          />
          <AppText className="mt-4 text-center text-[15px] text-muted">
            When a session leaves something to sit with, a little kindling shows up here.
          </AppText>
        </View>
      </View>
    );
  }

  const tended = kindling.twigs.filter((t) => t.state === "done").length;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 44 }}>
      <Stack.Screen options={HEADER_OPTIONS} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => setConfirmDismiss(true)}>
          Dismiss
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-5 pb-6">
          <AppText className="text-2xl font-semibold text-foreground">Your kindling</AppText>
          <AppText className="mt-1 text-[15px] text-muted">
            A few things to try, from what your last session held.
          </AppText>
          <View className="mt-4 flex-row items-center gap-3">
            <AppText className="text-[13px] font-medium text-muted">
              {tended} of {kindling.twigs.length} tended
            </AppText>
            <View className="flex-1 flex-row gap-1.5">
              {kindling.twigs.map((t) => (
                <View
                  key={t._id}
                  className={`h-1.5 flex-1 rounded-full ${
                    t.state === "done"
                      ? "bg-accent"
                      : t.state === "skipped"
                        ? "bg-border"
                        : "bg-surface-secondary"
                  }`}
                />
              ))}
            </View>
          </View>
        </View>

        <View className="px-5">
          {kindling.twigs.map((twig, i) => (
            <TwigRow
              key={twig._id}
              twig={twig}
              last={i === kindling.twigs.length - 1}
              onBegin={() => handleBegin(twig)}
              onSkip={() => handleSkip(twig)}
            />
          ))}
        </View>
      </ScrollView>

      <ConfirmationDialog
        isOpen={confirmDismiss}
        onOpenChange={setConfirmDismiss}
        title="Put this kindling out?"
        description="Anything you haven't tended stays untended. A new one comes with your next session."
        confirmLabel="Dismiss"
        onConfirm={handleDismiss}
      />
    </View>
  );
}
