import { useState } from "react";
import { View } from "react-native";
import { Button, TextArea, PressableFeedback, useToast } from "heroui-native";
import { usePathname } from "expo-router";
import Constants from "expo-constants";
import { useMutation, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/src/components/shared/app-text";
import { useAppTheme } from "@/src/context/app-theme-context";
import { cn } from "@/src/lib/utils";
import { useTray } from "../engine/tray-provider";

const MAX_LENGTH = 1000;
type Kind = "bug" | "idea";

const COPY: Record<Kind, { title: string; placeholder: string }> = {
  bug: {
    title: "Report a bug",
    placeholder: "What happened? What did you expect instead?",
  },
  idea: {
    title: "Suggest an idea",
    placeholder: "What would you love to see?",
  },
};

function extractErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return "Something went wrong";
  const match = e.message.match(/Uncaught Error: (.+?)(?:\n|$)/);
  return match ? match[1] : e.message;
}

/**
 * Bug | idea report form. Trims + length-bounds client-side; the server
 * re-validates and rate-limits. On error the tray stays open, the typed text is
 * preserved, and an inline message is shown.
 */
export const ReportForm = ({ kind: initialKind }: { kind: Kind }) => {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dismiss } = useTray();
  const { toast } = useToast();
  const posthog = usePostHog();
  const pathname = usePathname();
  const { currentTheme } = useAppTheme();

  const submit = useMutation(api.productFeedback.submit);
  const canSubmit = useQuery(api.productFeedback.canSubmit);

  const isRateLimited = canSubmit === false;
  const isDisabled = isSaving || !text.trim() || isRateLimited;

  const handleSubmit = async () => {
    if (isDisabled) return;
    setIsSaving(true);
    setError(null);
    try {
      await submit({
        kind,
        text: text.trim(),
        context: {
          appVersion: Constants.expoConfig?.version ?? "",
          route: pathname,
          themeName: currentTheme,
          platform: process.env.EXPO_OS ?? "",
        },
      });
      posthog.capture("product_feedback_submitted", { kind });
      toast.show({
        label: "Thank you.",
        description: "We read every piece of feedback.",
      });
      dismiss();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="gap-3">
      <AppText className="text-lg font-semibold text-foreground">
        {COPY[kind].title}
      </AppText>

      {/* bug | idea toggle */}
      <View className="flex-row gap-2">
        {(["bug", "idea"] as const).map((k) => {
          const active = k === kind;
          return (
            <PressableFeedback
              key={k}
              onPress={() => setKind(k)}
              accessibilityLabel={k === "bug" ? "Report a bug" : "Suggest an idea"}
              className={cn(
                "flex-1 items-center rounded-full py-2.5",
                active ? "bg-accent" : "bg-foreground/5",
              )}
            >
              <AppText
                className={cn(
                  "text-sm",
                  active ? "text-accent-foreground" : "text-foreground/60",
                )}
              >
                {k === "bug" ? "Bug" : "Idea"}
              </AppText>
            </PressableFeedback>
          );
        })}
      </View>

      <TextArea
        value={text}
        onChangeText={(t: string) => {
          setText(t);
          setError(null);
        }}
        placeholder={COPY[kind].placeholder}
        maxLength={MAX_LENGTH}
        isDisabled={isSaving}
        className="min-h-30"
        accessibilityHint="Up to 1000 characters"
        autoFocus
      />

      <AppText className="text-xs text-foreground/30 text-right">
        {text.length} / {MAX_LENGTH}
      </AppText>

      {isRateLimited && (
        <AppText className="text-xs text-foreground/50">
          You&apos;ve sent a lot of feedback today — come back tomorrow.
        </AppText>
      )}

      {error && <AppText className="text-xs text-danger/80">{error}</AppText>}

      <Button
        variant="primary"
        onPress={handleSubmit}
        isDisabled={isDisabled}
        accessibilityLabel="Send feedback"
      >
        {isSaving ? "Sending..." : "Send"}
      </Button>
    </View>
  );
};
